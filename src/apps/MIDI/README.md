# MIDI System Tutorial

This tutorial explains how the MIDI system works in our application, covering both the core MIDI functionality and the interactive MIDI keyboard implementation.

## Table of Contents
- [Overview](#overview)
- [Core MIDI System](#core-midi-system)
- [MIDI Keyboard Implementation](#midi-keyboard-implementation)
- [Getting Started](#getting-started)
- [Technical Details](#technical-details)
- [Core System Integration](#core-system-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The MIDI system consists of two main components:
1. `ClientMIDI.js` - The core MIDI system that handles device connections and message routing
2. `MIDIKeyboard.js` - An interactive 3D MIDI keyboard implementation

## Core MIDI System

The `ClientMIDI` system (`src/core/systems/ClientMIDI.js`) provides the foundation for MIDI functionality:

### Key Features
- Automatic MIDI device detection
- Input/output device management
- Standardized MIDI message handling
- Event-based communication system

### Important Methods
- `init()` - Initializes MIDI access
- `updateDevices()` - Refreshes connected MIDI devices
- `handleMIDIMessage()` - Processes incoming MIDI messages

### Events Emitted
- `midi:ready` - When MIDI system is initialized
- `midi:error` - When MIDI initialization fails
- `input:midi:noteOn` - When a note is pressed
- `input:midi:noteOff` - When a note is released

## MIDI Keyboard Implementation

The MIDI Keyboard (`src/apps/MIDI/MIDIKeyboard.js`) provides a visual 3D interface:

### Features
- Real-time key animation
- Multi-client synchronization
- Smooth key press animations
- Automatic MIDI device connection

### Configuration
```javascript
const keySpacing = 1;        // Space between keys
const basePosition = -3;     // Starting X position
const baseHeight = 1.1;      // Key rest height
const keyHeight = 0.5;       // Key press depth
const pressDuration = 0.15;  // Animation duration
```

## Getting Started

1. Browser Compatibility
   - Ensure your browser supports WebMIDI API
   - Chrome and Edge have the best support

2. Connecting MIDI Devices
   - Connect your MIDI device before launching the application
   - The system will automatically detect and initialize available devices

3. Permissions
   - Your browser will request MIDI access permission
   - Grant permission when prompted

## Technical Details

### MIDI Message Format
```javascript
// Note On Message
[144, note, velocity]  // note: 0-127, velocity: 1-127

// Note Off Message
[128, note, 0]        // note: 0-127
```

### Networking
- The system uses a leader-follower model for multi-client synchronization
- First client to connect becomes the leader
- Position updates are broadcast to all connected clients

## Core System Integration

The MIDI system is deeply integrated with the core architecture through several key components:

### World Registration

The MIDI system is registered as a core system in `createClientWorld.js`:
```javascript
world.register('midi', ClientMIDI)
```
This makes the MIDI system available throughout the application via `world.midi`.

### System Architecture

The MIDI system extends the base `System` class and integrates with other core systems:

1. **Client System**
   - Provides access to local storage and settings
   - Manages the global world instance

2. **Event System**
   - Emits standardized events (`midi:ready`, `midi:error`)
   - Integrates with the world event bus for cross-system communication
   - Allows other systems to listen for MIDI events

3. **App Entity System**
   - MIDI apps (like `MIDIKeyboard.js`) can access the MIDI system through `app.midi`
   - Apps receive MIDI events through the standard event system
   - Supports multi-client synchronization through the network system

### Event Flow

1. MIDI Device → ClientMIDI System:
   ```
   Device → WebMIDI API → ClientMIDI → World Event Bus
   ```

2. App Integration:
   ```
   World Event Bus → App Event Handlers → Visual/Audio Updates
   ```

### Integration Example

Here's how the MIDIKeyboard app integrates with the core systems:

```javascript
// Access MIDI system
if (app.midi) {
  const inputs = app.midi.getMIDIInputs();
  if (inputs.length > 0) {
    app.midi.addMIDIInputListener(inputs[0].id, messageHandler);
  }
}

// Network synchronization
app.send('key_position', { note, pressed: true });

// Event handling
app.on('midi:ready', () => {
  // Initialize MIDI when system is ready
});
```

### Best Practices

1. **System Access**
   - Always check if MIDI system is available: `if (app.midi)`
   - Wait for `midi:ready` event before initializing MIDI functionality
   - Clean up listeners on app destruction

2. **Event Handling**
   - Use standardized event names for consistency
   - Handle both local and networked events
   - Implement proper cleanup in destroy handlers

3. **Network Synchronization**
   - Use app.send() for network synchronization
   - Implement leader/follower pattern for multi-client scenarios
   - Handle network latency in animations

## Troubleshooting

Common Issues:
1. **No MIDI Access**
   - Check browser compatibility
   - Ensure MIDI permissions are granted

2. **Device Not Detected**
   - Disconnect and reconnect the MIDI device
   - Refresh the page
   - Check device drivers

3. **Laggy Animation**
   - Reduce other browser load
   - Check system performance
   - Verify network connection quality

For additional support or to report issues, please refer to the project's issue tracker.
