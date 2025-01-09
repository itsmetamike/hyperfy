# Hyperfy Physics System

## Overview
Hyperfy integrates the PhysX physics engine for realistic physics simulation in the 3D environment.

## Physics Components
- **PhysX Integration**: Direct integration with NVIDIA PhysX
- **Rigid Bodies**: Support for both static and dynamic rigid bodies
- **Materials**: Customizable physics materials for friction and restitution
- **Collision Shapes**: Various primitive shapes supported

## Common Physics Operations
```javascript
// Creating physics materials
const material = world.physics.physics.createMaterial(friction, restitution, frictionCombine)

// Creating rigid bodies
const body = world.physics.physics.createRigidDynamic(transform)
const staticBody = world.physics.physics.createRigidStatic(transform)

// Shape creation
const shape = world.physics.physics.createShape(geometry, material, isExclusive, flags)
```

## Collision Filtering
- Supports collision groups and filters
- Can specify which objects interact with each other
- Uses PxFilterData for configuration

## Scene Integration
- Physics bodies can be attached to Three.js meshes
- Automatic synchronization of physics and visual representation
- Scene manages physics world updates

## Physics System Overview

### Core Components
- PhysX integration
- Collision detection
- Rigid body dynamics
- Joint constraints

### Key Features
- Real-time physics simulation
- Dynamic and static bodies
- Material properties
- Raycasting support

### Implementation Details
- PhysX configuration
- Scene setup
- Body creation
- Collision handling

### Physics Properties
- Mass and inertia
- Friction coefficients
- Restitution values
- Damping factors

### Debug Options
- Visual debugging
- Performance metrics
- Collision visualization
- Force display
