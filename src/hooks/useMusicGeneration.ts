import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { Pose } from '@tensorflow-models/pose-detection'
import { BODY_PART_TO_KEYPOINT } from '../services/musicMapping'

// Detect if we're on a mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768)
}

// Performance monitoring
const reportPerformance = (type: string, value: number) => {
  if (window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('performanceUpdate', {
      detail: { type, value }
    }))
  }
}

// Scales that work with our chord progression
const SCALES_FOR_CHORDS: Record<string, string[]> = {
  'Dm7': ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],  // D natural minor
  'Gm7': ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],  // G natural minor
  'BbMaj7': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],  // Bb major
  'FMaj7': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],  // F major
  'Am7': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],  // A natural minor
  'CMaj7': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],  // C major
}

// Melodic patterns for different moods
const MELODIC_PATTERNS: Record<string, number[]> = {
  contemplative: [0, 2, 3, 2, 0, -2, 0],  // Gentle, circular
  deeper: [0, -2, -3, -2, 0, 1, 0],  // Descending, introspective
  brightening: [0, 2, 4, 2, 4, 5, 4],  // Rising, hopeful
  bright: [0, 2, 4, 5, 7, 5, 4, 2],  // Ascending, joyful
  returning: [0, 1, 3, 1, 0, -1, 0],  // Settling
  peaceful: [0, 2, 3, 5, 3, 2, 0],  // Resolved, calm
}

// Body part to sound mapping for variety
const BODY_PART_SOUNDS: Record<string, { octaveRange: number[]; timbre?: string; type?: string }> = {
  // Right side - different octaves and timbres
  'rightWrist': { octaveRange: [5, 6], timbre: 'bright' },
  'rightElbow': { octaveRange: [4, 5], timbre: 'warm' },
  'rightShoulder': { octaveRange: [4, 5], timbre: 'mellow' },
  'rightHip': { octaveRange: [3, 4], timbre: 'deep' },
  'rightKnee': { octaveRange: [4, 5], timbre: 'warm' },
  'rightAnkle': { octaveRange: [5, 6], timbre: 'bright' },
  // Left side - bass register
  'leftWrist': { octaveRange: [2, 3], type: 'bass' },
  'leftElbow': { octaveRange: [1, 2], type: 'bass' },
  'leftShoulder': { octaveRange: [1, 2], type: 'bass' },
  'leftHip': { octaveRange: [1, 2], type: 'bass' },
  'leftKnee': { octaveRange: [2, 3], type: 'bass' },
  'leftAnkle': { octaveRange: [2, 3], type: 'bass' }
}

// Current musical state
let currentMusicalState = {
  rootNote: 'D',
  chordTones: ['D', 'F', 'A', 'C'],  // Dm7
  bassNote: 'D'
}

// Define which body parts are on the right side (using UI names)
const RIGHT_SIDE_PARTS = ['rightWrist', 'rightElbow', 'rightShoulder', 'rightHip', 'rightKnee', 'rightAnkle']
const LEFT_SIDE_PARTS = ['leftWrist', 'leftElbow', 'leftShoulder', 'leftHip', 'leftKnee', 'leftAnkle']

// Helper to check if a body part is on the right side
const isRightSide = (bodyPart: string): boolean => {
  return RIGHT_SIDE_PARTS.includes(bodyPart)
}

// Helper to check if a body part is on the left side
const isLeftSide = (bodyPart: string): boolean => {
  return LEFT_SIDE_PARTS.includes(bodyPart)
}

