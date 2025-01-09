import * as THREE from '../extras/three'
import { System } from './System'
import { Layers } from '../extras/Layers'

export class Bowling extends System {
  constructor(world) {
    super(world)
    this.base = new THREE.Object3D()
    this.pins = []
    this.debug = true  // Enable debug logging
  }

  async start() {
    // Add base to scene
    this.world.stage.scene.add(this.base)
    console.log('[Bowling] Added base to scene')

    // Set up physics collision callbacks
    if (this.world.physics && this.world.physics.scene) {
      console.log('[Bowling] Setting up physics collision callbacks')
      this.world.physics.scene.setSimulationEventCallback({
        onContact: (pairs) => {
          for (let i = 0; i < pairs.size(); i++) {
            const pair = pairs.get(i)
            console.log('[Bowling] Collision detected:', {
              actor1: pair.actor0,
              actor2: pair.actor1,
              type: 'contact'
            })
          }
        },
        onTrigger: (pairs) => {
          for (let i = 0; i < pairs.size(); i++) {
            const pair = pairs.get(i)
            console.log('[Bowling] Trigger detected:', {
              actor1: pair.actor0,
              actor2: pair.actor1,
              type: 'trigger'
            })
          }
        }
      })
    } else {
      console.warn('[Bowling] Physics system not initialized yet')
    }

    try {
      // Load pin model and extract mesh for physics
      const pinGLB = await this.world.loader.load('glb', 'asset://bowling-pin.glb')
      console.log('[Bowling] GLB loaded successfully:', pinGLB)

      // Find the first mesh in the scene
      let pinMesh = null
      pinGLB.scene.traverse((child) => {
        if (child.isMesh && !pinMesh) {
          pinMesh = child
        }
      })

      if (!pinMesh) {
        console.error('[Bowling] Could not find mesh in GLB')
        return
      }

      // Create physics material
      const physicsMaterial = this.world.physics.physics.createMaterial(0.5, 0.3, 0.5)
      
      // Create shape flags
      const flags = new PHYSX.PxShapeFlags(
        PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | 
        PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE |
        PHYSX.PxShapeFlagEnum.eVISUALIZATION
      )
      
      // Create 10 pins in triangle formation with standard bowling spacing
      const pinPositions = [
        [0, 0, -16],      // Front pin
        [-0.3, 0, -16.5], // Second row
        [0.3, 0, -16.5],
        [-0.6, 0, -17],   // Third row
        [0, 0, -17],
        [0.6, 0, -17],
        [-0.9, 0, -17.5], // Fourth row
        [-0.3, 0, -17.5],
        [0.3, 0, -17.5],
        [0.9, 0, -17.5],
      ]

      console.log('[Bowling] Creating pins...')
      console.log('[Bowling] GLB scene children:', pinGLB.scene.children)
      
      pinPositions.forEach((pos, index) => {
        // Create pin mesh from GLB
        const pin = pinGLB.scene.clone()
        console.log(`[Bowling] Creating pin ${index} at position:`, pos)
        console.log(`[Bowling] Pin children:`, pin.children)
        
        pin.position.set(pos[0], pos[1], pos[2]) // Raise pins to match new size (0.4 * 8)
        pin.scale.set(0.5, 0.5, 0.5) // Scale to 8x original size
        pin.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        // Create base sphere (heavier, wider base)
        const baseShape = new PHYSX.PxSphereGeometry(0.15)  // Wide base
        const baseShapeObj = this.world.physics.physics.createShape(baseShape, physicsMaterial, true, flags)
        
        // Create top capsule (lighter, narrower top)
        const topShape = new PHYSX.PxCapsuleGeometry(0.08, 0.25)  // Narrower top
        const topTransform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
        topTransform.p.y = 0.3  // Position above base
        const topShapeObj = this.world.physics.physics.createShape(topShape, physicsMaterial, true, flags)
        topShapeObj.setLocalPose(topTransform)
        
        // Set collision filters
        const filterData = new PHYSX.PxFilterData(
          Layers.prop.group | Layers.environment.group,
          Layers.prop.mask | Layers.environment.mask,
          0,
          0
        )
        
        baseShapeObj.setQueryFilterData(filterData)
        baseShapeObj.setSimulationFilterData(filterData)
        topShapeObj.setQueryFilterData(filterData)
        topShapeObj.setSimulationFilterData(filterData)
        
        // Collision settings
        baseShapeObj.setContactOffset(0.005)
        baseShapeObj.setRestOffset(0.0)
        topShapeObj.setContactOffset(0.005)
        topShapeObj.setRestOffset(0.0)

        // Create transform just above ground
        const transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
        transform.p.x = pos[0]
        transform.p.y = pos[1] + 0.15  // Half height of base
        transform.p.z = pos[2]
        
        const body = this.world.physics.physics.createRigidDynamic(transform)
        
        // Attach both shapes
        body.attachShape(baseShapeObj)
        body.attachShape(topShapeObj)
        
        // Physics settings
        body.setMass(1.6)  // Total mass
        body.setLinearDamping(0.3)  // Increased to reduce sliding
        body.setAngularDamping(0.6)  // Increased to reduce spinning
        
        // More solver iterations for stability
        body.setSolverIterationCounts(6, 3)
        
        // Lower velocity limits
        body.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eENABLE_CCD, true)
        body.setMaxLinearVelocity(15.0)  // Reduced max velocity
        body.setMaxAngularVelocity(6.0)  // Reduced max rotation
        body.setSleepThreshold(0.1)
        
        // Ensure gravity is enabled
        body.setActorFlag(PHYSX.PxActorFlagEnum.eDISABLE_GRAVITY, false)
        
        console.log('[Bowling] Rigid body properties set:', {
          mass: 1.6,
          linearDamping: 0.3,
          angularDamping: 0.6,
          maxAngularVelocity: 6.0,
          sleepThreshold: 0.1,
          ccdEnabled: true,
          maxLinearVelocity: 15.0,
          solverIterations: [6, 3],
          gravityEnabled: true
        })
        
        this.world.physics.scene.addActor(body)
        console.log(`[Bowling] Pin ${index} physics setup complete`)
        
        pin.body = body // Store reference to physics body
        pin.index = index // Store pin index for debugging
        this.pins.push(pin)
        this.base.add(pin)
      })
      console.log('[Bowling] Pins created:', this.pins.length)

      // Add bowling lane
      const lane = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.1, 24),
        new THREE.MeshStandardMaterial({ 
          color: 0x8B4513,
          roughness: 0.8 
        })
      )
      lane.position.set(0, -0.04, -8)
      lane.receiveShadow = true
      
      // Add physics to lane
      const laneMaterial = this.world.physics.physics.createMaterial(0.2, 0.2, 0.3)
      const laneFlags = new PHYSX.PxShapeFlags(
        PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | 
        PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE |
        PHYSX.PxShapeFlagEnum.eVISUALIZATION
      )

      // Create physics shape for lane
      const laneGeometry = new PHYSX.PxBoxGeometry(2, 0.04, 12) // Half-dimensions
      const laneShape = this.world.physics.physics.createShape(laneGeometry, laneMaterial, true, laneFlags)
      
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
      laneTransform.p.y = -0.04
      laneTransform.p.z = -8
      
      const laneBody = this.world.physics.physics.createRigidStatic(laneTransform)
      laneBody.attachShape(laneShape)
      this.world.physics.scene.addActor(laneBody)
      
      this.base.add(lane)

      // Add gutters
      const leftGutter = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.16, 24),
        new THREE.MeshStandardMaterial({ color: 0x404040 })
      )
      
      leftGutter.position.set(-2.2, 0, -8)
      leftGutter.receiveShadow = true
      
      // Add physics to left gutter
      const leftGutterMaterial = this.world.physics.physics.createMaterial(0.2, 0.2, 0.3)
      const leftGutterFlags = new PHYSX.PxShapeFlags(
        PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | 
        PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE |
        PHYSX.PxShapeFlagEnum.eVISUALIZATION
      )

      // Create physics shape for left gutter
      const leftGutterGeometry = new PHYSX.PxBoxGeometry(0.2, 0.08, 12) // Half-dimensions
      const leftGutterShape = this.world.physics.physics.createShape(leftGutterGeometry, leftGutterMaterial, true, leftGutterFlags)
      
      // Set collision filters
      const leftGutterFilterData = new PHYSX.PxFilterData(
        Layers.environment.group,
        Layers.environment.mask,
        0,
        0
      )
      leftGutterShape.setQueryFilterData(leftGutterFilterData)
      leftGutterShape.setSimulationFilterData(leftGutterFilterData)
      
      // Create and position rigid body
      const leftGutterTransform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
      leftGutterTransform.p.x = -2.2
      leftGutterTransform.p.y = 0
      leftGutterTransform.p.z = -8
      
      const leftGutterBody = this.world.physics.physics.createRigidStatic(leftGutterTransform)
      leftGutterBody.attachShape(leftGutterShape)
      this.world.physics.scene.addActor(leftGutterBody)
      
      this.base.add(leftGutter)

      const rightGutter = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.16, 24),
        new THREE.MeshStandardMaterial({ color: 0x404040 })
      )
      
      rightGutter.position.set(2.2, 0, -8)
      rightGutter.receiveShadow = true
      
      // Add physics to right gutter
      const rightGutterMaterial = this.world.physics.physics.createMaterial(0.2, 0.2, 0.3)
      const rightGutterFlags = new PHYSX.PxShapeFlags(
        PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | 
        PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE |
        PHYSX.PxShapeFlagEnum.eVISUALIZATION
      )

      // Create physics shape for right gutter
      const rightGutterGeometry = new PHYSX.PxBoxGeometry(0.2, 0.08, 12) // Half-dimensions
      const rightGutterShape = this.world.physics.physics.createShape(rightGutterGeometry, rightGutterMaterial, true, rightGutterFlags)
      
      // Set collision filters
      const rightGutterFilterData = new PHYSX.PxFilterData(
        Layers.environment.group,
        Layers.environment.mask,
        0,
        0
      )
      rightGutterShape.setQueryFilterData(rightGutterFilterData)
      rightGutterShape.setSimulationFilterData(rightGutterFilterData)
      
      // Create and position rigid body
      const rightGutterTransform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
      rightGutterTransform.p.x = 2.2
      rightGutterTransform.p.y = 0
      rightGutterTransform.p.z = -8
      
      const rightGutterBody = this.world.physics.physics.createRigidStatic(rightGutterTransform)
      rightGutterBody.attachShape(rightGutterShape)
      this.world.physics.scene.addActor(rightGutterBody)
      
      this.base.add(rightGutter)

      // Handle player collision with pins
      this.world.physics.on('collision', (e) => {
        const { bodyA, bodyB } = e
        // Check if one of the bodies is the player and the other is a pin
        if ((bodyA.isPlayer && this.pins.includes(bodyB)) || 
            (bodyB.isPlayer && this.pins.includes(bodyA))) {
          // Apply force in the direction of player movement
          const pin = this.pins.includes(bodyA) ? bodyA : bodyB
          const player = bodyA.isPlayer ? bodyA : bodyB
          
          // Calculate force direction based on player velocity
          const force = player.velocity.clone().multiplyScalar(5)
          pin.applyForce(force)
        }
      })
    } catch (error) {
      console.error('[Bowling] Error:', error)
    }
  }

  update(delta) {
    // Get local player
    const playerEntity = Array.from(this.world.entities.entities.values())
      .find(entity => entity.isPlayer)
    const localPlayer = playerEntity?.player

    if (localPlayer && localPlayer.capsule) {
      const playerPos = localPlayer.capsule.getGlobalPose()
      const playerVel = localPlayer.capsule.getLinearVelocity()

      // Check collisions for each pin
      this.pins.forEach((pin, index) => {
        if (pin.body) {
          const pinPos = pin.body.getGlobalPose()
          const pinVel = pin.body.getLinearVelocity()

          // Calculate distances
          const dx = Math.abs(playerPos.p.x - pinPos.p.x)
          const dy = Math.abs(playerPos.p.y - pinPos.p.y)
          const dz = Math.abs(playerPos.p.z - pinPos.p.z)

          // Check for collision with realistic pin dimensions
          if (dx < 0.3 && dy < 0.8 && dz < 0.3) {  // Tighter collision box
            // Calculate impact force based on player velocity with reduced force
            const impactForce = new PHYSX.PxVec3(
              playerVel.x * 0.3,           // Significantly reduced force
              Math.max(0, playerVel.y) * 0.02,  // Minimal vertical force
              playerVel.z * 0.3            // Significantly reduced force
            )

            // Add a tiny upward force to prevent ground sticking
            if (pinPos.p.y < 0.1) {  // Only if pin is very close to ground
              impactForce.y += 0.1
            }

            if (this.debug) {
              console.log(`[Bowling] Pin ${index} collision detected:`, {
                playerPos: [playerPos.p.x, playerPos.p.y, playerPos.p.z],
                pinPos: [pinPos.p.x, pinPos.p.y, pinPos.p.z],
                playerVel: [playerVel.x, playerVel.y, playerVel.z],
                impactForce: [impactForce.x, impactForce.y, impactForce.z]
              })
            }

            // Apply the force to the pin
            pin.body.addForce(impactForce, PHYSX.PxForceModeEnum.eIMPULSE, true)
          }
        }
      })
    }

    // Update pin positions from physics
    this.pins.forEach(pin => {
      if (pin.body) {
        const transform = pin.body.getGlobalPose()
        pin.position.set(transform.p.x, transform.p.y, transform.p.z)
        
        // Get rotation quaternion from transform
        const q = transform.q
        pin.quaternion.set(q.x, q.y, q.z, q.w)
      }
    })
  }

  stop() {
    // Cleanup
    this.world.stage.scene.remove(this.base)
    this.pins.forEach(pin => pin.destroy())
    this.pins = []
  }
}
