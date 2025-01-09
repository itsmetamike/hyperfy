# API Reference

## World API

### World Class

The main World class provides the core functionality for creating and managing virtual worlds.

#### Constructor
```javascript
constructor(options: WorldOptions)
```

#### Properties
- `entities`: Map of all entities in the world
- `systems`: Map of registered systems
- `physics`: Physics engine instance
- `network`: Network manager instance

#### Methods

##### Initialization
```javascript
async init()
async destroy()
registerSystem(name: string, system: System)
unregisterSystem(name: string)
```

##### Entity Management
```javascript
createEntity(options: EntityOptions)
destroyEntity(entityId: string)
getEntity(entityId: string)
```

##### Update Cycle
```javascript
update(deltaTime: number)
fixedUpdate(deltaTime: number)
```

## Entity API

### Entity Class

Base class for all entities in the world.

#### Constructor
```javascript
constructor(world: World, options: EntityOptions)
```

#### Properties
- `id`: Unique entity identifier
- `components`: Map of attached components
- `world`: Reference to parent world

#### Methods

##### Component Management
```javascript
addComponent(name: string, component: Component)
removeComponent(name: string)
getComponent(name: string)
```

##### Lifecycle
```javascript
init()
update(deltaTime: number)
destroy()
```

## System API

### System Interface

Base interface for creating custom systems.

#### Methods

##### Lifecycle
```javascript
init()
update(deltaTime: number)
destroy()
```

##### Entity Management
```javascript
onEntityAdded(entity: Entity)
onEntityRemoved(entity: Entity)
```

### Common Systems

#### Physics System
```javascript
class PhysicsSystem {
  step(deltaTime: number)
  raycast(origin: Vector3, direction: Vector3)
  addBody(body: PhysicsBody)
  removeBody(body: PhysicsBody)
}
```

#### Network System
```javascript
class NetworkSystem {
  connect(options: ConnectionOptions)
  disconnect()
  send(message: NetworkMessage)
  broadcast(message: NetworkMessage)
}
```

## Network API

### Network Manager

Handles all network communication.

#### Methods

##### Connection
```javascript
connect(options: ConnectionOptions)
disconnect()
```

##### Messaging
```javascript
send(message: NetworkMessage)
broadcast(message: NetworkMessage)
subscribe(channel: string, callback: Function)
unsubscribe(channel: string, callback: Function)
```

### Message Types

#### State Update
```typescript
interface StateUpdate {
  type: 'state'
  entityId: string
  changes: Record<string, any>
  timestamp: number
}
```

#### Event Message
```typescript
interface EventMessage {
  type: 'event'
  name: string
  data: any
  target?: string
}
```

## Type Definitions

### Common Types

```typescript
interface Vector3 {
  x: number
  y: number
  z: number
}

interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

interface Transform {
  position: Vector3
  rotation: Quaternion
  scale: Vector3
}

interface WorldOptions {
  physics?: PhysicsOptions
  network?: NetworkOptions
  systems?: SystemOptions[]
}

interface EntityOptions {
  id?: string
  components?: ComponentOptions[]
  transform?: Transform
}
```

## Events

### System Events

```typescript
enum SystemEvents {
  INIT = 'init',
  UPDATE = 'update',
  DESTROY = 'destroy',
  ENTITY_ADDED = 'entityAdded',
  ENTITY_REMOVED = 'entityRemoved'
}
```

### Network Events

```typescript
enum NetworkEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  ERROR = 'error'
}
```

## Constants

### Physics Constants

```typescript
const PHYSICS_CONSTANTS = {
  GRAVITY: -9.81,
  MAX_SUBSTEPS: 4,
  FIXED_TIMESTEP: 1/60
}
```

### Network Constants

```typescript
const NETWORK_CONSTANTS = {
  MAX_PLAYERS: 100,
  TICK_RATE: 60,
  MAX_MESSAGE_SIZE: 16384
}
```
