import * as THREE from '../extras/three'
import { ethers } from 'ethers'
import { System } from './System'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { AnimationMixer } from 'three'
import { createEmoteFactory } from '../extras/createEmoteFactory'

const EMERGENCE_CONTRACT = '0xD24Fd3721DDCE82595FB737B55f1c5272bcb0413'
const ALCHEMY_URL = 'https://eth-mainnet.g.alchemy.com/v2/tBEM7zTnACO6V9tbxhtS8CT0YDYYA5xb'

// Basic ERC721 ABI for tokenURI
const ERC721_ABI = [
  'function tokenURI(uint256 tokenId) view returns (string)'
]

export class NFTVRMSystem extends System {
  constructor(world) {
    super(world)
    this.base = new THREE.Object3D()
    this.provider = new ethers.JsonRpcProvider(ALCHEMY_URL)
    this.contract = new ethers.Contract(EMERGENCE_CONTRACT, ERC721_ABI, this.provider)
    this.metadataCache = new Map()
    this.loadedVRMs = new Map()
    this.mixers = new Map()
    this.debug = true
    
    // Semi-circle configuration in front of spawn point
    this.numAvatars = 9
    this.radius = 6 // Slightly larger radius to fit 9 VRMs
    this.arcAngle = Math.PI // 180 degrees arc
    this.baseZ = 0 // At the spawn point's Z position

    // Add ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    this.directionalLight.position.set(0, 10, 0)

    // Load idle animation
    this.idleAnimation = null
    this.loadIdleAnimation()
  }

  async start() {
    // Add base and lights to scene
    this.world.stage.scene.add(this.base)
    this.world.stage.scene.add(this.ambientLight)
    this.world.stage.scene.add(this.directionalLight)
    console.log('[NFTVRMSystem] Added base and lights to scene')

    try {
      // Wait for idle animation to load
      await this.loadIdleAnimation()

      // Load VRMs in a semi-circle
      const promises = []

      // Calculate positions in semi-circle around spawn point
      for (let i = 0; i < this.numAvatars; i++) {
        const angle = (Math.PI * 2 / this.numAvatars) * i
        const position = {
          x: Math.sin(angle) * this.radius,
          y: 0,
          z: Math.cos(angle) * this.radius
        }
        
        // Calculate angle to face spawn point (0,0,0)
        const angleToOrigin = Math.atan2(-position.x, -position.z) + Math.PI
        
        const tokenId = i + 1
        promises.push(this.loadAndPositionVRM(tokenId, position, angleToOrigin))
      }

      await Promise.all(promises)
      console.log('[NFTVRMSystem] Successfully loaded all VRMs in semi-circle')

    } catch (error) {
      console.error('[NFTVRMSystem] Error loading VRM grid:', error)
    }
  }

  async loadAndPositionVRM(tokenId, position, angleToOrigin) {
    try {
      console.log(`[NFTVRMSystem] Loading VRM for token ${tokenId} at position:`, position)
      
      // Get metadata first for the image
      const metadata = await this.getMetadata(tokenId)
      console.log(`[NFTVRMSystem] Metadata for token ${tokenId}:`, metadata)
      
      // Handle both image and image_url fields
      const imageUrl = (metadata.image || metadata.image_url)?.replace('ipfs://', 'https://ipfs.io/ipfs/')
      
      if (imageUrl) {
        console.log(`[NFTVRMSystem] Loading image from URL: ${imageUrl}`)
        try {
          // Create image plane using world.loader
          const texture = await this.world.loader.load('texture', imageUrl)
          const aspectRatio = texture.image.width / texture.image.height
          const width = 1.5 // Slightly smaller width
          const height = width / aspectRatio
          
          const geometry = new THREE.PlaneGeometry(width, height)
          const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
          })
          const imagePlane = new THREE.Mesh(geometry, material)
          
          // Position image plane above VRM
          const imagePosition = {
            x: position.x * 0.9, // Move 10% closer to center
            y: .75, // Lower height
            z: position.z * 0.9 // Move 10% closer to center
          }
          imagePlane.position.set(imagePosition.x, imagePosition.y, imagePosition.z)
          
          // Make image face spawn point
          imagePlane.rotation.y = angleToOrigin
          
          this.base.add(imagePlane)
          console.log(`[NFTVRMSystem] Added image plane for token ${tokenId} at:`, imagePosition)
        } catch (error) {
          console.error(`[NFTVRMSystem] Error loading image for token ${tokenId}:`, error)
        }
      }
      
      // Load and position VRM
      const vrm = await this.loadVRM(tokenId)
      
