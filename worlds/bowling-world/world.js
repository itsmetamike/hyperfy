export default {
  systems: [
    {
      id: 'doubleJump',
      system: () => import('../../src/core/systems/DoubleJump')
    }
  ],
  entities: [
    {
      type: 'app',
      app: 'bowling'
    }
  ]
}