// Chord progression with tension and major relief
const CHORD_PROGRESSIONS = [
  {
    name: 'Dm7',
    mood: 'contemplative',
    rootNote: 'D',
    chordTones: ['D', 'F', 'A', 'C'],  // Dm7
    padChord: ['D2', 'A2', 'D3', 'F3', 'A3', 'C4'],  // Dm7
    bassChord: ['D1', 'D2', 'A1'],
  },
  {
    name: 'Gm7',
    mood: 'deeper',
    rootNote: 'G',
    chordTones: ['G', 'Bb', 'D', 'F'],  // Gm7
    padChord: ['G2', 'D3', 'G3', 'Bb3', 'D4', 'F4'],  // Tension
    bassChord: ['G1', 'G2', 'D2'],
  },
  {
    name: 'BbMaj7',
    mood: 'brightening',
    rootNote: 'Bb',
    chordTones: ['Bb', 'D', 'F', 'A'],  // BbMaj7 - First major relief
    padChord: ['Bb2', 'F3', 'Bb3', 'D4', 'F4', 'A4'],
    bassChord: ['Bb1', 'Bb2', 'F2'],
  },
  {
    name: 'FMaj7',
    mood: 'bright',
    rootNote: 'F',
    chordTones: ['F', 'A', 'C', 'E'],  // FMaj7 - Full major relief
    padChord: ['F2', 'C3', 'F3', 'A3', 'C4', 'E4'],
    bassChord: ['F1', 'F2', 'C2'],
  },
  {
    name: 'Am7',
    mood: 'returning',
    rootNote: 'A',
    chordTones: ['A', 'C', 'E', 'G'],  // Am7
    padChord: ['A2', 'E3', 'A3', 'C4', 'E4', 'G4'],
    bassChord: ['A1', 'A2', 'E2'],
  },
  {
    name: 'CMaj7',
    mood: 'peaceful',
    rootNote: 'C',
    chordTones: ['C', 'E', 'G', 'B'],  // CMaj7 - Peaceful resolution
    padChord: ['C2', 'G2', 'C3', 'E3', 'G3', 'B3'],
    bassChord: ['C1', 'C2', 'G1'],
  }
]

