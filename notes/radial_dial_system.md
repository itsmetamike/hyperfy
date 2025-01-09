# Radial Dial Interaction System in Hyperfy

## Core Components Integration

### 1. ClientEditor System
The `ClientEditor` system manages world interactions and context menus:
```javascript
class ClientEditor extends System {
  constructor(world) {
    this.contextTracker = {
      downAt: null,
      movement: new THREE.Vector3()
    }
  }
}
```

### 2. Interaction Flow

1. **Trigger Detection**
   ```javascript
   // Tracks right-click with timing and movement
   if (code === 'MouseRight') {
     this.contextTracker.downAt = performance.now()
     this.contextTracker.movement.set(0, 0, 0)
   }
   ```

2. **Raycast & Entity Detection**
   ```javascript
   // Raycast from pointer to find interactable entities
   const hits = this.world.stage.raycastPointer(
     this.world.controls.pointer.position
   )
   ```

3. **Context Menu Generation**
   - Different entities provide different interaction options
   - Actions are determined by entity type and user permissions

### 3. Entity-Specific Actions

1. **Player Entities**
   ```javascript
   if (entity.isPlayer) {
     context.actions.push({
       label: 'Inspect',
       icon: EyeIcon,
       visible: true
     })
   }
   ```

2. **App Entities**
   ```javascript
   if (entity.isApp) {
     // Build actions based on permissions
     if (this.world.network.permissions.build) {
       actions.push(
         { label: 'Move', icon: HandIcon },
         { label: 'Duplicate', icon: CopyIcon },
         { label: 'Unlink', icon: UnlinkIcon },
         { label: 'Destroy', icon: Trash2Icon }
       )
     }
   }
   ```

## Integration Points

1. **Stage System**
   - Handles raycasting for entity detection
   - Manages the scene graph and object picking

2. **Control System**
   - Manages input priority
   - Tracks pointer position and movement
   - Handles gesture detection

3. **Network Permissions**
   - Controls available actions based on user role
   - Syncs interactions across network

## Interaction Rules

1. **Quick Click Detection**
   - Must be less than 300ms duration
   - Movement must be less than 30 pixels
   ```javascript
   if (elapsed < 300 && distance < 30) {
     this.tryContext()
   }
   ```

2. **Context Breaking**
   - Menu dismisses on:
     - Left mouse click
     - Escape key
     - Starting new interaction

3. **Permission Gating**
   - Build actions require `permissions.build`
   - Some actions available to all users
   - Network sync for multiplayer consistency

## Technical Implementation

1. **Raycast Pipeline**
   - Uses Three.js raycaster
   - Filters for interactable entities
   - Returns closest hit entity

2. **Entity Resolution**
   ```javascript
   for (const hit of hits) {
     entity = hit.getEntity?.()
     if (entity) break
   }
   ```

3. **Action Handling**
   - Each action has:
     - Label
     - Icon
     - Visibility condition
     - Disabled state
     - Click handler

## Best Practices

1. **Entity Design**
   - Implement `getEntity()` for interactable objects
   - Define clear interaction boundaries
   - Consider network implications

2. **Permission Management**
   - Gate actions appropriately
   - Consider user roles
   - Handle permission changes gracefully

3. **Performance**
   - Efficient raycasting
   - Smart action filtering
   - Quick response times
