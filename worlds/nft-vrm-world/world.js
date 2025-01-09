export default {
  name: 'NFT VRM World',
  systems: [
    {
      id: 'nftvrm',
      system: () => import('../../src/core/systems/NFTVRMSystem')
    },
    'Stage',
    'Physics',
    'ClientLoader',
    'ServerLoader',
    'ClientGraphics',
    'ClientControls',
    'ClientEnvironment'
  ],
  entities: [
    {
      type: 'app',
      app: 'nftvrm'
    },
    {
      type: 'environment',
      environment: 'default'
    },
    {
      type: 'light',
      light: 'ambient',
      intensity: 1
    },
    {
      type: 'light',
      light: 'directional',
      position: [5, 10, 5],
      intensity: 1
    }
  ]
}
