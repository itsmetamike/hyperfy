import 'ses'
import '../core/lockdown'
import './bootstrap'

import fs from 'fs-extra'
import path from 'path'
import { pipeline } from 'stream/promises'
import Fastify from 'fastify'
import ws from '@fastify/websocket'
import cors from '@fastify/cors'
import compress from '@fastify/compress'
import statics from '@fastify/static'
import multipart from '@fastify/multipart'

import { loadPhysX } from './physx/loadPhysX'

import { createServerWorld } from '../core/createServerWorld'
import { hashFile } from '../core/utils-server'
import { getDB } from './db'

const rootDir = path.join(__dirname, '../')
const worldDir = path.join(rootDir, process.env.WORLD)
const assetsDir = path.join(worldDir, '/assets')
const port = process.env.PORT

await fs.ensureDir(worldDir)
await fs.ensureDir(assetsDir)

// copy core assets
await fs.copy(path.join(rootDir, 'src/core/assets'), path.join(assetsDir))

const db = await getDB(path.join(worldDir, '/db.sqlite'))

const world = createServerWorld()
world.init({ db, loadPhysX })

const fastify = Fastify({ logger: { level: 'error' } })

fastify.register(cors)
fastify.register(compress)
fastify.register(statics, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  decorateReply: false,
  setHeaders: res => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  },
})
fastify.register(statics, {
  root: assetsDir,
  prefix: '/assets/',
  decorateReply: false,
  setHeaders: res => {
    // all assets are hashed & immutable so we can use aggressive caching
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable') // 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString()) // older browsers
  },
})
fastify.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
})
fastify.register(ws)
fastify.register(worldNetwork)

const publicEnvs = {}
for (const key in process.env) {
  if (key.startsWith('PUBLIC_')) {
    const value = process.env[key]
    publicEnvs[key] = value
  }
}
const envsCode = `
  if (!globalThis.process) globalThis.process = {}
  globalThis.process.env = ${JSON.stringify(publicEnvs)}
`
fastify.get('/env.js', async (req, reply) => {
  reply.type('application/javascript').send(envsCode)
})

fastify.post('/api/upload', async (req, reply) => {
  // console.log('DEBUG: slow uploads')
  // await new Promise(resolve => setTimeout(resolve, 2000))

  const file = await req.file()
  const ext = file.filename.split('.').pop().toLowerCase()
  // create temp buffer to store contents
  const chunks = []
  for await (const chunk of file.file) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)
  // hash from buffer
  const hash = await hashFile(buffer)
  const filename = `${hash}.${ext}`
  // save to fs
  const filePath = path.join(assetsDir, filename)
  const exists = await fs.exists(filePath)
  if (!exists) {
    await fs.writeFile(filePath, buffer)
  }
})

fastify.get('/health', async (request, reply) => {
  try {
    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }

    return reply.code(200).send(health)
  } catch (error) {
    console.error('Health check failed:', error)
    return reply.code(503).send({
      status: 'error',
      timestamp: new Date().toISOString(),
    })
  }
})

fastify.get('/api/dexscreener', async (request, reply) => {
  try {
    let { chain = 'solana', contractAddress } = request.query;
    
    // Normalize chain name to lowercase
    chain = chain.toLowerCase();
    
    console.log('Starting price data fetch from DexScreener for chain:', chain, 'search:', contractAddress);

    // Define native tokens for different chains
    const nativeTokens = {
      'solana': ['SOL', 'WSOL'],
      'ethereum': ['ETH', 'WETH'],
      'bsc': ['BNB', 'WBNB'],
      'arbitrum': ['ETH', 'WETH'],
      'polygon': ['MATIC', 'WMATIC'],
      'avalanche': ['AVAX', 'WAVAX'],
      'sui': ['SUI', 'WSUI'],
      'base': ['ETH', 'WETH'],
      'pulsechain': ['PLS', 'WPLS'],
      'ton': ['TON', 'WTON']
    };

    // Validate chain name
    if (!nativeTokens[chain]) {
      return reply.code(400).send({
        error: 'Invalid chain name',
        validChains: Object.keys(nativeTokens)
      });
    }

    if (!contractAddress) {
      return reply.code(400).send({
        error: 'Contract address is required'
      });
    }

    // Always search first
    const searchResponse = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${contractAddress}`);
    console.log('DexScreener search response status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('DexScreener search error response:', errorText);
      throw new Error(`DexScreener Search API error: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log('DexScreener search results:', JSON.stringify(searchData, null, 2));

    // Get native tokens for the selected chain
    const chainNativeTokens = nativeTokens[chain] || [];
    
    // Find all pairs for this token on the specified chain
    const chainPairs = searchData.pairs?.filter(pair => pair.chainId === chain);

    if (!chainPairs?.length) {
      return reply.code(404).send({
        error: `No pairs found for this token on ${chain}`
      });
    }

    // First try to find a pair with native token
    let targetPair = chainPairs.find(pair => 
      chainNativeTokens.includes(pair.quoteToken.symbol)
    );

    // If no native pair found, use the first pair with highest liquidity
    if (!targetPair) {
      targetPair = chainPairs.reduce((prev, current) => {
        const prevLiq = prev.liquidity?.usd || 0;
        const currentLiq = current.liquidity?.usd || 0;
        return currentLiq > prevLiq ? current : prev;
      }, chainPairs[0]);
    }

    // Get detailed data for the selected pair
    const pairResponse = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}/${targetPair.pairAddress}`);
    console.log('DexScreener pair response status:', pairResponse.status);

    if (!pairResponse.ok) {
      const errorText = await pairResponse.text();
      console.error('DexScreener pair error response:', errorText);
      throw new Error(`DexScreener Pair API error: ${pairResponse.status} - ${errorText}`);
    }

    const pairData = await pairResponse.json();
    console.log('DexScreener pair data:', JSON.stringify(pairData, null, 2));

    return reply.send(pairData);
  } catch (error) {
    console.error('Error in /api/dexscreener:', error);
    return reply.code(500).send({ 
      error: 'Failed to fetch price data',
      details: error.message
    });
  }
})

fastify.setErrorHandler((err, req, reply) => {
  console.error(err)
  reply.status(500).send()
})

try {
  await fastify.listen({ port, host: '0.0.0.0' })
} catch (err) {
  console.error(err)
  console.error(`failed to launch on port ${port}`)
  process.exit(1)
}

async function worldNetwork(fastify) {
  fastify.get('/ws', { websocket: true }, (ws, req) => {
    world.network.onConnection(ws, req.query.authToken)
  })
}

console.log(`running on port ${port}`)