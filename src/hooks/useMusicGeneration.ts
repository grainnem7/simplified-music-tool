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
  const isMobileDevice = useRef<boolean>(isMobile())
  const musicGenerationIntervalRef = useRef<number>(isMobileDevice.current ? 200 : 100)
  const lastMusicGenerationTimeRef = useRef<number>(0)

  // Initialize synth with fallbacks for different browser capabilities
  const initializeSynth = useCallback(async () => {
    if (isInitializedRef.current && synthRef.current) return
    
    console.log('Initializing simple harmonious synth...')
    const mobile = isMobile()
    console.log('Detected platform:', mobile ? 'mobile' : 'desktop')
    
    try {
      // The audio context should already be initialized by PerformanceView
      // But we'll double-check it's running
      try {
        if (Tone.context.state !== 'running') {
          console.log('Starting Tone.js context from initializeSynth')
          await Tone.start()
        }
      } catch (startError) {
        console.warn('Error while starting Tone context:', startError)
        // Try to recover with a direct resume
        try {
          await Tone.context.resume()
        } catch (resumeError) {
          console.error('Failed to resume context:', resumeError)
          // Just continue - the parent components should handle audio context initialization
        }
      }
      
      // Check if we already have a synth and it's still valid
      if (synthRef.current) {
        console.log('Synth already exists, reusing')
        return
      }
      
      try {
        // Create a basic synth first with minimal settings
        console.log('Creating synth with basic settings')
        synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination()
        
        // If that works, add more advanced settings
        const synthOptions = {
          oscillator: { type: 'triangle' },
          envelope: {
            attack: mobile ? 0.1 : 0.2,     // Faster attack on mobile
            decay: mobile ? 0.2 : 0.3,      // Faster decay on mobile
            sustain: 0.4,
            release: mobile ? 1.0 : 1.5     // Shorter release on mobile
          }
        }
        
        try {
          console.log('Applying advanced synth settings')
          synthRef.current.set(synthOptions)
          
          // Try to limit polyphony if supported
          try {
            synthRef.current.options.maxPolyphony = mobile ? 4 : 8
          } catch (polyphonyError) {
            console.warn('Could not set maxPolyphony, might be unsupported:', polyphonyError)
          }
          
          // Set a pleasant volume
          synthRef.current.volume.value = mobile ? -6 : -8
        } catch (settingsError) {
          console.warn('Could not apply advanced settings:', settingsError)
          // Continue with basic synth
        }
      } catch (synthError) {
        console.error('Failed to create PolySynth, trying fallback:', synthError)
        
        // Try a simpler synth as fallback
        try {
          synthRef.current = new Tone.Synth().toDestination()
        } catch (fallbackError) {
          console.error('Even fallback synth failed:', fallbackError)
          throw new Error('Could not initialize audio synthesizer')
        }
      }
      
      isInitializedRef.current = true
      console.log('Synth initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize synth:', error)
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
            baseLatency: Tone.context.baseLatency || 0,
            outputLatency: Tone.context.outputLatency || 0,
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
    
    if (!synthRef.current) {
      console.log('Synth not ready')
      return
    }

    const currentTime = Date.now()
    const mobile = isMobileDevice.current
    
    // Apply throttling for mobile devices
    if (mobile && 
        currentTime - lastMusicGenerationTimeRef.current < musicGenerationIntervalRef.current) {
      return // Skip this frame to conserve resources
    }
    
    lastMusicGenerationTimeRef.current = currentTime
    
    // Measure performance
    const startTime = performance.now()
    
    const pose = poses[0]
    
    // Select only the most important body parts on mobile to reduce processing
    const bodyPartsToProcess = mobile && selectedBodyParts.length > 3
      ? selectedBodyParts.slice(0, 3) // Limit to first 3 on mobile
      : selectedBodyParts
    
    // Process each selected body part
    bodyPartsToProcess.forEach(bodyPart => {
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      const keypoint = pose.keypoints.find(kp => {
        return possibleKeypointNames.includes(kp.name || '')
      })
      
      // Apply stricter confidence threshold on mobile
      const confidenceThreshold = mobile ? 0.4 : 0.3
      
      if (keypoint && keypoint.score && keypoint.score > confidenceThreshold) {
        const currentPos = { x: keypoint.x, y: keypoint.y }
        const previousPos = previousPositionsRef.current[bodyPart]
        
        if (previousPos) {
          const dx = currentPos.x - previousPos.x
          const dy = currentPos.y - previousPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Increase movement threshold on mobile to reduce false triggers
          const moveThreshold = mobile ? 0.03 : 0.02
          
          // Only trigger sound on significant movement
          if (distance > moveThreshold) {
            // Rate limiting: one note per body part, longer on mobile
            const noteInterval = mobile ? 200 : 150
            if (currentTime - lastNoteTimeRef.current > noteInterval) {
              // Use simpler scale on mobile (fewer notes)
              const scale = mobile ? SCALES.pentatonic.slice(0, 3) : SCALES.pentatonic
              const octave = Math.floor((1 - keypoint.y) * 2) + 4 // Octaves 4-5
              const noteIndex = Math.floor(keypoint.x * scale.length)
              const note = scale[Math.max(0, Math.min(scale.length - 1, noteIndex))] + octave
              
              // Play a simple note
              const velocity = Math.min(0.7, distance * 3)
              synthRef.current.triggerAttackRelease(note, mobile ? '16n' : '8n', undefined, velocity)
              
              lastNoteTimeRef.current = currentTime
              
              // On mobile, play chords less frequently
              const chordInterval = mobile ? 3000 : 2000
              
              // Play a chord every few seconds for harmonic foundation
              if (currentTime - lastChordTimeRef.current > chordInterval) {
                const chord = SIMPLE_CHORDS[currentChordIndexRef.current]
                synthRef.current.triggerAttackRelease(chord, mobile ? '1n' : '2n', undefined, 0.3)
                
                currentChordIndexRef.current = (currentChordIndexRef.current + 1) % SIMPLE_CHORDS.length
                lastChordTimeRef.current = currentTime
              }
            }
          }
        }
        
        previousPositionsRef.current[bodyPart] = currentPos
      }
    })
    
    // Report music generation performance
    const processingTime = performance.now() - startTime
    reportPerformance('musicGenerationTime', processingTime)
    
    // Adaptive throttling for mobile
    if (mobile && processingTime > 50) {
      musicGenerationIntervalRef.current = Math.min(300, processingTime * 2)
    }
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
    
    const mobile = isMobileDevice.current
    
    if (synthRef.current) {
      // Adjust synth settings based on preset and device type
      if (presetName === 'piano') {
        synthRef.current.set({
          oscillator: { type: 'triangle' },
          envelope: {
            attack: mobile ? 0.01 : 0.02,
            decay: mobile ? 0.2 : 0.3,
            sustain: 0.4,
            release: mobile ? 0.8 : 1.5
          }
        })
      } else if (presetName === 'synth') {
        synthRef.current.set({
          oscillator: { type: mobile ? 'triangle' : 'sawtooth' }, // Use simpler waveform on mobile
          envelope: {
            attack: mobile ? 0.05 : 0.1,
            decay: mobile ? 0.1 : 0.2,
            sustain: mobile ? 0.5 : 0.6,
            release: mobile ? 0.4 : 0.8
          }
        })
      } else if (presetName === 'mobile-optimized') {
        // Special preset for mobile with extremely optimized settings
        synthRef.current.set({
          oscillator: { type: 'sine' }, // Simplest waveform
          envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.3
          }
        })
        // Also reduce polyphony further
        synthRef.current.options.maxPolyphony = 2
      }
    }
  }, [])

  const testSound = useCallback(async () => {
    console.log('Playing test sound...')
    
    try {
      await initializeSynth()
      
      // If synth initialization failed, create a fallback synth just for the test
      if (!synthRef.current) {
        console.log('Creating temporary test synth')
        synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination()
      }
      
      const mobile = isMobileDevice.current
      
      if (synthRef.current) {
        // Try-catch each sound generation to isolate errors
        try {
          // Play a simpler sequence on mobile for better performance
          if (mobile) {
            // Just play a simple triad
            synthRef.current.triggerAttackRelease(['C4', 'E4', 'G4'], '4n')
          } else {
            // On desktop, play a more complex pleasant sequence
            const notes = ['C4', 'E4', 'G4', 'C5']
            notes.forEach((note, index) => {
              synthRef.current?.triggerAttackRelease(note, '8n', `+${index * 0.2}`)
            })
            
            // Add a chord
            synthRef.current.triggerAttackRelease(['C3', 'E3', 'G3'], '1n', '+1')
          }
        } catch (error) {
          console.error('Error playing test sequence:', error)
          // Try a simpler test as fallback
          try {
            // Just play a single note
            synthRef.current.triggerAttackRelease('C4', '8n')
          } catch (fallbackError) {
            console.error('Even simple note failed:', fallbackError)
            throw new Error('Audio system not working properly')
          }
        }
      } else {
        throw new Error('Could not initialize synthesizer')
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
      if (synthRef.current) {
        synthRef.current.releaseAll()
        synthRef.current.dispose()
      }
    }
  }, [])

  return { 
    generateMusic, 
    stopMusic, 
    selectPreset, 
    currentPreset, 
    testSound,
    isMobile: isMobileDevice.current // Expose mobile status for UI optimizations
  }
}