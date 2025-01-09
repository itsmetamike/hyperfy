export default {
  systems: [
    // {
    //   id: 'floatingObjects',
    //   system: () => import('../../src/core/systems/FloatingObjects')
    // },
    {
      id: 'doubleJump',
      system: () => import('../../src/core/systems/DoubleJump')
    }
  ],
  entities: [
    // {
    //   type: 'app',
    //   app: 'floating-controls',
    //   ui: true
    // },
    {
      type: 'app',
      app: 'bowling',
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1]
    }
  ]
}
