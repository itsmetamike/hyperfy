# Hyperfy Rendering System

### Overview
Hyperfy uses Three.js as its core rendering engine, with additional features for shadows, materials, and optimization.

### Key Features
- Three.js integration
- Shadow system
- Material system
- Scene graph management

### Scene Management
```javascript
// Adding objects to scene
this.base = new THREE.Group()
world.scene.add(this.base)

// Object traversal
object.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true
    child.receiveShadow = true
  }
})
```

### Material System
- Support for standard Three.js materials
- Custom material implementations
- PBR material support
- Material caching

### Optimization Features
- Automatic LOD management
- Object pooling
- Scene culling
- Shadow optimization

### Asset Integration
- GLB/GLTF model support
- VRM character support
- Custom model processing
- Texture management