export function useMusicGeneration() {
  const padSynthRef = useRef<Tone.PolySynth | null>(null)
  const bassPadSynthRef = useRef<Tone.PolySynth | null>(null) // Bass pad synth for left side
  const harpSynthRef = useRef<Tone.PolySynth | null>(null) // Harp-like sound for right side
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const delayRef = useRef<Tone.FeedbackDelay | null>(null)
  const filterRef = useRef<Tone.Filter | null>(null)
  const chorusRef = useRef<Tone.Chorus | null>(null) // For lush sound
  const [currentPreset, setCurrentPreset] = useState<string>('ambient')
  const isInitializedRef = useRef(false)
  const lastNoteTimeRef = useRef<Record<string, number>>({}) // Track per body part
  const lastChordTimeRef = useRef<number>(0)
  // Removed unused lastBassPadTimeRef
  const currentChordIndexRef = useRef<number>(0)
  const previousPositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const previousVelocityRef = useRef<Record<string, number>>({}) // Track velocity
  const leftMovementAccumulatorRef = useRef<number>(0) // Accumulate left movement for chord changes
  const lastChordChangeTimeRef = useRef<number>(0) // Prevent too rapid chord changes
  const melodicPatternIndexRef = useRef<number>(0) // Track position in melodic pattern
  const lastPlayedNoteRef = useRef<string>('') // Track last note for smoother melodies
  const phraseCounterRef = useRef<number>(0) // Count notes in current phrase
  const isMobileDevice = useRef<boolean>(isMobile())
  const musicGenerationIntervalRef = useRef<number>(isMobileDevice.current ? 200 : 100)
  const lastMusicGenerationTimeRef = useRef<number>(0)

  // Initialize ambient synths with effects
  const initializeSynth = useCallback(async () => {
    if (isInitializedRef.current && padSynthRef.current) return
    
    console.log('Initializing ambient synth architecture...')
    const mobile = isMobile()
    console.log('Detected platform:', mobile ? 'mobile' : 'desktop')
    
    try {
      // Ensure audio context is running
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }
      
      // Create effects chain
      console.log('Creating ambient effects chain...')
      
      // Create church hall reverb
      reverbRef.current = new Tone.Reverb({
        decay: mobile ? 4 : 6,  // Church hall reverb
        wet: 0.35,  // Balanced reverb
        preDelay: 0.05
      }).toDestination()
      
      // Create subtle chorus for richness
      chorusRef.current = new Tone.Chorus({
        frequency: 0.5,
        delayTime: 2.5,
        depth: 0.4,
        type: 'sine',
        spread: 90,
        wet: 0.2
      }).connect(reverbRef.current)
      
      // Create subtle delay
      delayRef.current = new Tone.FeedbackDelay({
        delayTime: '8n.',
        feedback: 0.2,
        wet: 0.15
      }).connect(chorusRef.current)
      
      // Create warm filter
      filterRef.current = new Tone.Filter({
        frequency: 4000,
        type: 'lowpass',
        rolloff: -12,
        Q: 0.5
      }).connect(delayRef.current)
      
      // Create church organ pad synth
      console.log('Creating church organ pad synth...')
      padSynthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine'
          // Removed partials - not supported in type definition
        },
        envelope: {
          attack: 0.3,  // Quick but smooth
          decay: 0.5,
          sustain: 0.6,
          release: 2.5  // Natural organ release
        }
      }).connect(filterRef.current)
      
      padSynthRef.current.volume.value = -10
      // Removed direct access to private options property
      
      // Create cello-like bass synth
      console.log('Creating cello bass synth...')
      bassPadSynthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sawtooth'
          // Removed partials - not supported in type definition
        },
        envelope: {
          attack: 0.8,  // Bow attack
          decay: 0.3,
          sustain: 0.7,
          release: 3  // Natural cello release
        }
      }).connect(filterRef.current)
      
      bassPadSynthRef.current.volume.value = -8
      // Removed direct access to private options property
      
      // Create softer melodic synth for better blending
      console.log('Creating melodic synth...')
      harpSynthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine'
          // Removed partials - not supported in type definition
        },
        envelope: {
          attack: 0.05,  // Slightly slower attack for smoother entries
          decay: 1.2,
          sustain: 0.2,   // Some sustain for connection between notes
          release: 3      // Long release for blending
        }
      }).connect(delayRef.current)
      
      harpSynthRef.current.volume.value = -10
      // Removed direct access to private options property
      
      isInitializedRef.current = true
      console.log('Ambient synth architecture initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize ambient synths:', error)
      throw error
    }
  }, [])

  // Monitor audio performance
  useEffect(() => {
    const checkAudioPerformance = () => {
      try {
        if (Tone.context && Tone.context.state === 'running') {
          // Get current audio context state
          const contextState = {
            sampleRate: Tone.context.sampleRate,
            // Removed baseLatency and outputLatency - not available on BaseContext
            lookAhead: Tone.context.lookAhead || 0,
          }
          
          console.log('Audio context performance:', contextState)
          
          // Report simplified latency metric for performance tracking
          const totalLatency = (contextState.baseLatency + contextState.outputLatency) * 1000
          reportPerformance('audioLatency', totalLatency)
        }
      } catch (err) {
        console.warn('Could not check audio performance:', err)
      }
    }
    
    // Check performance periodically when synth is active
    const intervalId = setInterval(checkAudioPerformance, 5000)
    return () => clearInterval(intervalId)
  }, [])

  // Adjust settings based on device performance
  useEffect(() => {
    const handlePerformanceUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail.type === 'detectionLatency' && isMobileDevice.current) {
        // If pose detection is slow, increase music generation interval too
        if (detail.value > 100) {
          musicGenerationIntervalRef.current = Math.min(300, detail.value)
        }
      }
    }
    
    window.addEventListener('performanceUpdate', handlePerformanceUpdate)
    return () => window.removeEventListener('performanceUpdate', handlePerformanceUpdate)
  }, [])

  const generateMusic = useCallback(async (poses: Pose[] | null, selectedBodyParts: string[]) => {
    if (!poses || poses.length === 0 || selectedBodyParts.length === 0) {
      return
    }

    await initializeSynth()
    
    if (!padSynthRef.current || !harpSynthRef.current || !bassPadSynthRef.current) {
      console.log('Synths not ready')
      return
    }

    const currentTime = Date.now()
    const mobile = isMobileDevice.current
    
    // Apply throttling for mobile devices
    if (mobile && 
        currentTime - lastMusicGenerationTimeRef.current < musicGenerationIntervalRef.current) {
      return
    }
    
    lastMusicGenerationTimeRef.current = currentTime
    
    // Measure performance
    const startTime = performance.now()
    
    const pose = poses[0]
    
    // Select only the most important body parts on mobile to reduce processing
    const bodyPartsToProcess = mobile && selectedBodyParts.length > 3
      ? selectedBodyParts.slice(0, 3)
      : selectedBodyParts
    
    // Separate left and right body parts
    const leftParts = bodyPartsToProcess.filter(part => isLeftSide(part))
    const rightParts = bodyPartsToProcess.filter(part => isRightSide(part))
    
    // Get current chord for harmonic context
    const currentChord = CHORD_PROGRESSIONS[currentChordIndexRef.current]
    currentMusicalState = {
      rootNote: currentChord.rootNote,
      chordTones: currentChord.chordTones,
      bassNote: currentChord.rootNote
    }
    
    // Process left side for chord control and bass
    let totalLeftMovement = 0
    leftParts.forEach(bodyPart => {
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      const keypoint = pose.keypoints.find(kp => {
        return possibleKeypointNames.includes(kp.name || '')
      })
      
      const confidenceThreshold = mobile ? 0.4 : 0.3
      
      if (keypoint && keypoint.score && keypoint.score > confidenceThreshold) {
        const currentPos = { x: keypoint.x, y: keypoint.y }
        const previousPos = previousPositionsRef.current[bodyPart]
        
        if (previousPos) {
          const distance = Math.sqrt(
            Math.pow(currentPos.x - previousPos.x, 2) + 
            Math.pow(currentPos.y - previousPos.y, 2)
          )
          
          // Accumulate movement for chord changes
          totalLeftMovement += distance
          
          // Calculate velocity with smoothing
          const prevVelocity = previousVelocityRef.current[bodyPart] || 0
          const currentVelocity = distance * 50
          const smoothedVelocity = prevVelocity * 0.7 + currentVelocity * 0.3
          previousVelocityRef.current[bodyPart] = smoothedVelocity
          
          // Play bass pad based on movement
          const moveThreshold = 0.02
          if (distance > moveThreshold && bassPadSynthRef.current) {
            if (!lastNoteTimeRef.current[bodyPart]) {
              lastNoteTimeRef.current[bodyPart] = 0
            }
            
            // Different timing for different body parts
            const baseInterval = 400
            const intervalMultiplier = bodyPart.includes('Wrist') ? 0.8 : 1.2
            const noteInterval = baseInterval * intervalMultiplier
            
            if (currentTime - lastNoteTimeRef.current[bodyPart] > noteInterval) {
              // Dynamic volume based on velocity
              const baseVolume = 0.3
              const velocityBoost = Math.min(0.2, smoothedVelocity * 0.1)
              const volume = baseVolume + velocityBoost
              
              // Y position affects which bass notes to emphasize
              const bassChord = currentChord.bassChord
              const notesToPlay = keypoint.y < 0.5 
                ? bassChord.slice(0, 2) // Higher position = two notes
                : [bassChord[0]] // Lower position = just root
              
              // Musical duration
              bassPadSynthRef.current.triggerAttackRelease(notesToPlay, '4n', undefined, volume)
              lastNoteTimeRef.current[bodyPart] = currentTime
            }
          }
        }
        
        previousPositionsRef.current[bodyPart] = currentPos
      }
    })
    
    // Accumulate left movement for chord changes
    leftMovementAccumulatorRef.current += totalLeftMovement
    
    // Check if we should change chord based on accumulated movement
    const chordChangeThreshold = mobile ? 1.5 : 1.0 // Amount of movement needed
    const minTimeBetweenChanges = 2000 // At least 2 seconds between changes
    
    if (leftMovementAccumulatorRef.current > chordChangeThreshold && 
        currentTime - lastChordChangeTimeRef.current > minTimeBetweenChanges) {
      
      // Change to next chord
      currentChordIndexRef.current = (currentChordIndexRef.current + 1) % CHORD_PROGRESSIONS.length
      const newChord = CHORD_PROGRESSIONS[currentChordIndexRef.current]
      
      // Update musical state
      currentMusicalState = {
        rootNote: newChord.rootNote,
        chordTones: newChord.chordTones,
        bassNote: newChord.rootNote
      }
      
      // Play the new chord
      padSynthRef.current.triggerAttackRelease(newChord.padChord, '2n', undefined, 0.2)
      
      console.log(`Chord changed to: ${newChord.name} (${newChord.mood})`)
      
      // Reset melodic pattern for new chord
      melodicPatternIndexRef.current = 0
      
      // Reset accumulator and update time
      leftMovementAccumulatorRef.current = 0
      lastChordChangeTimeRef.current = currentTime
      lastChordTimeRef.current = currentTime
    }
    
    // Process right side for melodic control with musical phrasing
    let rightSideActive = false
    rightParts.forEach(bodyPart => {
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      const keypoint = pose.keypoints.find(kp => {
        return possibleKeypointNames.includes(kp.name || '')
      })
      
      const confidenceThreshold = mobile ? 0.4 : 0.3
      
      if (keypoint && keypoint.score && keypoint.score > confidenceThreshold) {
        const currentPos = { x: keypoint.x, y: keypoint.y }
        const previousPos = previousPositionsRef.current[bodyPart]
        
        if (previousPos) {
          const distance = Math.sqrt(
            Math.pow(currentPos.x - previousPos.x, 2) + 
            Math.pow(currentPos.y - previousPos.y, 2)
          )
          
          // Calculate velocity with smoothing
          const prevVelocity = previousVelocityRef.current[bodyPart] || 0
          const currentVelocity = distance * 50
          const smoothedVelocity = prevVelocity * 0.7 + currentVelocity * 0.3
          previousVelocityRef.current[bodyPart] = smoothedVelocity
          
          // Play melodic notes with better spacing
          const moveThreshold = mobile ? 0.025 : 0.02
          if (distance > moveThreshold && harpSynthRef.current) {
            rightSideActive = true
            
            if (!lastNoteTimeRef.current[bodyPart]) {
              lastNoteTimeRef.current[bodyPart] = 0
            }
            
            // More musical timing - not too fast
            const baseInterval = 250  // Minimum time between notes
            const velocityBonus = Math.min(150, smoothedVelocity * 3)
            const noteInterval = baseInterval + velocityBonus
            
            if (currentTime - lastNoteTimeRef.current[bodyPart] > noteInterval) {
              const soundConfig = BODY_PART_SOUNDS[bodyPart]
              const currentChord = CHORD_PROGRESSIONS[currentChordIndexRef.current]
              
              // Get the full scale for this chord, not just chord tones
              const scale = SCALES_FOR_CHORDS[currentChord.name] || currentMusicalState.chordTones
              const pattern = MELODIC_PATTERNS[currentChord.mood] || MELODIC_PATTERNS.contemplative
              
              // Use melodic patterns for musical direction
              const patternStep = pattern[melodicPatternIndexRef.current % pattern.length]
              
              // Y position determines base note in scale
              const scalePosition = Math.floor((1 - keypoint.y) * scale.length)
              const adjustedPosition = Math.max(0, Math.min(scale.length - 1, scalePosition + patternStep))
              const noteName = scale[adjustedPosition]
              
              // Determine octave based on body part and Y position
              const octaveRange = soundConfig.octaveRange
              const baseOctave = octaveRange[0]
              const octaveBoost = Math.floor((1 - keypoint.y) * 2)  // 0-2 octave range
              const octave = Math.min(octaveRange[1], baseOctave + octaveBoost)
              
              const note = noteName + octave
              
              // Smooth velocity based on movement and phrase position
              const phrasePosition = phraseCounterRef.current % 8
              const phraseDynamics = phrasePosition < 4 ? 0.1 : -0.1  // Crescendo and decrescendo
              const velocity = Math.min(0.6, Math.max(0.2, 0.4 + phraseDynamics + smoothedVelocity * 0.05))
              
              // Vary note duration based on movement and phrase
              const isAccent = phrasePosition === 0 || phrasePosition === 4
              const duration = isAccent ? '4n' : (bodyPart.includes('Wrist') ? '8n' : '8n.')
              
              // Update filter for expression
              if (filterRef.current) {
                const baseFreq = currentChord.mood === 'bright' || currentChord.mood === 'brightening' ? 3000 : 2000
                const filterFreq = baseFreq + (keypoint.y * 1000)  // Higher position = brighter
                filterRef.current.frequency.rampTo(filterFreq, 0.2)
              }
              
              harpSynthRef.current.triggerAttackRelease(note, duration, undefined, velocity)
              
              // Update tracking
              lastNoteTimeRef.current[bodyPart] = currentTime
              lastPlayedNoteRef.current = note
              melodicPatternIndexRef.current++
              phraseCounterRef.current++
            }
          }
        }
        
        previousPositionsRef.current[bodyPart] = currentPos
      }
    })
    
    // Reset phrase counter if no activity
    if (!rightSideActive && phraseCounterRef.current > 0) {
      setTimeout(() => {
        if (!rightSideActive) {
          phraseCounterRef.current = 0
          melodicPatternIndexRef.current = 0
        }
      }, 2000)
    }
    
    // No automatic chord changes - left side controls it now
    
    // Report music generation performance
    const processingTime = performance.now() - startTime
    reportPerformance('musicGenerationTime', processingTime)
    
    // Adaptive throttling for mobile
    if (mobile && processingTime > 50) {
      musicGenerationIntervalRef.current = Math.min(300, processingTime * 2)
    }
  }, [initializeSynth])

  const stopMusic = useCallback(() => {
    if (padSynthRef.current) {
      padSynthRef.current.releaseAll()
    }
    if (harpSynthRef.current) {
      harpSynthRef.current.releaseAll()
    }
    if (bassPadSynthRef.current) {
      bassPadSynthRef.current.releaseAll()
    }
    previousPositionsRef.current = {}
    lastNoteTimeRef.current = {}
    previousVelocityRef.current = {}
    leftMovementAccumulatorRef.current = 0
    currentChordIndexRef.current = 0 // Reset to first chord
  }, [])

  const selectPreset = useCallback((presetName: string) => {
    console.log('Selecting preset:', presetName)
    setCurrentPreset(presetName)
    
    const mobile = isMobileDevice.current
    
    // Apply preset-specific settings
    if (presetName === 'ambient' || presetName === 'lush') {
      // Already configured for ambient in initialization
      if (reverbRef.current) {
        reverbRef.current.wet.value = 0.6
      }
      if (delayRef.current) {
        delayRef.current.wet.value = 0.3
      }
      if (filterRef.current) {
        filterRef.current.frequency.value = 2000
      }
    } else if (presetName === 'ethereal') {
      // Even more spacious and dreamy
      if (reverbRef.current) {
        reverbRef.current.wet.value = 0.8
        reverbRef.current.decay = 12
      }
      if (delayRef.current) {
        delayRef.current.wet.value = 0.5
        delayRef.current.feedback.value = 0.6
      }
      if (filterRef.current) {
        filterRef.current.frequency.value = 1500
      }
      if (padSynthRef.current) {
        padSynthRef.current.set({
          envelope: {
            attack: 4,
            release: 8
          }
        })
      }
    } else if (presetName === 'warm') {
      // Warmer, more intimate sound
      if (reverbRef.current) {
        reverbRef.current.wet.value = 0.4
        reverbRef.current.decay = 3
      }
      if (delayRef.current) {
        delayRef.current.wet.value = 0.2
      }
      if (filterRef.current) {
        filterRef.current.frequency.value = 1200
      }
      if (bassPadSynthRef.current) {
        bassPadSynthRef.current.volume.value = -6
      }
    } else if (presetName === 'mobile-optimized') {
      // Optimized for mobile performance
      if (reverbRef.current) {
        reverbRef.current.wet.value = 0.3
      }
      if (delayRef.current) {
        delayRef.current.wet.value = 0.1
      }
      // Removed direct access to private options property
      // Removed direct access to private options property
    }
  }, [])

  const testSound = useCallback(async () => {
    console.log('Playing ambient test sound...')
    
    try {
      await initializeSynth()
      
      if (!padSynthRef.current || !harpSynthRef.current || !bassPadSynthRef.current) {
        throw new Error('Ambient synths not initialized')
      }
      
      const mobile = isMobileDevice.current
      
      try {
        // Play a beautiful church-like test sequence
        if (mobile) {
          // Simple sequence on mobile
          padSynthRef.current.triggerAttackRelease(['D3', 'F3', 'A3'], '2n', undefined, 0.15)
          bassPadSynthRef.current.triggerAttackRelease(['D2'], '4n', '+0.5', 0.3)
          // Simple harp melody
          harpSynthRef.current.triggerAttackRelease('F5', '8n', '+1')
          harpSynthRef.current.triggerAttackRelease('A5', '8n', '+1.3')
        } else {
          // Church organ sequence on desktop
          // Dm9 chord
          padSynthRef.current.triggerAttackRelease(['D3', 'F3', 'A3', 'C4', 'E4'], '2n', undefined, 0.15)
          
          // Cello bass
          bassPadSynthRef.current.triggerAttackRelease(['D2', 'A2'], '4n', '+0.2', 0.3)
          
          // Harp arpeggios
          const harpNotes = ['D5', 'F5', 'A5', 'C6', 'A5', 'F5']
          harpNotes.forEach((note, index) => {
            harpSynthRef.current?.triggerAttackRelease(note, '8n', `+${0.5 + index * 0.2}`)
          })
          
          // G7sus4 chord
          padSynthRef.current.triggerAttackRelease(['G3', 'C4', 'D4', 'F4'], '2n', '+3', 0.15)
          bassPadSynthRef.current.triggerAttackRelease(['G2'], '4n', '+3.2', 0.3)
          
          // More harp notes
          const harpNotes2 = ['G5', 'C6', 'D6', 'C6', 'G5']
          harpNotes2.forEach((note, index) => {
            harpSynthRef.current?.triggerAttackRelease(note, '8n', `+${3.5 + index * 0.2}`)
          })
        }
      } catch (error) {
        console.error('Error playing ambient test sequence:', error)
        throw new Error('Audio system not working properly')
      }
    } catch (error) {
      console.error('Test sound initialization error:', error)
      throw error
    }
  }, [initializeSynth])
  
  // Release all resources when component unmounts
  useEffect(() => {
    return () => {
      // Release audio resources when component unmounts
      if (padSynthRef.current) {
        padSynthRef.current.releaseAll()
        padSynthRef.current.dispose()
      }
      if (harpSynthRef.current) {
        harpSynthRef.current.releaseAll()
        harpSynthRef.current.dispose()
      }
      if (bassPadSynthRef.current) {
        bassPadSynthRef.current.releaseAll()
        bassPadSynthRef.current.dispose()
      }
      if (reverbRef.current) {
        reverbRef.current.dispose()
      }
      if (delayRef.current) {
        delayRef.current.dispose()
      }
      if (filterRef.current) {
        filterRef.current.dispose()
      }
      if (chorusRef.current) {
        chorusRef.current.dispose()
      }
    }
  }, [])

  const updateSoundSettings = useCallback((settings: {
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    volume?: number;
    oscillatorType?: string;
    maxPolyphony?: number;
    reverb?: number;
    delay?: number;
    filter?: number;
  }) => {
    if (!padSynthRef.current || !harpSynthRef.current) {
      console.warn('Cannot update sound settings: synths not initialized')
      return false
    }

    try {
      const { attack, decay, sustain, release, volume, oscillatorType, maxPolyphony, reverb, delay, filter } = settings

      // Update envelope parameters if provided
      const envelopeSettings: Record<string, number> = {}
      if (attack !== undefined) envelopeSettings.attack = attack
      if (decay !== undefined) envelopeSettings.decay = decay
      if (sustain !== undefined) envelopeSettings.sustain = sustain
      if (release !== undefined) envelopeSettings.release = release

      // Apply envelope changes to harp synth (pad synth keeps long envelopes)
      if (Object.keys(envelopeSettings).length > 0) {
        harpSynthRef.current.set({
          envelope: envelopeSettings
        })
      }

      // Update oscillator type if provided
      if (oscillatorType) {
        harpSynthRef.current.set({
          oscillator: { type: oscillatorType as any }
        })
      }

      // Update volume if provided
      if (volume !== undefined) {
        const dbVolume = -20 + (volume * 20) // Map 0-1 to -20db to 0db
        if (padSynthRef.current) padSynthRef.current.volume.value = dbVolume - 4
        if (harpSynthRef.current) harpSynthRef.current.volume.value = dbVolume - 2
        if (bassPadSynthRef.current) bassPadSynthRef.current.volume.value = dbVolume
      }

      // Update effects parameters
      if (reverb !== undefined && reverbRef.current) {
        reverbRef.current.wet.value = reverb
      }

      if (delay !== undefined && delayRef.current) {
        delayRef.current.wet.value = delay * 0.5 // Scale down delay wet amount
      }

      if (filter !== undefined && filterRef.current) {
        const freq = 500 + (filter * 3500) // Map 0-1 to 500Hz-4000Hz
        filterRef.current.frequency.value = freq
      }

      console.log('Sound settings updated successfully')
      return true
    } catch (error) {
      console.error('Failed to update sound settings:', error)
      return false
    }
  }, [])

  return { 
    generateMusic, 
    stopMusic, 
    selectPreset, 
    currentPreset, 
    testSound,
    updateSoundSettings,
    isMobile: isMobileDevice.current // Expose mobile status for UI optimizations
  }
}

