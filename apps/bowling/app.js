import * as THREE from 'three'
import { createNode } from '../../src/core/extras/createNode'
import { Layers } from '../../src/core/extras/Layers'

export default async function init(world, base) {
  console.log('[Bowling] Initializing...', { world, base })
  
  try {
    // Add base to scene
    world.stage.scene.add(base)
    console.log('[Bowling] Added base to scene')

    // Create physics material and flags
    const physicsMaterial = world.physics.physics.createMaterial(0.5, 0.5, 0.3)
    const flags = new PHYSX.PxShapeFlags(
      PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | 
      PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE |
      PHYSX.PxShapeFlagEnum.eVISUALIZATION
    )
    console.log('[Bowling] Created physics material and flags')

    // Create 10 pins in triangle formation
    const pins = []
    const pinPositions = [
      [0, 1, -20],      // Front pin (raised up)
      [-0.8, 1, -21],   // Second row
      [0.8, 1, -21],
      [-1.6, 1, -22],   // Third row
      [0, 1, -22],
      [1.6, 1, -22],
      [-2.4, 1, -23],   // Fourth row
      [-0.8, 1, -23],
      [0.8, 1, -23],
      [2.4, 1, -23],
    ]

    console.log('[Bowling] Creating pins with positions:', pinPositions)
    pinPositions.forEach((pos, index) => {
      console.log(`[Bowling] Creating pin ${index + 1} at position:`, pos)
      const pin = createNode({
        name: 'pin',
        position: pos,
        type: 'mesh',
        geometry: new THREE.BoxGeometry(0.2, 0.8, 0.2), // Made pins bigger
        material: new THREE.MeshStandardMaterial({ 
          color: 0xffffff,
          roughness: 0.5,
          metalness: 0.2
        })
      })
      
      // Create physics shape for pin
      const physicsGeometry = new PHYSX.PxBoxGeometry(0.1, 0.4, 0.1) // Half-dimensions
      const shape = world.physics.physics.createShape(physicsGeometry, physicsMaterial, true, flags)
      
      // Set collision filters
      const filterData = new PHYSX.PxFilterData(
        Layers.environment.group,
        Layers.environment.mask,
        0,
        0
      )
      shape.setQueryFilterData(filterData)
      shape.setSimulationFilterData(filterData)
      
      // Set collision offsets
      shape.setContactOffset(0.05)
      shape.setRestOffset(0.01)

      // Create and position rigid body
      const transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
      transform.p.x = pos[0]
      transform.p.y = pos[1]
      transform.p.z = pos[2]
      
      const body = world.physics.physics.createRigidDynamic(transform)
      body.attachShape(shape)
      world.physics.scene.addActor(body)
      
      console.log(`[Bowling] Pin ${index + 1} physics added`)
      
      pins.push(pin)
      base.add(pin)
      console.log(`[Bowling] Pin ${index + 1} added to scene`)
    })
    console.log('[Bowling] All pins created:', pins.length)

    // Add bowling lane
    console.log('[Bowling] Creating lane...')
    const lane = createNode({
      name: 'lane',
      position: [0, 0, -10], // Moved to ground level
      type: 'mesh',
      geometry: new THREE.BoxGeometry(5, 0.1, 30),
      material: new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.8 
      })
    })
    
    // Create physics shape for lane
    const laneGeometry = new PHYSX.PxBoxGeometry(2.5, 0.05, 15) // Half-dimensions
    const laneShape = world.physics.physics.createShape(laneGeometry, physicsMaterial, true, flags)
    
    // Set collision filters
    const laneFilterData = new PHYSX.PxFilterData(
      Layers.environment.group,
      Layers.environment.mask,
      0,
      0
    )
    laneShape.setQueryFilterData(laneFilterData)
    laneShape.setSimulationFilterData(laneFilterData)
    
    // Create and position rigid body
    const laneTransform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    laneTransform.p.x = 0
    laneTransform.p.y = 0
    laneTransform.p.z = -10
    
    const laneBody = world.physics.physics.createRigidStatic(laneTransform)
    laneBody.attachShape(laneShape)
    world.physics.scene.addActor(laneBody)
    
    base.add(lane)
    console.log('[Bowling] Lane added to scene')

    // Add gutters
    console.log('[Bowling] Creating gutters...')
    const leftGutter = createNode({
      name: 'leftGutter',
      position: [-2.75, 0, -10],
      type: 'mesh',
      geometry: new THREE.BoxGeometry(0.5, 0.2, 30),
      material: new THREE.MeshStandardMaterial({ color: 0x404040 })
    })
    
    // Create physics shape for left gutter
    const gutterGeometry = new PHYSX.PxBoxGeometry(0.25, 0.1, 15) // Half-dimensions
    const leftGutterShape = world.physics.physics.createShape(gutterGeometry, physicsMaterial, true, flags)
    
    // Set collision filters
    leftGutterShape.setQueryFilterData(laneFilterData)
    leftGutterShape.setSimulationFilterData(laneFilterData)
    
    // Create and position rigid body
    const leftGutterTransform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    leftGutterTransform.p.x = -2.75
    leftGutterTransform.p.y = 0
    leftGutterTransform.p.z = -10
    
    const leftGutterBody = world.physics.physics.createRigidStatic(leftGutterTransform)
    leftGutterBody.attachShape(leftGutterShape)
    world.physics.scene.addActor(leftGutterBody)
    
    base.add(leftGutter)
    console.log('[Bowling] Left gutter added to scene')

    const rightGutter = createNode({
      name: 'rightGutter',
      position: [2.75, 0, -10],
      type: 'mesh',
      geometry: new THREE.BoxGeometry(0.5, 0.2, 30),
      material: new THREE.MeshStandardMaterial({ color: 0x404040 })
    })
    
    // Create physics shape for right gutter
    const rightGutterShape = world.physics.physics.createShape(gutterGeometry, physicsMaterial, true, flags)
    
    // Set collision filters
    rightGutterShape.setQueryFilterData(laneFilterData)
    rightGutterShape.setSimulationFilterData(laneFilterData)
    
    // Create and position rigid body
    const rightGutterTransform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    rightGutterTransform.p.x = 2.75
    rightGutterTransform.p.y = 0
    rightGutterTransform.p.z = -10
    
    const rightGutterBody = world.physics.physics.createRigidStatic(rightGutterTransform)
    rightGutterBody.attachShape(rightGutterShape)
    world.physics.scene.addActor(rightGutterBody)
    
    base.add(rightGutter)
    console.log('[Bowling] Right gutter added to scene')

    // Handle player collision with pins
    console.log('[Bowling] Setting up collision handler...')
    world.physics.on('collision', (e) => {
      const { bodyA, bodyB } = e
      // Check if one of the bodies is the player and the other is a pin
      if ((bodyA.isPlayer && pins.includes(bodyB)) || 
          (bodyB.isPlayer && pins.includes(bodyA))) {
        // Apply force in the direction of player movement
        const pin = pins.includes(bodyA) ? bodyA : bodyB
        const player = bodyA.isPlayer ? bodyA : bodyB
        
        // Calculate force direction based on player velocity
        const force = player.velocity.clone().multiplyScalar(5)
        pin.applyForce(force)
        console.log('[Bowling] Applied force to pin:', force)
      }
    })

    console.log('[Bowling] Setup complete!')
    return () => {
      // Cleanup
      console.log('[Bowling] Cleaning up...')
      pins.forEach(pin => {
        pin.destroy()
        world.physics.scene.removeActor(pin.body)
      })
      world.physics.scene.removeActor(laneBody)
      world.physics.scene.removeActor(leftGutterBody)
      world.physics.scene.removeActor(rightGutterBody)
      lane.destroy()
      leftGutter.destroy()
      rightGutter.destroy()
      console.log('[Bowling] Cleanup complete')
    }
  } catch (error) {
    console.error('[Bowling] Error:', error)
    console.error('[Bowling] Stack:', error.stack)
  }
}
