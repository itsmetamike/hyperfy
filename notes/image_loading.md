# Image Loading in Hyperfy

## Loading Textures with ClientLoader

To load images/textures in Hyperfy, use the `ClientLoader` system which provides a cached texture loading mechanism. The loader supports both regular HTTP/HTTPS URLs and IPFS URLs.

### Implementation Details

1. The `ClientLoader` system handles texture loading via `THREE.TextureLoader`:

```javascript
// In ClientLoader.js
if (type === 'texture') {
  promise = new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous'
    textureLoader.load(
      url,
      (texture) => {
        texture.needsUpdate = true
        resolve(texture)
      },
      undefined,
      (error) => reject(error)
    )
  })
}
```

### Usage Example

```javascript
// Load a texture
const texture = await this.world.loader.load('texture', imageUrl)

// Create a plane with the texture
const geometry = new THREE.PlaneGeometry(width, height)
const material = new THREE.MeshBasicMaterial({ 
  map: texture,
  transparent: true,
  side: THREE.DoubleSide
})
const imagePlane = new THREE.Mesh(geometry, material)
```

### IPFS URL Handling

When loading from IPFS, convert IPFS URLs to HTTP gateway URLs:
```javascript
const imageUrl = metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/')
```

### Best Practices
- Always use `this.world.loader` instead of creating new loaders
- Handle both `image` and `image_url` fields in metadata
- Set `transparent: true` for PNGs with transparency
- Use `THREE.DoubleSide` if the plane needs to be visible from both sides
