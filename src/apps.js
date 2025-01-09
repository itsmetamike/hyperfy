import { NFTVRMSystem } from './core/systems/NFTVRMSystem'
// import { Bowling } from './core/systems/Bowling'

export const apps = {
  nftvrm: NFTVRMSystem,
  // bowling: Bowling
}

export function registerApps(world) {
  console.log('[Apps] Registering systems...')
  world.register('nftvrm', NFTVRMSystem)
  // world.register('bowling', Bowling)
  console.log('[Apps] Systems registered')
}
