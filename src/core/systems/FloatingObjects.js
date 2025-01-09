import * as THREE from '../extras/three'
import { System } from './System'
import { EventEmitter } from 'eventemitter3'
import { Layers } from '../extras/Layers'

export class FloatingObjects extends System {
  constructor(world) {
    super(world)
    this.objects = []
    this.time = 0
    this.base = new THREE.Object3D()
    this.events = new EventEmitter()
    this.lerpFactor = 0.1  // Controls how smooth the lerping is
    this.debug = true  // Enable debug logging
    this.isResetting = false
    this.resetStartTime = 0
    this.redMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.5,
      metalness: 0.5
    })
  }

  start() {
    // Add base to scene
    this.world.stage.scene.add(this.base)

    // Create floating objects
    const geometry = new THREE.BoxGeometry(2, 0.5, 2)
    const purpleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x9932cc,  // A nice purple color
      roughness: 0.7,
      metalness: 0.3
    })
    const greenMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      roughness: 0.7,
      metalness: 0.3
    })

    // Create physics material with higher friction
    const physicsMaterial = this.world.physics.physics.createMaterial(0.8, 0.8, 0.1)
    const flags = new PHYSX.PxShapeFlags(
      PHYSX.PxShapeFlagEnum.eSCENE_QUERY_SHAPE | 
      PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE |
      PHYSX.PxShapeFlagEnum.eVISUALIZATION
    )

    // Create platforms in a vertical tower pattern
    const platformsPerLevel = 3  // Reduced platforms per level
    const levels = 30           // More levels to go higher
    const horizontalSpacing = 10  // More space between platforms
    const verticalSpacing = 3    // Reduced vertical space
    const startHeight = 2        // Lower starting height
    const horizontalOffset = (platformsPerLevel - 1) * horizontalSpacing / 2  // Center the platforms

    for (let level = 0; level < levels; level++) {
      // Alternate platform count per level for more interesting pattern
      const actualPlatformsThisLevel = level % 2 === 0 ? platformsPerLevel : platformsPerLevel - 1
      
      for (let i = 0; i < actualPlatformsThisLevel; i++) {
        const x = (i * horizontalSpacing) - horizontalOffset
        const baseY = level * verticalSpacing
        // Create a spiral pattern
        const angle = level * 0.5
        const radius = 3
        const z = Math.sin(angle) * radius
        const xOffset = Math.cos(angle) * radius
        
        // Add some slight randomization
        const randX = (Math.random() - 0.5) * 0.5
        const randY = (Math.random() - 0.5) * 0.3
        const randZ = (Math.random() - 0.5) * 0.5

        const finalX = x + xOffset + randX
        const finalY = baseY + randY + startHeight  // Lower starting height
        const finalZ = z + randZ

        // Create a mesh for this platform
        const mesh = new THREE.Mesh(geometry, purpleMaterial)
        mesh.position.set(finalX, finalY, finalZ)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.base.add(mesh)

        // Create physics shape
        const physicsGeometry = new PHYSX.PxBoxGeometry(1.02, 0.26, 1.02)
        const shape = this.world.physics.physics.createShape(physicsGeometry, physicsMaterial, true, flags)
        
        // Set collision filters
        const filterData = new PHYSX.PxFilterData(
          Layers.environment.group,
          Layers.environment.mask,
          0,
          0
        )
        shape.setQueryFilterData(filterData)
        shape.setSimulationFilterData(filterData)

        // Set higher contact offset for better collision detection
        shape.setContactOffset(0.05)
        shape.setRestOffset(0.01)

        // Create and position rigid body
        const transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
        transform.p.x = finalX
        transform.p.y = finalY
        transform.p.z = finalZ
        
        const body = this.world.physics.physics.createRigidStatic(transform)
        body.attachShape(shape)
        this.world.physics.scene.addActor(body)

        // Add slight variation to floating parameters
        const baseFreq = 0.8 + (level * 0.1)  // Frequency increases with height
        this.objects.push({
          mesh,
          baseY: finalY,
          offset: Math.random() * Math.PI * 2,
          amplitude: 0.3 + Math.random() * 0.4,  // Smaller amplitude
          frequency: baseFreq + Math.random() * 0.4,
          body,
          currentY: finalY,
          hit: false,
          shape,
          transform,
          purpleMaterial,
          greenMaterial
        })
      }
    }
  }

  update(delta) {
    this.time += delta * 1.2

    // Get local player
    const playerEntity = Array.from(this.world.entities.entities.values())
      .find(entity => entity.isPlayer)
    const localPlayer = playerEntity?.player

    // Update all platforms
    this.objects.forEach((object) => {
      // Calculate floating movement
      const targetY = object.baseY + 
               object.amplitude * Math.sin(this.time * object.frequency + object.offset)

      object.currentY += (targetY - object.currentY) * this.lerpFactor

      // Update mesh position
      object.mesh.position.y = object.currentY
      
      // Update physics position
      if (object.body) {
        const transform = object.body.getGlobalPose()
        transform.p.y = object.currentY
        object.body.setGlobalPose(transform, true)
      }

      // Check for ground reset and collisions
      if (localPlayer && localPlayer.capsule) {
        const playerPos = localPlayer.capsule.getGlobalPose()
        const playerVel = localPlayer.capsule.getLinearVelocity()

        // Check if we should start resetting
        if (playerPos.p.y <= 0.5 && !this.isResetting) {
          // Start reset sequence
          this.isResetting = true
          this.resetStartTime = this.time
          // Turn all hit platforms red
          this.objects.forEach(platform => {
            if (platform.hit) {
              platform.mesh.material = this.redMaterial
            }
          })
        }
        
        // Check if we should finish resetting
        if (this.isResetting && (this.time - this.resetStartTime > 1)) {
          // Reset all platforms to purple
          this.objects.forEach(platform => {
            if (platform.hit) {
              platform.hit = false
              platform.mesh.material = platform.purpleMaterial
            }
          })
          this.isResetting = false
        }
        
        // Check for platform collision if not resetting
        if (!object.hit && !this.isResetting) {
          // Check if player is near platform horizontally
          const dx = Math.abs(playerPos.p.x - object.mesh.position.x)
          const dz = Math.abs(playerPos.p.z - object.mesh.position.z)
          
          // Check if player is slightly above platform
          const playerBottom = playerPos.p.y - 0.5  // Approximate bottom of player
          const platformTop = object.mesh.position.y + 0.25  // Top of platform
          const verticalDist = playerBottom - platformTop
          
          // If player is:
          // 1. Within horizontal bounds
          // 2. Close to platform top
          // 3. Moving downward
          if (dx < 1 && dz < 1 && 
              verticalDist >= -0.2 && verticalDist <= 0.2 && 
              playerVel.y <= 0) {
            object.hit = true
            object.mesh.material = object.greenMaterial
          }
        }
      }
    })
  }

  destroy() {
    // Clean up physics bodies
    this.objects.forEach(object => {
      if (object.body) {
        this.world.physics.scene.removeActor(object.body)
      }
      if (object.mesh) {
        this.base.remove(object.mesh)
      }
    })
    this.world.stage.scene.remove(this.base)
  }
}
