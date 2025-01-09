# Loading World Assets in Hyperfy

## GLB Models

### Loading Base Environment
```javascript
const glb = await this.world.loader.load('glb', '/base-environment.glb')
const root = glb.toNodes()
root.activate({ world: this.world, physics: true })
```

### Custom Platform Loading
```javascript
// Load and scale platform
const glb = await this.world.loader.load('glb', '/round-platform.glb')
const root = glb.toNodes()
root.scale.set(3, 1, 3) // Scale x,y,z independently
root.activate({ world: this.world, physics: true })
```

Key Points:
- GLB files should be placed in `src/client/public/`
- `toNodes()` converts GLB to Hyperfy node system
- `activate()` adds model to world with optional physics
- Scale can be adjusted via `scale.set(x, y, z)`
- Physics is enabled by passing `physics: true` to activate()

## Image Loading

### For VRM Avatars
```javascript
// Create image plane
const geometry = new THREE.PlaneGeometry(1, 1)
const material = new THREE.MeshBasicMaterial({
  map: texture,
  transparent: true,
  side: THREE.DoubleSide
})
const imagePlane = new THREE.Mesh(geometry, material)

// Position above VRM
imagePlane.position.set(x, y, z)
```

Key Points:
- Images can be loaded from URLs or local files
- Images should be placed in `src/client/public/`
- PlaneGeometry used for displaying 2D images
- `DoubleSide` rendering allows viewing from both sides
- Position can be relative to other objects
