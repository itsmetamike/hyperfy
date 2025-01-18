// Debug mode flag
const DEBUG = false;

// Get the ON key mesh and set initial position
const onKey = app.get('ON');
if (onKey && onKey.position) {
  onKey.position.set(0, 1, 0);
}

// Constants for animation
const keySpacing = 1;
const basePosition = -3;
const baseHeight = 1.1;
const keyHeight = 0.5;
let currentNote = 0;
let isKeyPressed = false;
let pressTime = 0;
let isLeader = false;
const pressDuration = 0.15;

// Add message handler for note on/off
const messageHandler = message => {
  const [messageType, note, velocity] = message.data;
  
  if ((messageType === 144 || messageType === 151) && velocity > 0) { // Note On
    currentNote = note;
    isKeyPressed = true;
    pressTime = 0;
    
    if (onKey && onKey.position) {
      onKey.position.x = basePosition + ((note - 48) * keySpacing);
      app.send('key_position', { note, pressed: true });
    }
  } else if (messageType === 128 || messageType === 135 || (messageType === 144 && velocity === 0)) { // Note Off
    isKeyPressed = false;
    if (onKey) {
      app.send('key_position', { note: currentNote, pressed: false });
    }
  }
};

// Listen for position updates from other clients
app.on('key_position', ({note, pressed}) => {
  if (!isLeader && onKey && onKey.position) {
    currentNote = note;
    isKeyPressed = pressed;
    pressTime = pressed ? 0 : pressDuration;
    onKey.position.x = basePosition + ((note - 48) * keySpacing);
  }
});

// Try to initialize MIDI right away if available
if (app.midi) {
  const inputs = app.midi.getMIDIInputs();
  if (inputs.length > 0) {
    app.midi.addMIDIInputListener(inputs[0].id, messageHandler);
    isLeader = true;
  }
}

// Also listen for MIDI ready event in case it initializes later
app.on('midi:ready', () => {
  if (app.midi) {
    const inputs = app.midi.getMIDIInputs();
    if (inputs.length > 0) {
      app.midi.addMIDIInputListener(inputs[0].id, messageHandler);
      isLeader = true;
    }
  }
});

// Update loop for smooth key press animation
app.on('update', delta => {
  if (!onKey || !onKey.position) return;
  
  if (isKeyPressed) {
    pressTime += delta;
    if (pressTime < pressDuration) {
      const progress = pressTime / pressDuration;
      onKey.position.y = baseHeight + (keyHeight * Math.sin(progress * Math.PI));
    }
  } else if (onKey.position.y > baseHeight) {
    pressTime += delta;
    const progress = pressTime / pressDuration;
    onKey.position.y = baseHeight + Math.max(0, keyHeight * Math.sin((1 - progress) * Math.PI));
  }
});

// Clean up when app is destroyed
app.on('destroy', () => {
  if (app.midi) {
    const inputs = app.midi.getMIDIInputs();
    if (inputs.length > 0) {
      app.midi.removeMIDIInputListener(inputs[0].id);
    }
  }
});
