import { useCallback, useRef, useState } from 'react'
import * as Tone from 'tone'
import { Pose } from '@tensorflow-models/pose-detection'
import { BODY_PART_TO_KEYPOINT } from '../services/musicMapping'

// Simple, harmonious scales
const SCALES = {
  pentatonic: ['C', 'D', 'E', 'G', 'A'],
  major: ['C', 'D', 'E', 'F', 'G', 'A', 'B']
}

// Simple chord progression in C major
const SIMPLE_CHORDS = [
  ['C3', 'E3', 'G3'],    // C major
  ['F3', 'A3', 'C4'],    // F major
  ['G3', 'B3', 'D4'],    // G major
  ['A3', 'C4', 'E4'],    // A minor
]

export function useMusicGeneration() {
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const [currentPreset, setCurrentPreset] = useState<string>('piano')
  const isInitializedRef = useRef(false)
  const lastNoteTimeRef = useRef<number>(0)
  const lastChordTimeRef = useRef<number>(0)
  const currentChordIndexRef = useRef<number>(0)
  const previousPositionsRef = useRef<Record<string, { x: number; y: number }>>({})

  // Initialize synth
  const initializeSynth = useCallback(async () => {
    if (isInitializedRef.current) return
    
    console.log('Initializing simple harmonious synth...')
    
    try {
      // Make sure audio context is started
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }
      
      // Simple polyphonic synth with warm sound
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.2,
          decay: 0.3,
          sustain: 0.4,
          release: 1.5
        }
      }).toDestination()
      
      // Set a pleasant volume
      synthRef.current.volume.value = -8
      
      isInitializedRef.current = true
      console.log('Synth initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize synth:', error)
    }
  }, [])

  const generateMusic = useCallback(async (poses: Pose[] | null, selectedBodyParts: string[]) => {
    if (!poses || poses.length === 0 || selectedBodyParts.length === 0) {
      return
    }

    await initializeSynth()
    
    if (!synthRef.current) {
      console.log('Synth not ready')
      return
    }

    const pose = poses[0]
    const currentTime = Date.now()
    
    // Debug logging
    console.log('Generating music with', selectedBodyParts.length, 'body parts')
    
    // Process each selected body part
    selectedBodyParts.forEach(bodyPart => {
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      const keypoint = pose.keypoints.find(kp => {
        return possibleKeypointNames.includes(kp.name || '')
      })
      
      if (keypoint && keypoint.score && keypoint.score > 0.3) {
        const currentPos = { x: keypoint.x, y: keypoint.y }
        const previousPos = previousPositionsRef.current[bodyPart]
        
        if (previousPos) {
          const dx = currentPos.x - previousPos.x
          const dy = currentPos.y - previousPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Only trigger sound on significant movement
          if (distance > 0.02) {
            // Rate limiting: one note per body part every 150ms
            if (currentTime - lastNoteTimeRef.current > 150) {
              // Map vertical position to note
              const scale = SCALES.pentatonic
              const octave = Math.floor((1 - keypoint.y) * 2) + 4 // Octaves 4-5
              const noteIndex = Math.floor(keypoint.x * scale.length)
              const note = scale[Math.max(0, Math.min(scale.length - 1, noteIndex))] + octave
              
              // Play a simple note
              const velocity = Math.min(0.7, distance * 3)
              synthRef.current.triggerAttackRelease(note, '8n', undefined, velocity)
              
              lastNoteTimeRef.current = currentTime
              
              // Play a chord every 2 seconds for harmonic foundation
              if (currentTime - lastChordTimeRef.current > 2000) {
                const chord = SIMPLE_CHORDS[currentChordIndexRef.current]
                synthRef.current.triggerAttackRelease(chord, '2n', undefined, 0.3)
                
                currentChordIndexRef.current = (currentChordIndexRef.current + 1) % SIMPLE_CHORDS.length
                lastChordTimeRef.current = currentTime
              }
            }
          }
        }
        
        previousPositionsRef.current[bodyPart] = currentPos
      }
    })
  }, [initializeSynth])

  const stopMusic = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.releaseAll()
    }
    previousPositionsRef.current = {}
  }, [])

  const selectPreset = useCallback((presetName: string) => {
    console.log('Selecting preset:', presetName)
    setCurrentPreset(presetName)
    
    if (synthRef.current) {
      // Adjust synth settings based on preset
      if (presetName === 'piano') {
        synthRef.current.set({
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.02,
            decay: 0.3,
            sustain: 0.4,
            release: 1.5
          }
        })
      } else if (presetName === 'synth') {
        synthRef.current.set({
          oscillator: { type: 'sawtooth' },
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.6,
            release: 0.8
          }
        })
      }
    }
  }, [])

  const testSound = useCallback(async () => {
    console.log('Playing test sound...')
    await initializeSynth()
    
    if (synthRef.current) {
      // Play a simple, pleasant sequence
      const notes = ['C4', 'E4', 'G4', 'C5']
      notes.forEach((note, index) => {
        synthRef.current?.triggerAttackRelease(note, '8n', `+${index * 0.2}`)
      })
      
      // Add a chord
      synthRef.current.triggerAttackRelease(['C3', 'E3', 'G3'], '1n', '+1')
    }
  }, [initializeSynth])

  return { generateMusic, stopMusic, selectPreset, currentPreset, testSound }
}