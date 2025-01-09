# Architecture

## System Overview

Hyperfy is built on a modern, scalable architecture that combines client-side and server-side components to create interactive 3D worlds. The architecture is designed to be modular and extensible, allowing for easy customization and enhancement.

```
├── client/           # Client-side implementation
├── core/            # Core engine and shared components
└── server/          # Server-side implementation
```

## Core Components

### World Engine

The World Engine is the central component of Hyperfy, responsible for:

- Managing the 3D environment and scene graph
- Handling entity creation, updates, and destruction
- Coordinating systems and components
- Managing state synchronization between client and server

Key files:
- `src/core/World.js`: Main world implementation
- `src/core/createClientWorld.js`: Client-specific world initialization
- `src/core/createServerWorld.js`: Server-specific world initialization

### Network Layer

The network layer handles all communication between clients and the server:

- WebSocket-based real-time communication
- State synchronization
- Event broadcasting
- Client-server message handling

Key components:
- `src/core/Socket.js`: WebSocket implementation
- `src/core/packets.js`: Network packet definitions

### Physics Engine (PhysX)

Hyperfy uses NVIDIA's PhysX engine for realistic physics simulation:

- Collision detection and response
- Rigid body dynamics
- Character controllers
- Physics-based interactions

Implementation:
- `src/server/physx/`: Server-side physics implementation
- `src/client/loadPhysX.js`: Client-side physics loading and initialization

## Component Interaction

1. **Client-Server Communication**
   - WebSocket connections maintain real-time state
   - Server authoritative for physics and critical game state
   - Clients receive updates and render the world

2. **State Management**
   - Centralized state management in World class
   - Entity component system for object management
   - Efficient state synchronization between client and server

3. **Asset Pipeline**
   - Dynamic asset loading system
   - Optimized for 3D models, textures, and audio
   - Caching and preloading mechanisms

## Technical Specifications

- **Runtime**: Node.js 22.11.0+
- **3D Engine**: Three.js
- **Physics**: NVIDIA PhysX
- **Network Protocol**: WebSocket
- **Build System**: ESBuild

## Performance Considerations

- Optimized entity component system
- Efficient network state synchronization
- Physics calculations distributed between client and server
- Asset loading and management optimization
- Scene graph optimization for large worlds
