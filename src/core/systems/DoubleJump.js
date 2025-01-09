import { System } from './System'
import * as THREE from '../extras/three'
import { Emotes } from '../extras/playerEmotes'

const UP = new THREE.Vector3(0, 1, 0)
const v1 = new THREE.Vector3()

export class DoubleJump extends System {
  constructor(world) {
    super(world)
    console.log('[DoubleJump System] Constructed')
    
    this.jumpCount = 0
    this.lastJumpTime = 0
    this.DOUBLE_JUMP_WINDOW = 600 // ms
    this.JUMP_FORCE = 6.5
    this.DOUBLE_JUMP_FORCE = this.JUMP_FORCE * 1.5 // Same as first jump
    this.initialized = false
    this.PHYSX = null
  }

  async init({ loadPhysX }) {
    const info = await loadPhysX()
    this.PHYSX = PHYSX
    console.log('[DoubleJump System] PhysX loaded')
  }

  start() {
    console.log('[DoubleJump System] Starting...')
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  stop() {
    console.log('[DoubleJump System] Stopping...')
    if (this.initialized) {
      window.removeEventListener('keydown', this.handleKeyDown)
    }
  }

  update() {
    // Wait for player to be initialized
    if (!this.initialized) {
      // Debug: Log all entities to find player
      console.log('[DoubleJump System] Entities:', 
        Array.from(this.world.entities.entities.entries())
          .map(([id, entity]) => ({ id, type: entity.constructor.name }))
      )

      // Find player entity
      const playerEntity = Array.from(this.world.entities.entities.values())
        .find(entity => entity.isPlayer)

      if (playerEntity?.player && this.PHYSX) {
        console.log('[DoubleJump System] Player found:', {
          id: playerEntity.data.id,
          isLocal: playerEntity.player.constructor.name === 'PlayerLocal'
        })
        this.initialized = true
        window.addEventListener('keydown', this.handleKeyDown)
      }
      return
    }

    // Check if we need to update the double jump animation
    const playerEntity = Array.from(this.world.entities.entities.values())
      .find(entity => entity.isPlayer)
    const localPlayer = playerEntity?.player

    if (localPlayer && localPlayer.emote === Emotes.DOUBLE_JUMP) {
      // After a delay, switch to float animation
      const now = performance.now()
      const timeSinceLastJump = now - this.lastJumpTime
      if (timeSinceLastJump > 800) { // 800ms for double jump animation
        localPlayer.emote = Emotes.FLOAT
      }
    }
  }

  handleKeyDown(e) {
    if (e.code !== 'Space') return
    if (e.repeat) return // Ignore held space key

    console.log('[DoubleJump System] Space pressed:', {
      jumpCount: this.jumpCount,
      lastJumpTime: this.lastJumpTime,
      timeSinceLastJump: performance.now() - this.lastJumpTime
    })

    const now = performance.now()
    const timeSinceLastJump = now - this.lastJumpTime
    
    // Get local player
    const playerEntity = Array.from(this.world.entities.entities.values())
      .find(entity => entity.isPlayer)
    const localPlayer = playerEntity?.player

    if (!localPlayer) {
      console.error('[DoubleJump System] No local player found')
      return
    }

    console.log('[DoubleJump System] Player state:', {
      isGrounded: localPlayer.grounded
    })

    // Reset jump count if we're on the ground
    if (localPlayer.grounded) {
      console.log('[DoubleJump System] Player is grounded, resetting jump count')
      this.jumpCount = 0
    }

    // Only allow jumping if we haven't used all our jumps
    if (this.jumpCount < 2) {
      if (this.jumpCount === 0) {
        // First jump - always allowed if on ground
        if (localPlayer.grounded) {
          console.log('[DoubleJump System] Performing first jump')
          // Apply upward force while preserving horizontal velocity
          const currentVel = localPlayer.capsule.getLinearVelocity()
          v1.copy(currentVel)
          v1.y = this.JUMP_FORCE
          localPlayer.capsule.setLinearVelocity(v1.toPxVec3())
          localPlayer.jumped = true // Set jumped to trigger animation
          this.jumpCount++
          this.lastJumpTime = now
        } else {
          console.log('[DoubleJump System] Cannot perform first jump - not grounded')
        }
      } else if (this.jumpCount === 1 && timeSinceLastJump <= this.DOUBLE_JUMP_WINDOW) {
        console.log('[DoubleJump System] Performing double jump')
        // Second jump - only if within time window
        const currentVel = localPlayer.capsule.getLinearVelocity()
        v1.copy(currentVel)
        v1.y = this.DOUBLE_JUMP_FORCE
        localPlayer.capsule.setLinearVelocity(v1.toPxVec3())
        localPlayer.jumped = true // Set jumped to trigger animation
        localPlayer.emote = Emotes.DOUBLE_JUMP // Use double jump animation
        this.jumpCount++
        this.lastJumpTime = now
      } else {
        console.log('[DoubleJump System] Cannot perform double jump:', {
          jumpCount: this.jumpCount,
          timeSinceLastJump,
          withinWindow: timeSinceLastJump <= this.DOUBLE_JUMP_WINDOW
        })
      }
    } else {
      console.log('[DoubleJump System] Maximum jumps reached')
    }
  }
}
