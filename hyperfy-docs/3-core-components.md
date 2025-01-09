# Core Components

## World System

The World System is the foundation of Hyperfy's virtual environments.

### World Creation

The world creation process involves:

- Initialization of the 3D scene
- Setup of physics environment
- Creation of network connections
- System registration and initialization

Key files:
- `src/core/World.js`
- `src/core/createClientWorld.js`
- `src/core/createServerWorld.js`

### World Management

World management handles:

- Entity lifecycle management
- System updates
- State synchronization
- Event handling
- Resource management

### State Management

- Centralized state store
- Real-time state synchronization
- Optimized delta updates
- State persistence

## Stage System

The Stage System is responsible for managing 3D objects in the world.

### Creating Objects

To create 3D objects, use the Stage system rather than direct Three.js manipulation:

```javascript
// Create a material
const material = world.stage.createMaterial({
  unlit: true,  // Use unlit materials if you don't need lighting
  color: '#ffffff'
  // OR for standard materials (requires environment system):
  // metalness: 0.5,
  // roughness: 0.5
})

// Create geometry
const geometry = new THREE.BoxGeometry(1, 1, 1)

// Create matrix for position/rotation
const matrix = new THREE.Matrix4()
matrix.setPosition(x, y, z)

// Insert the object into the world
const object = world.stage.insert({
  geometry,
  material: material.internal,
  castShadow: true,
  receiveShadow: true,
  matrix,
  node: this  // 'this' should be your system instance
})

// Update object position/rotation
object.move(matrix)

// Cleanup
object.destroy()
```

### Material System

Materials in Hyperfy have two types:

1. Unlit Materials
   - Simple materials without lighting
   - Available immediately
   - Suitable for UI or non-physical objects
   - Created with `{ unlit: true }`

2. Standard Materials
   - Physical-based materials with lighting
   - Require environment system initialization
   - Support metalness/roughness
   - Created without `unlit` property

### System Lifecycle

When creating custom systems, follow this lifecycle:

1. Constructor
```javascript
constructor(world) {
  super(world)
  this.objects = []
}
```

2. Start (preferred for object creation)
```javascript
start() {
  // Create materials and objects here
  // Environment system is ready
}
```

3. Update
```javascript
update(delta) {
  // Update object transforms
  this.objects.forEach(object => {
    object.matrix.setPosition(x, y, z)
    object.handle.move(object.matrix)
  })
}
```

4. Destroy
```javascript
destroy() {
  // Cleanup all objects
  this.objects.forEach(object => {
    object.handle.destroy()
  })
}
```

## Entity System

The Entity System is used for high-level game objects. Currently supported types:

- `app`: Application entities
- `player`: Player entities

### Entity Management

- Entity creation and destruction
- Component attachment and detachment
- Entity queries and filtering
- State synchronization

## Asset System

Located in `src/core/assets/`

### Asset Loading

- Dynamic asset loading
- Asset type handling:
  - 3D Models
  - Textures
  - Audio
  - Materials
  - Shaders

### Asset Management

- Asset caching
- Memory management
- Asset preloading
- Asset optimization

## Systems

Located in `src/core/systems/`

### Available Systems

Core systems include:
- Stage System: 3D object and material management
- Physics System: Collision and physics simulation
- Network System: Client-server communication
- Input System: User input handling
- Environment System: Lighting and shadows
- Audio System: Sound management
- Interaction System: Object interaction

### Custom Systems Development

Guidelines for creating custom systems:

1. System Structure
```javascript
import { System } from './System'

class CustomSystem extends System {
  constructor(world) {
    super(world)
  }

  start() {
    // Create objects after all systems are initialized
  }

  update(delta) {
    // Per-frame updates
  }

  destroy() {
    // Cleanup
  }
}
```

2. Registration
```javascript
world.register('custom', CustomSystem)
```

3. Best Practices
- Create objects in start() rather than init()
- Use Stage system for 3D object management
- Use unlit materials if you don't need lighting
- Always clean up resources in destroy()
- Use matrix transformations for object manipulation
- Keep systems focused and single-purpose
