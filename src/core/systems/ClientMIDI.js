import { System } from './System'

/**
 * MIDI System
 * 
 * - runs on the client
 * - provides methods for interacting with MIDI devices
 */
export class ClientMIDI extends System {
  constructor(world) {
    super(world)
    console.log('🎹 ClientMIDI system constructor called')
    this.midiAccess = null
    this.inputs = new Map()
    this.outputs = new Map()
    this.inputListeners = new Map()
    this.isInitialized = false
  }

  async init() {
    if (!navigator.requestMIDIAccess) {
      console.warn('WebMIDI is not supported in this browser')
      return
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false })
      console.log('🎹 MIDI access granted:', {
        inputs: this.midiAccess.inputs.size,
        outputs: this.midiAccess.outputs.size,
        sysex: this.midiAccess.sysexEnabled
      })

      this.midiAccess.onstatechange = this.onstatechange.bind(this)
      this.updateDevices()
      this.isInitialized = true
      this.world.events.emit('midi:ready')
    } catch (err) {
      console.error('Failed to get MIDI access:', err)
      this.world.events.emit('midi:error', err)
    }
  }

  updateDevices() {
    console.log('🎹 Updating MIDI devices...')
    
    // Clear existing devices
    this.inputs.clear()
    this.outputs.clear()

    let inputLog = [];
    let outputLog = [];

    // Add new inputs
    this.midiAccess?.inputs.forEach((input, id) => {
      this.inputs.set(id, input)
      inputLog.push(`- ${input.name} (${input.manufacturer}) - ${input.state}`);
      
      // Set up message handler for each input
      input.onmidimessage = (message) => {
        console.log('🎹 MIDI message:', {
          data: Array.from(message.data),
          timestamp: message.timeStamp
        })
        this.handleMIDIMessage(message)
      }
    })

    // Log all found inputs at once
    if (inputLog.length > 0) {
      console.log('🎹 Found MIDI inputs:\n' + inputLog.join('\n'));
    }

    // Add new outputs
    this.midiAccess?.outputs.forEach((output, id) => {
      this.outputs.set(id, output)
      outputLog.push(`- ${output.name} (${output.manufacturer}) - ${output.state}`);
    })

    // Log all found outputs at once
    if (outputLog.length > 0) {
      console.log('🎹 Found MIDI outputs:\n' + outputLog.join('\n'));
    }
  }

  handleMIDIMessage(message) {
    const [status, note, velocity] = message.data
    const isNoteOn = (status & 0xf0) === 0x90
    const isNoteOff = (status & 0xf0) === 0x80 || (isNoteOn && velocity === 0)
    
    // Emit standardized input events
    if (isNoteOn) {
      this.world.events.emit('input:midi:noteOn', { note, velocity })
    } else if (isNoteOff) {
      this.world.events.emit('input:midi:noteOff', { note })
    }

    // Emit raw MIDI message
    this.world.events.emit('midi:message', {
      data: Array.from(message.data),
      timestamp: message.timeStamp
    })
  }

  // Public methods for apps to use
  on(event, callback) {
    this.world.events.on(`midi:${event}`, callback)
  }

  off(event, callback) {
    this.world.events.off(`midi:${event}`, callback)
  }

  // Device state change handler
  onstatechange(event) {
    console.log(`🎹 MIDI device ${event.port.state === 'connected' ? 'connected' : 'disconnected'}: ${event.port.name}`);
    this.updateDevices()
    this.world.events.emit('midi:statechange', event)
  }

  // Add a message listener for a specific input
  addMIDIInputListener(inputId, callback) {
    console.log('🎹 Adding MIDI input listener for:', inputId)
    const input = this.inputs.get(inputId)
    if (input) {
      const handler = (event) => {
        callback({
          data: Array.from(event.data),
          timestamp: event.timeStamp
        })
      }
      input.onmidimessage = handler
      this.inputListeners.set(inputId, handler)
      return true
    }
    console.warn('🎹 Could not find MIDI input:', inputId)
    return false
  }

  // Remove a message listener for a specific input
  removeMIDIInputListener(inputId) {
    const input = this.inputs.get(inputId)
    if (input) {
      input.onmidimessage = null
      this.inputListeners.delete(inputId)
      return true
    }
    return false
  }

  // Get list of available inputs
  getMIDIInputs() {
    return Array.from(this.inputs.values()).map(input => ({
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer,
      state: input.state
    }))
  }

  // Get list of available outputs
  getMIDIOutputs() {
    return Array.from(this.outputs.values()).map(output => ({
      id: output.id,
      name: output.name,
      manufacturer: output.manufacturer,
      state: output.state
    }))
  }

  // Return a proxy object with public methods
  getProxy() {
    const system = this
    return {
      addMIDIInputListener: system.addMIDIInputListener.bind(system),
      removeMIDIInputListener: system.removeMIDIInputListener.bind(system),
      getMIDIInputs: system.getMIDIInputs.bind(system),
      getMIDIOutputs: system.getMIDIOutputs.bind(system)
    }
  }
}
