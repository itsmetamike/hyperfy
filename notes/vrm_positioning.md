# VRM Avatar Positioning in Hyperfy

## Semi-circle Layout Configuration
```javascript
// Configuration
this.numAvatars = 9
this.radius = 6
this.arcAngle = Math.PI // 180 degrees

// Calculate positions
for (let i = 0; i < this.numAvatars; i++) {
  const angle = (Math.PI * 2 / this.numAvatars) * i
  const position = {
    x: Math.sin(angle) * this.radius,
    y: 0,
    z: Math.cos(angle) * this.radius
  }
  
  // Face center
  const angleToOrigin = Math.atan2(-position.x, -position.z) + Math.PI
}
```

## Image Plane Positioning
```javascript
const imagePosition = {
  x: position.x * 0.9, // Move 10% closer to center
  y: 0.75,            // Height above VRM
  z: position.z * 0.9 // Move 10% closer to center
}
```

Key Points:
- VRMs can be arranged in various geometric patterns
- Use trigonometry for circular arrangements
- Images can be positioned relative to VRMs
- Adjust scale and position for optimal viewing
- All VRMs can be made to face a central point

## Tips
1. Use multipliers (like 0.9) to adjust relative positions
2. Keep y-position reasonable for visibility
3. Consider viewer perspective when positioning
4. Use Math.PI and its multiples for precise angles
5. Calculate facing angles using atan2 for proper orientation
