# Hyperfy App and World Initialization Notes

## World Initialization

The world initialization in Hyperfy happens in multiple layers:

1. **Core World Creation** (`src/core/World.js`)
   - Base systems are registered: apps, entities, physics, stage
   - Sets up core properties like deltaTime, frame rate, etc.
   - Creates the 3D scene graph with THREE.js

2. **Client World Creation** (`src/core/createClientWorld.js`)
   - Extends core world with client-specific systems
   - Important systems registered here:
     - ClientControls
     - ClientNetwork
     - ClientLoader
     - ClientGraphics
     - ClientEnvironment
     - Additional systems (e.g., DoubleJump)
   - **Note**: Systems registered here are always loaded, regardless of world config

3. **World Configuration** (`worlds/[world-name]/world.js`)
   - Defines world-specific systems and entities
   - Can enable/disable systems through configuration
   - Systems can be loaded in two ways:
     ```javascript
     export default {
       // Method 1: Direct system reference
       systems: ['Stage', 'Physics', 'ClientControls'],
       
       // Method 2: Dynamic import with ID
       systems: [{
         id: 'customSystem',
         system: () => import('../../src/core/systems/CustomSystem')
       }]
     }
     ```

## System and App Registration

Systems in Hyperfy can be registered in multiple ways:

1. **Core System Registration** (`src/apps.js`)
   ```javascript
   import { CustomSystem } from './core/systems/CustomSystem'
   
   export const apps = {
     customSystem: CustomSystem
   }
   
   export function registerApps(world) {
     world.register('customSystem', CustomSystem)
   }
   ```

2. **World-specific System Usage**
   - Systems can be used either as direct references or as apps
   - As direct system:
     ```javascript
     systems: ['CustomSystem']
     ```
   - As app entity:
     ```javascript
     entities: [{
       type: 'app',
       app: 'customSystem'
     }]
     ```

3. **System Implementation** (`src/core/systems/CustomSystem.js`)
   ```javascript
   import { System } from './System'
   
   export class CustomSystem extends System {
     constructor(world) {
       super(world)
     }
     
     async start() {
       // System initialization
     }
   }
   ```

## Key Learnings

1. **System Layers**
   - Base systems (World.js)
   - Client systems (createClientWorld.js)
   - World-specific systems (world.js)

2. **Important Distinctions**
   - Systems registered in createClientWorld.js are always loaded
   - World config can only toggle systems, not prevent their registration
   - Apps must be both registered globally AND included in world config

3. **Best Practices**
   - Keep core systems minimal in createClientWorld.js
   - Use world config for optional systems
   - Register all apps in src/apps.js before using in worlds

## Best Practices

1. **System Registration**
   - Register core systems in `src/apps.js`
   - Comment out unused systems to prevent loading
   - Use consistent naming between system class and registration

2. **World Configuration**
   - Use dynamic imports for large systems that aren't always needed
   - Prefer app entities for systems that need world-specific configuration
   - Keep core systems minimal and focused

3. **System Implementation**
   - Follow the system lifecycle (constructor -> init -> start)
   - Use proper cleanup in destroy methods
   - Access other systems through world instance

### App and World Initialization

#### Overview
The initialization process involves several key steps to set up the application environment and world systems.

#### Key Steps
1. Environment setup
2. World creation
3. System registration
4. Asset loading
5. Scene setup

#### Implementation Details
```javascript
// Initialize world
const world = new World()

// Register systems
world.register(PhysicsSystem)
world.register(RenderSystem)

// Load assets
await world.loader.load()

// Start systems
world.start()
```

#### Configuration Options
- Debug modes
- Physics settings
- Rendering quality
- Network parameters

#### Best Practices
- Initialize systems in correct order
- Handle loading states
- Implement error handling
- Monitor performance
