import { useCallback, useRef, useState } from 'react'
import * as Tone from 'tone'
import { Pose } from '@tensorflow-models/pose-detection'
import { BODY_PART_TO_KEYPOINT, SCALES } from '../services/musicMapping'

export function useMusicGeneration() {
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const drumSynthRef = useRef<any>({})
  const fmSynthRef = useRef<Tone.FMSynth | null>(null)
  const [currentPreset, setCurrentPreset] = useState<string>('piano')
  const isInitializedRef = useRef(false)

  // Initialize all synths and drums
  const initializeSynths = useCallback(async () => {
    if (isInitializedRef.current) return
    
    console.log('Initializing Tone.js...')
    
    try {
      await Tone.start()
      console.log('Tone.js started, context state:', Tone.context.state)
      
      // Make sure the context is running
      if (Tone.context.state !== 'running') {
        await Tone.context.resume()
      }
      
      // Piano synth
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1
        }
      }).toDestination()
      synthRef.current.volume.value = -8
      
      // Drums
      drumSynthRef.current = {
        kick: new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 5,
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.001,
            decay: 0.3,
            sustain: 0.2,
            release: 0.3,
          }
        }).toDestination(),
        
        snare: new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: {
            attack: 0.001,
            decay: 0.1,
            sustain: 0.01,
            release: 0.1
          }
        }).toDestination(),
        
        hihat: new Tone.MetalSynth({
          frequency: 120,
          envelope: {
            attack: 0.001,
            decay: 0.1,
            release: 0.01
          },
          harmonicity: 3.2,
          modulationIndex: 20,
          resonance: 8000,
          octaves: 1.5
        }).toDestination(),
        
        crash: new Tone.MetalSynth({
          frequency: 60,
          envelope: {
            attack: 0.001,
            decay: 1,
            release: 0.5
          },
          harmonicity: 5.1,
          modulationIndex: 40,
          resonance: 4000,
          octaves: 2.5
        }).toDestination()
      }
      
      // Set volumes
      drumSynthRef.current.kick.volume.value = -6
      drumSynthRef.current.snare.volume.value = -8
      drumSynthRef.current.hihat.volume.value = -12
      drumSynthRef.current.crash.volume.value = -10
      
      // FM Synth for synthesizer preset
      fmSynthRef.current = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        detune: 0,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.5,
          release: 0.8
        },
        modulation: {
          type: 'square'
        }
      }).toDestination()
      fmSynthRef.current.volume.value = -10
      
      isInitializedRef.current = true
      console.log('Synths initialized')
      
    } catch (error) {
      console.error('Failed to initialize Tone.js:', error)
    }
  }, [])

  const generateMusic = useCallback(async (poses: Pose[] | null, selectedBodyParts: string[]) => {
    if (!poses || poses.length === 0 || selectedBodyParts.length === 0) {
      return
    }

    await initializeSynths()

    const pose = poses[0]
    const scale = SCALES.pentatonic
    let totalMovement = 0
    let validPartCount = 0
    
    console.log('Generating music for', selectedBodyParts.length, 'body parts')
    console.log('Selected parts:', selectedBodyParts)
    console.log('Current preset:', currentPreset)

    selectedBodyParts.forEach(bodyPart => {
      const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
      console.log('Looking for keypoint names:', possibleKeypointNames)
      
      const keypoint = pose.keypoints.find(kp => {
        const match = possibleKeypointNames.includes(kp.name || '')
        if (kp.name) console.log('Checking:', kp.name, 'against', possibleKeypointNames, '=', match)
        return match
      })
      
      console.log('Found keypoint:', keypoint?.name, 'with score:', keypoint?.score)
      
      if (keypoint && keypoint.score && keypoint.score > 0.3) {
        // Normalize Y position (0 = top, 1 = bottom, but flip it for musical sense)
        const normalizedY = 1 - keypoint.y
        
        // Map Y position to note index (0 to scale.length)
        const noteIndex = Math.floor(normalizedY * scale.length)
        const pitchIndex = Math.max(0, Math.min(scale.length - 1, noteIndex))
        const pitch = scale[pitchIndex]
        
        // Map X position to duration
        const normalizedX = keypoint.x
        const duration = normalizedX < 0.3 ? '16n' : normalizedX < 0.7 ? '8n' : '4n'
        
        // Calculate velocity based on confidence
        const velocity = keypoint.score * 0.8
        
        // Play different sounds based on current preset
        console.log('Playing note:', { bodyPart, pitch, duration, velocity, preset: currentPreset })
        
        if (currentPreset === 'piano' && synthRef.current) {
          console.log('Triggering piano synth')
          synthRef.current.triggerAttackRelease(pitch, duration, undefined, velocity)
        } else if (currentPreset === 'drums' && drumSynthRef.current) {
          // Map body parts to different drums
          if (bodyPart.includes('Wrist') || bodyPart.includes('Hand')) {
            drumSynthRef.current.snare?.triggerAttackRelease(duration)
          } else if (bodyPart.includes('Ankle') || bodyPart.includes('Foot')) {
            drumSynthRef.current.kick?.triggerAttackRelease('C1', duration)
          } else if (bodyPart.includes('Knee')) {
            drumSynthRef.current.hihat?.triggerAttack()
          } else if (bodyPart === 'nose' || bodyPart.includes('Head')) {
            drumSynthRef.current.crash?.triggerAttackRelease(duration)
          }
        } else if (currentPreset === 'synth' && fmSynthRef.current) {
          // Play with FM synth for synthesizer preset
          fmSynthRef.current.triggerAttackRelease(pitch, duration, undefined, velocity)
        }
        
        // Calculate movement for tempo
        totalMovement += Math.abs(keypoint.x - 0.5) + Math.abs(keypoint.y - 0.5)
        validPartCount++
      }
    })

    // Calculate tempo based on average movement
    if (validPartCount > 0) {
      const averageMovement = totalMovement / validPartCount
      const tempo = Math.floor(60 + averageMovement * 120) // 60-180 BPM based on movement
      Tone.Transport.bpm.value = Math.min(180, Math.max(60, tempo))
    }
  }, [currentPreset, initializeSynths])

  const stopMusic = useCallback(() => {
    synthRef.current?.releaseAll()
    fmSynthRef.current?.triggerRelease()
    Object.values(drumSynthRef.current).forEach((drum: any) => {
      if (drum && drum.triggerRelease) {
        drum.triggerRelease()
      }
    })
  }, [])

  const selectPreset = useCallback((presetName: string) => {
    console.log('Selecting preset:', presetName)
    setCurrentPreset(presetName)
  }, [])

  const testSound = useCallback(async () => {
    console.log('Test sound triggered for preset:', currentPreset)
    await initializeSynths()
    
    // Ensure audio context is running
    if (Tone.context.state !== 'running') {
      console.log('Starting audio context...')
      await Tone.context.resume()
    }
    
    console.log('Audio context state:', Tone.context.state)
    
    if (currentPreset === 'piano' && synthRef.current) {
      console.log('Playing piano test sound')
      synthRef.current.triggerAttackRelease(['C4', 'E4', 'G4'], '4n')
    } else if (currentPreset === 'drums' && drumSynthRef.current.kick) {
      drumSynthRef.current.kick.triggerAttackRelease('C1', '8n')
      setTimeout(() => {
        drumSynthRef.current.snare?.triggerAttackRelease('8n')
      }, 200)
      setTimeout(() => {
        drumSynthRef.current.hihat?.triggerAttackRelease('8n')
      }, 400)
    } else if (currentPreset === 'synth' && fmSynthRef.current) {
      fmSynthRef.current.triggerAttackRelease('G3', '8n')
    }
  }, [currentPreset, initializeSynths])

  return { generateMusic, stopMusic, selectPreset, currentPreset, testSound }
}