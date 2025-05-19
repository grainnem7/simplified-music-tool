import { useCallback, useRef, useState } from 'react'
import * as Tone from 'tone'
import { Pose } from '@tensorflow-models/pose-detection'
import { BODY_PART_TO_KEYPOINT } from '../services/musicMapping'
import { MusicMappingConfig, PRESET_CONFIGS } from '../types/musicMapping'

interface BodyPartState {
  previousY: number
  previousX: number
  lastTriggerTime: number
  velocity: number
}

export function useMusicGeneration() {
  const synthsRef = useRef<Record<string, any>>({})
  const [currentConfig, setCurrentConfig] = useState<MusicMappingConfig>(PRESET_CONFIGS.intuitive)
  const isInitializedRef = useRef(false)
  const bodyPartStatesRef = useRef<Record<string, BodyPartState>>({})

  // Initialize synthesizers for each instrument type
  const initializeSynth = useCallback(async () => {
    if (isInitializedRef.current) return
    
    console.log('Initializing flexible music system...')
    
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }
      
      // Initialize different instrument types
      synthsRef.current.piano = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
      }).toDestination()
      
      synthsRef.current.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.5 }
      }).toDestination()
      
      synthsRef.current.strings = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.3, decay: 0.1, sustain: 0.7, release: 2 }
      }).toDestination()
      
      synthsRef.current.bass = new Tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 }
      }).toDestination()
      
      synthsRef.current.pad = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1, decay: 0.3, sustain: 0.6, release: 3 }
      }).toDestination()
      
      // Initialize a simple drum kit using membrane synth for drums
      synthsRef.current.drums = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4
        }
      }).toDestination()
      
      // Set volumes
      Object.values(synthsRef.current).forEach(synth => {
        if (synth) synth.volume.value = -10
      })
      
      isInitializedRef.current = true
      console.log('Music system initialized')
      
    } catch (error) {
      console.error('Failed to initialize synth:', error)
    }
  }, [])

  const processAxisMapping = (
    value: number,
    mapping: typeof currentConfig.mappings[string]['xAxis'],
    currentValue?: number
  ): number => {
    let mappedValue = value
    
    if (mapping.invert) {
      mappedValue = 1 - mappedValue
    }
    
    // Map to the specified range
    const [min, max] = mapping.range
    mappedValue = min + (mappedValue * (max - min))
    
    return mappedValue
  }

  const generateMusic = useCallback(async (poses: Pose[] | null, selectedBodyParts: string[]) => {
    if (!poses || poses.length === 0 || selectedBodyParts.length === 0) {
      return
    }

    await initializeSynth()
    
    const pose = poses[0]
    const currentTime = Date.now()
    
    // Process each selected body part with its custom mapping
    selectedBodyParts.forEach(bodyPart => {
      const mapping = currentConfig.mappings[bodyPart]
      if (!mapping || !mapping.enabled) return
      
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      const keypoint = pose.keypoints.find(kp => {
        return possibleKeypointNames.includes(kp.name || '')
      })
      
      if (!keypoint || !keypoint.score || keypoint.score < 0.3) return
      
      // Initialize state for this body part if needed
      if (!bodyPartStatesRef.current[bodyPart]) {
        bodyPartStatesRef.current[bodyPart] = {
          previousY: keypoint.y,
          previousX: keypoint.x,
          lastTriggerTime: 0,
          velocity: 0
        }
      }
      
      const state = bodyPartStatesRef.current[bodyPart]
      
      // Calculate movement velocity
      const movementY = Math.abs(keypoint.y - state.previousY)
      const movementX = Math.abs(keypoint.x - state.previousX)
      const velocity = Math.sqrt(movementY * movementY + movementX * movementX)
      
      // Process each axis according to its mapping
      let pitch = mapping.scale[0] + '4' // Default pitch
      let volume = 0.5
      let timbre = 0.5
      let filter = 1000
      let tempo = 120
      
      // X-axis processing
      if (mapping.xAxis.parameter !== 'none') {
        const xValue = processAxisMapping(keypoint.x, mapping.xAxis)
        
        switch (mapping.xAxis.parameter) {
          case 'pitch':
            const noteIndex = Math.floor(xValue * mapping.scale.length)
            const note = mapping.scale[Math.max(0, Math.min(noteIndex, mapping.scale.length - 1))]
            const octave = Math.floor(xValue * (mapping.octaveRange[1] - mapping.octaveRange[0])) + mapping.octaveRange[0]
            pitch = note + octave
            break
          case 'volume':
            volume = xValue
            break
          case 'timbre':
            timbre = xValue
            break
          case 'filter':
            filter = xValue
            break
          case 'tempo':
            tempo = xValue
            break
        }
      }
      
      // Y-axis processing
      if (mapping.yAxis.parameter !== 'none') {
        const yValue = processAxisMapping(keypoint.y, mapping.yAxis)
        
        switch (mapping.yAxis.parameter) {
          case 'pitch':
            const noteIndex = Math.floor(yValue * mapping.scale.length)
            const note = mapping.scale[Math.max(0, Math.min(noteIndex, mapping.scale.length - 1))]
            const octave = Math.floor(yValue * (mapping.octaveRange[1] - mapping.octaveRange[0])) + mapping.octaveRange[0]
            pitch = note + octave
            break
          case 'volume':
            volume = yValue
            break
          case 'timbre':
            timbre = yValue
            break
          case 'filter':
            filter = yValue
            break
          case 'tempo':
            tempo = yValue
            break
        }
      }
      
      // Velocity axis processing
      if (mapping.velocityAxis.parameter !== 'none') {
        const velocityValue = processAxisMapping(velocity * 10, mapping.velocityAxis) // Scale velocity
        
        switch (mapping.velocityAxis.parameter) {
          case 'volume':
            volume = velocityValue
            break
          case 'pitch':
            // Modulate pitch slightly based on velocity
            break
          case 'timbre':
            timbre = velocityValue
            break
          case 'filter':
            filter = velocityValue
            break
          case 'tempo':
            tempo = velocityValue
            break
        }
      }
      
      // Trigger note based on movement threshold and rate limiting
      if (velocity > 0.02 && currentTime - state.lastTriggerTime > 100) {
        const synth = synthsRef.current[mapping.instrument]
        
        if (synth) {
          // Apply filter if supported (only on some synth types)
          if ('filter' in synth && synth.filter) {
            synth.filter.frequency.value = filter
          }
          
          // Play the note
          if (mapping.instrument === 'drums') {
            // For drums, use pitch to control drum frequency
            const drumFreq = 60 + (yValue * 200) // 60-260 Hz range
            synth.frequency.value = drumFreq
            synth.triggerAttackRelease('C2', '8n', undefined, volume)
          } else {
            synth.triggerAttackRelease(pitch, '8n', undefined, volume)
          }
          
          state.lastTriggerTime = currentTime
        }
      }
      
      // Update state
      state.previousY = keypoint.y
      state.previousX = keypoint.x
      state.velocity = velocity
    })
  }, [currentConfig, initializeSynth])

  const stopMusic = useCallback(() => {
    Object.values(synthsRef.current).forEach(synth => {
      if (synth) {
        if ('releaseAll' in synth) {
          synth.releaseAll()
        } else if ('triggerRelease' in synth) {
          synth.triggerRelease()
        }
      }
    })
    bodyPartStatesRef.current = {}
  }, [])

  const updateConfig = useCallback((config: MusicMappingConfig) => {
    setCurrentConfig(config)
  }, [])

  const selectPreset = useCallback((presetName: string) => {
    const preset = PRESET_CONFIGS[presetName]
    if (preset) {
      setCurrentConfig(preset)
    }
  }, [])

  const testSound = useCallback(async () => {
    console.log('Playing test sound...')
    await initializeSynth()
    
    const synth = synthsRef.current.piano
    if (synth) {
      // Play a scale
      const scale = currentConfig.globalScale
      scale.forEach((note, index) => {
        synth.triggerAttackRelease(note + '4', '8n', `+${index * 0.1}`)
      })
    }
  }, [currentConfig, initializeSynth])

  return { 
    generateMusic, 
    stopMusic, 
    currentConfig, 
    updateConfig, 
    selectPreset, 
    testSound 
  }
}