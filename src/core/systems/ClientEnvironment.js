import * as THREE from '../extras/three'

import { System } from './System'

import { CSM } from '../libs/csm/CSM'

const csmLevels = {
  none: {
    cascades: 1,
    shadowMapSize: 1024,
    castShadow: false,
    lightIntensity: 3,
    // shadowBias: 0.000002,
    // shadowNormalBias: 0.001,
    shadowIntensity: 2,
  },
  low: {
    cascades: 1,
    shadowMapSize: 2048,
    castShadow: true,
    lightIntensity: 1,
    shadowBias: 0.0000009,
    shadowNormalBias: 0.001,
    shadowIntensity: 2,
  },
  med: {
    cascades: 3,
    shadowMapSize: 1024,
    castShadow: true,
    lightIntensity: 1,
    shadowBias: 0.000002,
    shadowNormalBias: 0.002,
    shadowIntensity: 2,
  },
  high: {
    cascades: 3,
    shadowMapSize: 2048,
    castShadow: true,
    lightIntensity: 1,
    shadowBias: 0.000003,
    shadowNormalBias: 0.002,
    shadowIntensity: 2,
  },
}

/**
 * Environment System
 *
 * - Runs on the client
 * - Sets up the sun, shadows, fog, skybox etc
 *
 */
export class ClientEnvironment extends System {
  constructor(world) {
    super(world)
  }

  async start() {
    this.buildHDR()
    this.buildCSM()
    this.buildFog()
    this.world.client.settings.on('change', this.onSettingsChange)
    this.world.graphics.on('resize', this.onViewportResize)

    // Load round platform
    const glb = await this.world.loader.load('glb', '/round-platform.glb')
    const root = glb.toNodes()
    root.scale.set(3, 1, 3) // Scale up by 5x
    root.activate({ world: this.world, physics: true })

    // {
    //   // temp box
    //   const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 20)
    //   const material = new THREE.MeshStandardMaterial({ color: 'red' })
    //   // const material = new THREE.MeshBasicMaterial({ color: 'red' })
    //   const mesh = new THREE.Mesh(geometry, material)
    //   mesh.position.z = -50
    //   this.world.stage.scene.add(mesh)
    //   this.foo = mesh
    // }
  }

  update(delta) {
    this.csm.update()
    // this.foo.rotation.y += 0.5 * delta
  }

  async buildHDR() {
    const url = '/black-hdr.hdr'
    const texture = await this.world.loader.load('hdr', url)
    texture.mapping = THREE.EquirectangularReflectionMapping
    this.world.stage.scene.environment = texture
  }

  buildCSM() {
    if (this.csm) this.csm.dispose()
    const scene = this.world.stage.scene
    const camera = this.world.camera
    const options = csmLevels[this.world.client.settings.shadows]
    this.csm = new CSM({
      mode: 'practical', // uniform, logarithmic, practical, custom
      cascades: 3,
      shadowMapSize: 2048,
      maxFar: 100,
      lightIntensity: 1,
      lightDirection: new THREE.Vector3(0, -1, 0).normalize(),
      fade: true,
      parent: scene,
      camera: camera,
      ...options,
    })
    for (const light of this.csm.lights) {
      light.shadow.intensity = options.shadowIntensity
    }
    if (!options.castShadow) {
      for (const light of this.csm.lights) {
        light.castShadow = false
      }
    }
  }

  buildFog() {
    // ...
  }

  onSettingsChange = changes => {
    if (changes.shadows) {
      this.buildCSM()
    }
  }

  onViewportResize = () => {
    this.csm.updateFrustums()
  }
}
