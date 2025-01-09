# Hyperfy Asset Management

### Overview
Hyperfy implements a sophisticated asset management system through its loader subsystem, handling various types of 3D assets and resources.

### Asset Loading System
- Located in `src/core/systems/ServerLoader.js`
- Supports multiple asset types (GLB, VRM, HDR)
- Implements caching for performance
- Uses asset:// protocol for path resolution

### Asset Types
- **GLB Models**: Primary 3D model format
- **VRM Models**: For avatar/character models
- **HDR**: For environment maps
- **Emotes**: For character animations

### Asset Resolution
```javascript
// Assets are resolved relative to configured assets directory
this.assetsDir = path.join(__dirname, '../', process.env.ASSETS_DIR)

// Using asset:// protocol
loader.load('glb', 'asset://model.glb')
```

### Caching
- Assets are cached by type and URL
- Cache is maintained in memory using Map
- Prevents redundant loading of shared assets
