# Hyperfy World System

### Overview
Hyperfy uses a core World system as its main orchestrator. The World system manages all other systems and provides core functionality for the 3D environment.

### Key Features
- Acts as the central system manager
- Handles system registration and initialization
- Provides access to shared resources like physics and loaders
- Maintains the scene graph hierarchy

### System Registration
```javascript
// Systems can be registered using
world.register(SystemClass)
// or previously
world.systems.add(SystemClass)
```

### Core Components
- **Scene Management**: The World system maintains the Three.js scene graph
- **Physics Integration**: Provides access to PhysX physics engine
- **Asset Loading**: Manages asset loading through the loader system
- **System Lifecycle**: Handles init and start lifecycle of registered systems

### Common Usage
```javascript
// Systems can access world instance
this.world.loader // Access asset loader
this.world.physics // Access physics engine
