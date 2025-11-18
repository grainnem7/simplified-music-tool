import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { Pose } from '@tensorflow-models/pose-detection'
import { BODY_PART_TO_KEYPOINT } from '../services/musicMapping'
import { useMusicSettings, SCALES, CHORD_PROGRESSIONS as CONTEXT_CHORD_PROGRESSIONS, ScaleType, SynthType } from '../contexts/MusicSettingsContext'

// Map SynthType to Tone.js oscillator type string
const synthTypeToOscillator = (synthType: SynthType): string => {
  switch (synthType) {
    case 'sine': return 'sine'
    case 'triangle': return 'triangle'
    case 'square': return 'square'
    case 'sawtooth': return 'sawtooth'
    case 'pulse': return 'pulse'
    case 'pwm': return 'pwm'
    default: return 'sine'
  }
}

// Note names for building scales
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Helper to generate a scale from root note and scale type
const generateScale = (rootNote: string, scaleType: ScaleType): string[] => {
  const rootIndex = NOTE_NAMES.indexOf(rootNote.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#'))
  if (rootIndex === -1) return NOTE_NAMES // fallback

  const intervals = SCALES[scaleType].intervals
  return intervals.map(interval => NOTE_NAMES[(rootIndex + interval) % 12])
}

// Helper to build chord notes from a chord name and octave
const buildChordNotes = (chordName: string, baseOctave: number): string[] => {
  // Parse chord name to get root and type
  const match = chordName.match(/^([A-G][#b]?)(.*?)$/)
  if (!match) return []

  const root = match[1]
  const type = match[2]
  const rootIndex = NOTE_NAMES.indexOf(root.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#'))

  let intervals: number[] = []
  let mood = 'contemplative'

  // Determine chord intervals based on type
  if (type.includes('Maj7') || type.includes('maj7')) {
    intervals = [0, 4, 7, 11] // Major 7th
    mood = 'bright'
  } else if (type.includes('m7') || type.includes('min7')) {
    intervals = [0, 3, 7, 10] // Minor 7th
    mood = 'contemplative'
  } else if (type.includes('7')) {
    intervals = [0, 4, 7, 10] // Dominant 7th
    mood = 'brightening'
  } else if (type.includes('m7b5') || type.includes('ø')) {
    intervals = [0, 3, 6, 10] // Half-diminished
    mood = 'deeper'
  } else if (type.includes('m') || type.includes('min')) {
    intervals = [0, 3, 7] // Minor triad
    mood = 'contemplative'
  } else {
    intervals = [0, 4, 7] // Major triad
    mood = 'bright'
  }

  // Build pad chord (spread voicing)
  const padNotes = intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12
    const octave = baseOctave + Math.floor((rootIndex + interval) / 12)
    return NOTE_NAMES[noteIndex] + octave
  })

  // Add extensions for fuller sound
  const extendedPadNotes = [
    ...padNotes,
    NOTE_NAMES[(rootIndex + intervals[2]) % 12] + (baseOctave + 1), // 5th up an octave
    NOTE_NAMES[(rootIndex + intervals[3] || intervals[2]) % 12] + (baseOctave + 1) // 7th or 5th
  ]

  return extendedPadNotes
}

// Helper to get bass notes for a chord
const getBassNotes = (chordName: string): string[] => {
  const match = chordName.match(/^([A-G][#b]?)/)
  if (!match) return ['C1', 'C2']

  const root = match[1]
  const rootIndex = NOTE_NAMES.indexOf(root.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#'))
  const fifth = NOTE_NAMES[(rootIndex + 7) % 12]

  return [root + '1', root + '2', fifth + '1']
}

// Helper to get mood from chord type
const getMoodFromChord = (chordName: string): string => {
  if (chordName.includes('Maj7') || chordName.includes('maj7')) return 'bright'
  if (chordName.includes('m7b5') || chordName.includes('ø')) return 'deeper'
  if (chordName.includes('m7') || chordName.includes('min7')) return 'contemplative'
  if (chordName.includes('7')) return 'brightening'
  if (chordName.includes('m') || chordName.includes('min')) return 'returning'
  return 'peaceful'
}

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
  const { settings } = useMusicSettings()
  const padSynthRef = useRef<Tone.PolySynth | null>(null)
  const bassPadSynthRef = useRef<Tone.PolySynth | null>(null) // Bass pad synth for left side
  const harpSynthRef = useRef<Tone.PolySynth | null>(null) // Harp-like sound for right side
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const delayRef = useRef<Tone.FeedbackDelay | null>(null)
  const filterRef = useRef<Tone.Filter | null>(null)
  const chorusRef = useRef<Tone.Chorus | null>(null) // For lush sound
  const [currentPreset, setCurrentPreset] = useState<string>('ambient')
  const [currentChord, setCurrentChord] = useState<string>('Dm7')
  const [movementIntensity, setMovementIntensity] = useState<number>(0)
  const [bodyPartIntensities, setBodyPartIntensities] = useState<Record<string, number>>({})
  const isInitializedRef = useRef(false)

  // Apply audio settings from context when they change
  useEffect(() => {
    if (reverbRef.current) {
      reverbRef.current.wet.value = settings.reverbAmount
    }
    if (delayRef.current) {
      delayRef.current.wet.value = settings.delayAmount * 0.5
    }
    if (filterRef.current) {
      const freq = 500 + (settings.filterFrequency * 3500)
      filterRef.current.frequency.value = freq
      filterRef.current.type = settings.filterType
    }

    // Update synth oscillator types
    if (harpSynthRef.current) {
      try {
        harpSynthRef.current.set({
          oscillator: { type: synthTypeToOscillator(settings.melodicSynthType) as any }
        })
      } catch (e) {
        console.warn('Could not update melodic synth type:', e)
      }
    }
    if (bassPadSynthRef.current) {
      try {
        bassPadSynthRef.current.set({
          oscillator: { type: synthTypeToOscillator(settings.bassSynthType) as any }
        })
      } catch (e) {
        console.warn('Could not update bass synth type:', e)
      }
    }
    if (padSynthRef.current) {
      try {
        padSynthRef.current.set({
          oscillator: { type: synthTypeToOscillator(settings.chordSynthType) as any }
        })
      } catch (e) {
        console.warn('Could not update chord synth type:', e)
      }
    }

    // Update envelope settings on all synths
    const attackTime = 0.001 + (settings.attackTime * 0.499) // 0.001s to 0.5s
    const releaseTime = 0.1 + (settings.releaseTime * 1.9) // 0.1s to 2s

    if (harpSynthRef.current) {
      try {
        harpSynthRef.current.set({
          envelope: {
            attack: attackTime,
            release: releaseTime
          }
        })
      } catch (e) {
        console.warn('Could not update melodic envelope:', e)
      }
    }
    if (bassPadSynthRef.current) {
      try {
        bassPadSynthRef.current.set({
          envelope: {
            attack: attackTime * 2, // Bass needs slower attack
            release: releaseTime * 1.5
          }
        })
      } catch (e) {
        console.warn('Could not update bass envelope:', e)
      }
    }
    if (padSynthRef.current) {
      try {
        padSynthRef.current.set({
          envelope: {
            attack: attackTime * 1.5,
            release: releaseTime * 1.2
          }
        })
      } catch (e) {
        console.warn('Could not update chord envelope:', e)
      }
    }

    // Update chorus for harmonic richness
    if (chorusRef.current) {
      chorusRef.current.wet.value = settings.harmonicRichness * 0.4
      chorusRef.current.depth = settings.harmonicRichness
    }
  }, [
    settings.reverbAmount,
    settings.delayAmount,
    settings.filterFrequency,
    settings.filterType,
    settings.melodicSynthType,
    settings.bassSynthType,
    settings.chordSynthType,
    settings.attackTime,
    settings.releaseTime,
    settings.harmonicRichness
  ])
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
            lookAhead: Tone.context.lookAhead || 0,
          }

          console.log('Audio context performance:', contextState)

          // Report simplified latency metric for performance tracking
          const totalLatency = contextState.lookAhead * 1000
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

    // Separate body parts by their configured roles (not just left/right)
    // First filter out disabled parts
    const enabledParts = bodyPartsToProcess.filter(part => {
      const config = settings.bodyPartConfigs[part]
      return config?.role !== 'disabled'
    })

    const bassParts = enabledParts.filter(part => {
      const config = settings.bodyPartConfigs[part]
      return config?.role === 'bass'
    })
    const chordParts = enabledParts.filter(part => {
      const config = settings.bodyPartConfigs[part]
      return config?.role === 'chord'
    })
    const melodicParts = enabledParts.filter(part => {
      const config = settings.bodyPartConfigs[part]
      return config?.role === 'melodic'
    })

    // Parts without config use default left/right behavior
    const unconfiguredParts = enabledParts.filter(part => {
      const config = settings.bodyPartConfigs[part]
      return !config
    })

    // Add unconfigured parts to appropriate arrays based on side
    unconfiguredParts.forEach(part => {
      if (isLeftSide(part)) {
        bassParts.push(part)
      } else if (isRightSide(part)) {
        melodicParts.push(part)
      }
    })

    // Debug logging (throttled)
    if ((bassParts.length > 0 || melodicParts.length > 0 || chordParts.length > 0) &&
        currentTime - lastChordChangeTimeRef.current < 100) {
      console.log('Body part roles:', {
        bass: bassParts,
        melodic: melodicParts,
        chord: chordParts,
        configs: Object.fromEntries(
          bodyPartsToProcess.map(p => [p, settings.bodyPartConfigs[p]?.role])
        )
      })
    }

    // Get chord progression from settings
    const selectedProgression = CONTEXT_CHORD_PROGRESSIONS[settings.chordProgression]
    const chordNames = selectedProgression.chords
    const currentChordName = chordNames[currentChordIndexRef.current % chordNames.length]

    // Build current chord data dynamically
    const chordData = {
      name: currentChordName,
      mood: getMoodFromChord(currentChordName),
      padChord: buildChordNotes(currentChordName, 2),
      bassChord: getBassNotes(currentChordName)
    }

    // Generate scale from settings
    const userScale = generateScale(settings.rootNote, settings.scale)

    currentMusicalState = {
      rootNote: settings.rootNote,
      chordTones: userScale.slice(0, 4),
      bassNote: settings.rootNote
    }
    
    // Process bass parts for chord control and bass
    let totalBassMovement = 0
    bassParts.forEach(bodyPart => {
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      const keypoint = pose.keypoints.find(kp => {
        return possibleKeypointNames.includes(kp.name || '')
      })

      // Use settings for confidence threshold
      const confidenceThreshold = settings.confidenceThreshold

      if (keypoint && keypoint.score && keypoint.score > confidenceThreshold) {
        const currentPos = { x: keypoint.x, y: keypoint.y }
        const previousPos = previousPositionsRef.current[bodyPart]

        if (previousPos) {
          const distance = Math.sqrt(
            Math.pow(currentPos.x - previousPos.x, 2) +
            Math.pow(currentPos.y - previousPos.y, 2)
          )

          // Accumulate movement for chord changes
          totalBassMovement += distance

          // Calculate velocity with smoothing
          const prevVelocity = previousVelocityRef.current[bodyPart] || 0
          const currentVelocity = distance * 50
          const smoothedVelocity = prevVelocity * 0.7 + currentVelocity * 0.3
          previousVelocityRef.current[bodyPart] = smoothedVelocity

          // Play bass pad based on movement - use settings threshold
          const moveThreshold = settings.movementThreshold
          if (distance > moveThreshold && bassPadSynthRef.current) {
            if (!lastNoteTimeRef.current[bodyPart]) {
              lastNoteTimeRef.current[bodyPart] = 0
            }

            // Different timing for different body parts - use settings interval and tempo
            const tempoMultiplier = (settings.tempoRange[0] + settings.tempoRange[1]) / 180 // Normalize tempo
            const baseInterval = (settings.noteInterval * 1.6) / tempoMultiplier
            const intervalMultiplier = bodyPart.includes('Wrist') ? 0.8 : 1.2
            const noteInterval = baseInterval * intervalMultiplier

            if (currentTime - lastNoteTimeRef.current[bodyPart] > noteInterval) {
              // Get body part config sensitivity for dynamic volume
              const bodyPartConfig = settings.bodyPartConfigs[bodyPart]
              const sensitivityMultiplier = bodyPartConfig?.sensitivity || 1.0

              // Dynamic volume based on velocity and body part sensitivity
              const baseVolume = 0.3 * sensitivityMultiplier
              const velocityBoost = Math.min(0.2, smoothedVelocity * 0.1)
              const volume = baseVolume + velocityBoost

              // Get octave range from body part config
              const octaveRange = bodyPartConfig?.octaveRange || [1, 3]

              // Y position affects which bass notes to emphasize and octave
              const bassNotes = chordData.bassChord
              // Adjust bass notes to use configured octave range
              const adjustedBassNotes = bassNotes.map(note => {
                const noteName = note.replace(/[0-9]/g, '')
                const baseOctave = octaveRange[0]
                const octaveBoost = keypoint.y < 0.5 ? 1 : 0
                return noteName + Math.min(octaveRange[1], baseOctave + octaveBoost)
              })

              const notesToPlay = keypoint.y < 0.5
                ? adjustedBassNotes.slice(0, 2) // Higher position = two notes
                : [adjustedBassNotes[0]] // Lower position = just root

              // Musical duration
              bassPadSynthRef.current.triggerAttackRelease(notesToPlay, '4n', undefined, volume)
              lastNoteTimeRef.current[bodyPart] = currentTime
            }
          }
        }

        previousPositionsRef.current[bodyPart] = currentPos
      }
    })

    // Process chord parts - they trigger chord changes and play pad chords
    let totalChordMovement = 0
    chordParts.forEach(bodyPart => {
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      const keypoint = pose.keypoints.find(kp => {
        return possibleKeypointNames.includes(kp.name || '')
      })

      const confidenceThreshold = settings.confidenceThreshold

      if (keypoint && keypoint.score && keypoint.score > confidenceThreshold) {
        const currentPos = { x: keypoint.x, y: keypoint.y }
        const previousPos = previousPositionsRef.current[bodyPart]

        if (previousPos) {
          const distance = Math.sqrt(
            Math.pow(currentPos.x - previousPos.x, 2) +
            Math.pow(currentPos.y - previousPos.y, 2)
          )

          // Chord parts accumulate movement for chord changes
          totalChordMovement += distance

          // Calculate velocity
          const prevVelocity = previousVelocityRef.current[bodyPart] || 0
          const currentVelocity = distance * 50
          const smoothedVelocity = prevVelocity * 0.7 + currentVelocity * 0.3
          previousVelocityRef.current[bodyPart] = smoothedVelocity

          // Play pad chord based on movement
          const moveThreshold = settings.movementThreshold
          if (distance > moveThreshold && padSynthRef.current) {
            if (!lastNoteTimeRef.current[bodyPart]) {
              lastNoteTimeRef.current[bodyPart] = 0
            }

            // Chord timing - slower than melodic
            const tempoMultiplier = (settings.tempoRange[0] + settings.tempoRange[1]) / 180
            const baseInterval = (settings.noteInterval * 2) / tempoMultiplier
            const noteInterval = baseInterval

            if (currentTime - lastNoteTimeRef.current[bodyPart] > noteInterval) {
              const bodyPartConfig = settings.bodyPartConfigs[bodyPart]
              const sensitivityMultiplier = bodyPartConfig?.sensitivity || 1.0
              const octaveRange = bodyPartConfig?.octaveRange || [2, 4]

              // Build chord at configured octave
              const chordNotes = buildChordNotes(currentChordName, octaveRange[0])
              const volume = 0.2 * sensitivityMultiplier

              padSynthRef.current.triggerAttackRelease(chordNotes, '2n', undefined, volume)
              lastNoteTimeRef.current[bodyPart] = currentTime
            }
          }
        }

        previousPositionsRef.current[bodyPart] = currentPos
      }
    })

    // Accumulate movement for chord changes (from both bass and chord parts)
    leftMovementAccumulatorRef.current += totalBassMovement + totalChordMovement

    // Check if we should change chord based on accumulated movement
    const chordChangeThreshold = mobile ? 1.5 : 1.0 // Amount of movement needed
    const minTimeBetweenChanges = 2000 // At least 2 seconds between changes

    if (leftMovementAccumulatorRef.current > chordChangeThreshold &&
        currentTime - lastChordChangeTimeRef.current > minTimeBetweenChanges) {

      // Change to next chord in selected progression
      currentChordIndexRef.current = (currentChordIndexRef.current + 1) % chordNames.length
      const newChordName = chordNames[currentChordIndexRef.current]
      const newChordData = {
        name: newChordName,
        mood: getMoodFromChord(newChordName),
        padChord: buildChordNotes(newChordName, 2),
        bassChord: getBassNotes(newChordName)
      }

      // Update musical state
      currentMusicalState = {
        rootNote: settings.rootNote,
        chordTones: userScale.slice(0, 4),
        bassNote: settings.rootNote
      }

      // Play the new chord
      padSynthRef.current.triggerAttackRelease(newChordData.padChord, '2n', undefined, 0.2)

      console.log(`Chord changed to: ${newChordData.name} (${newChordData.mood})`)

      // Update current chord state for UI
      setCurrentChord(newChordData.name)

      // Reset melodic pattern for new chord
      melodicPatternIndexRef.current = 0

      // Reset accumulator and update time
      leftMovementAccumulatorRef.current = 0
      lastChordChangeTimeRef.current = currentTime
      lastChordTimeRef.current = currentTime
    }

    // Update movement intensity for UI (normalized 0-1)
    const totalMovement = totalBassMovement + totalChordMovement
    const intensityFromMovement = Math.min(1, totalMovement * 10 + leftMovementAccumulatorRef.current * 0.5)
    setMovementIntensity(intensityFromMovement)

    // Track per-body-part intensities
    const newIntensities: Record<string, number> = {}

    // Calculate intensity for each enabled part based on velocity
    enabledParts.forEach(bodyPart => {
      const velocity = previousVelocityRef.current[bodyPart] || 0
      // Normalize velocity to 0-1 range (velocity is typically 0-50)
      newIntensities[bodyPart] = Math.min(1, velocity / 30)
    })

    setBodyPartIntensities(newIntensities)
    
    // Process melodic parts for melodic control with musical phrasing
    let melodicActive = false
    melodicParts.forEach(bodyPart => {
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      const keypoint = pose.keypoints.find(kp => {
        return possibleKeypointNames.includes(kp.name || '')
      })

      // Use settings for confidence threshold
      const confidenceThreshold = settings.confidenceThreshold

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

          // Play melodic notes with better spacing - use settings threshold
          const moveThreshold = settings.movementThreshold
          if (distance > moveThreshold && harpSynthRef.current) {
            melodicActive = true

            if (!lastNoteTimeRef.current[bodyPart]) {
              lastNoteTimeRef.current[bodyPart] = 0
            }

            // More musical timing - use settings interval and tempo
            const tempoMultiplier = (settings.tempoRange[0] + settings.tempoRange[1]) / 180
            const baseInterval = settings.noteInterval / tempoMultiplier
            const velocityBonus = Math.min(150, smoothedVelocity * 3)

            // Apply swing - alternating notes are longer/shorter
            const swingFactor = settings.swingAmount * 0.3 // Max 30% swing
            const isSwungNote = phraseCounterRef.current % 2 === 0
            const swingAdjustment = isSwungNote ? (1 + swingFactor) : (1 - swingFactor)
            const noteInterval = (baseInterval + velocityBonus) * swingAdjustment

            if (currentTime - lastNoteTimeRef.current[bodyPart] > noteInterval) {
              const soundConfig = BODY_PART_SOUNDS[bodyPart]

              // Use the scale from settings
              const scale = userScale
              const pattern = MELODIC_PATTERNS[chordData.mood] || MELODIC_PATTERNS.contemplative

              // Use melodic patterns for musical direction
              const patternStep = pattern[melodicPatternIndexRef.current % pattern.length]

              // Y position determines base note in scale
              const scalePosition = Math.floor((1 - keypoint.y) * scale.length)
              const adjustedPosition = Math.max(0, Math.min(scale.length - 1, scalePosition + patternStep))
              const noteName = scale[adjustedPosition]

              // Determine octave based on body part config from settings or defaults
              const bodyPartConfig = settings.bodyPartConfigs[bodyPart]
              const octaveRange = bodyPartConfig?.octaveRange || soundConfig.octaveRange
              const baseOctave = octaveRange[0]
              const octaveBoost = Math.floor((1 - keypoint.y) * 2)  // 0-2 octave range
              const octave = Math.min(octaveRange[1], baseOctave + octaveBoost)
              
              const note = noteName + octave
              
              // Smooth velocity based on movement, phrase position, and body part sensitivity
              const phrasePosition = phraseCounterRef.current % 8
              const phraseDynamics = phrasePosition < 4 ? 0.1 : -0.1  // Crescendo and decrescendo
              const sensitivityMultiplier = bodyPartConfig?.sensitivity || 1.0

              // Apply dynamics range from settings
              const [minDynamics, maxDynamics] = settings.dynamicsRange
              const rawVelocity = (0.4 + phraseDynamics + smoothedVelocity * 0.05) * sensitivityMultiplier
              const velocity = Math.min(maxDynamics, Math.max(minDynamics, rawVelocity))
              
              // Vary note duration based on movement and phrase
              const isAccent = phrasePosition === 0 || phrasePosition === 4
              const duration = isAccent ? '4n' : (bodyPart.includes('Wrist') ? '8n' : '8n.')
              
              // Update filter for expression
              if (filterRef.current) {
                const baseFreq = chordData.mood === 'bright' || chordData.mood === 'brightening' ? 3000 : 2000
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
    if (!melodicActive && phraseCounterRef.current > 0) {
      setTimeout(() => {
        if (!melodicActive) {
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
  }, [initializeSynth, settings.movementThreshold, settings.confidenceThreshold, settings.noteInterval, settings.bodyPartConfigs, settings.scale, settings.rootNote, settings.chordProgression, settings.tempoRange, settings.dynamicsRange, settings.swingAmount])

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
    isMobile: isMobileDevice.current, // Expose mobile status for UI optimizations
    currentChord,
    movementIntensity,
    bodyPartIntensities
  }
}