      if (vrm && vrm.scene) {
        // Scale the VRM
        vrm.scene.scale.setScalar(1.5)
        
        // Position the VRM
        vrm.scene.position.set(position.x, position.y, position.z)
        
        // Make VRM face spawn point
        vrm.scene.rotation.y = angleToOrigin
        
        this.base.add(vrm.scene)
        this.loadedVRMs.set(tokenId, vrm)

        // Create animation mixer for this VRM
        if (this.idleAnimation) {
          const mixer = new AnimationMixer(vrm.scene)
          
          // Get VRM version - default to '0' for VRM 0.x
          const version = vrm.meta?.metaVersion || '0'
          console.log(`[NFTVRMSystem] VRM ${tokenId} version:`, version)
          
          // For VRM 0.x, we need to use humanBones directly
          const getBoneNode = (boneName) => {
            if (version === '0') {
              // VRM 0.x stores bones differently
              const bones = vrm.humanoid._rawHumanBones?.humanBones
              const bone = bones?.[boneName]?.node
              if (!bone) {
                console.warn(`[NFTVRMSystem] Could not find VRM 0.x bone ${boneName} for VRM ${tokenId}`)
                return undefined
              }
              return bone
            } else {
              // VRM 1.0
              const node = vrm.humanoid.getNormalizedBoneNode(boneName)
              if (!node) {
                console.warn(`[NFTVRMSystem] Could not find VRM 1.0 bone ${boneName} for VRM ${tokenId}`)
                return undefined
              }
              return node
            }
          }

          // Get root-to-hips height
          const hipsNode = getBoneNode('hips')
          const rootToHips = hipsNode ? hipsNode.position.y : 1
          
          // Get VRM specific animation clip
          const clip = this.idleAnimation.toClip({
            rootToHips,
            version,
            getBoneName: (boneName) => getBoneNode(boneName)?.name
          })
          
          const action = mixer.clipAction(clip)
          
          // Add random time offset
          const offset = Math.random() * clip.duration
          action.time = offset
          
          action.play()
          this.mixers.set(tokenId, { mixer, vrm })
          
          console.log(`[NFTVRMSystem] Applied animation to VRM ${tokenId}`)
        }
        
        console.log(`[NFTVRMSystem] Positioned VRM ${tokenId} at:`, position)
      } else {
        console.error(`[NFTVRMSystem] Failed to load VRM ${tokenId} - no scene available`)
      }
    } catch (error) {
      console.error(`[NFTVRMSystem] Error loading/positioning VRM ${tokenId}:`, error)
    }
  }

  async getMetadata(tokenId) {
    const cacheKey = `metadata/${tokenId}`
    if (this.metadataCache.has(cacheKey)) {
      return this.metadataCache.get(cacheKey)
    }

    try {
      console.log(`[NFTVRMSystem] Fetching metadata for token ${tokenId}`)
      const tokenURI = await this.contract.tokenURI(tokenId)
      const url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
      const response = await fetch(url)
      const metadata = await response.json()
      
      this.metadataCache.set(cacheKey, metadata)
      console.log(`[NFTVRMSystem] Successfully cached metadata for token ${tokenId}`)
      return metadata
    } catch (error) {
      console.error(`[NFTVRMSystem] Error fetching metadata for token ${tokenId}:`, error)
      throw error
    }
  }

  async getVRMUrl(tokenId) {
    const metadata = await this.getMetadata(tokenId)
    if (!metadata.animation_url) {
      throw new Error('No VRM URL found in metadata')
    }
    return metadata.animation_url.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }

  async loadVRM(tokenId) {
    try {
      const url = await this.getVRMUrl(tokenId)
      console.log(`[NFTVRMSystem] Loading VRM from URL:`, url)

      // Load directly from URL if we're on the client
      if (this.world.isClient) {
        const gltf = await this.world.loader.load('glb', url)
        const vrm = gltf.userData.vrm
        
        if (!vrm) {
          throw new Error('No VRM data found in GLTF')
        }
        
        console.log(`[NFTVRMSystem] Successfully loaded VRM for token ${tokenId}`)
        return vrm
      }
      
      // Server-side loading
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      
      return new Promise((resolve, reject) => {
        this.world.loader.gltfLoader.parse(
          arrayBuffer,
          '',
          (gltf) => {
            const vrm = gltf.userData.vrm
            if (!vrm) {
              reject(new Error('No VRM data found in GLTF'))
              return
            }
            console.log(`[NFTVRMSystem] Successfully loaded VRM for token ${tokenId}`)
            resolve(vrm)
          },
          (error) => {
            reject(error)
          }
        )
      })

    } catch (error) {
      console.error(`[NFTVRMSystem] Error loading VRM for token ${tokenId}:`, error)
      throw error
    }
  }

  async loadIdleAnimation() {
    try {
      console.log('[NFTVRMSystem] Loading idle animation from asset://emote-idle.glb')
      const gltf = await this.world.loader.load('glb', 'asset://emote-idle.glb')
      console.log('[NFTVRMSystem] Loaded GLTF:', gltf)
      
      // Add a root bone if missing
      const scene = gltf.scene
      let rootBone = scene.getObjectByName('Root')
      if (!rootBone) {
        console.log('[NFTVRMSystem] Adding missing root bone to idle animation')
        rootBone = new THREE.Bone()
        rootBone.name = 'Root'
        scene.add(rootBone)
        
        // Find the armature/skeleton
        const armature = scene.children.find(child => 
          child.type === 'Bone' || 
          child.name.toLowerCase().includes('armature')
        )
        
        if (armature) {
          console.log('[NFTVRMSystem] Found armature:', armature)
          // Make the armature a child of the root bone
          rootBone.add(armature)
        } else {
          console.warn('[NFTVRMSystem] No armature found in idle animation')
        }
      }
      
      console.log('[NFTVRMSystem] Creating emote factory')
      const emoteFactory = createEmoteFactory(gltf)
      this.idleAnimation = emoteFactory
      console.log('[NFTVRMSystem] Successfully loaded idle animation')
      return gltf
    } catch (error) {
      console.error('[NFTVRMSystem] Error loading idle animation:', error)
      throw error
    }
  }

  update(delta) {
    // Update all animation mixers and VRMs
    for (const [tokenId, { mixer, vrm }] of this.mixers) {
      mixer.update(delta)
      vrm.update(delta)
    }
  }
}
