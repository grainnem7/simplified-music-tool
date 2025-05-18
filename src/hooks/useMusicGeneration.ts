import { useCallback, useRef } from 'react'
import * as Tone from 'tone'
import { Pose } from '@tensorflow-models/pose-detection'
import { mapMovementToMusic } from '../services/musicMapping'

export function useMusicGeneration() {
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const isPlayingRef = useRef(false)

  const initializeSynth = useCallback(async () => {
    if (!synthRef.current) {
      console.log('Initializing Tone.js synth...')
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination()
      await Tone.start()
      console.log('Tone.js initialized, context state:', Tone.context.state)
    }
  }, [])

  const generateMusic = useCallback(async (poses: Pose[] | null, selectedBodyParts: string[]) => {
    if (!poses || poses.length === 0 || selectedBodyParts.length === 0) {
      console.log('No poses or body parts, skipping music generation')
      return
    }

    await initializeSynth()

    const musicParams = mapMovementToMusic(poses[0], selectedBodyParts)
    console.log('Generated music params:', musicParams)
    
    if (synthRef.current && musicParams.notes.length > 0) {
      // Clear previous notes
      synthRef.current.releaseAll()
      
      // Play new notes based on movement
      musicParams.notes.forEach((note, index) => {
        console.log(`Playing note: ${note.pitch}, duration: ${note.duration}, velocity: ${note.velocity}`)
        synthRef.current!.triggerAttackRelease(
          note.pitch,
          note.duration,
          Tone.now() + index * 0.1,
          note.velocity
        )
      })
    }
  }, [])

  const stopMusic = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.releaseAll()
    }
    isPlayingRef.current = false
    console.log('Music stopped')
  }, [])

  return { generateMusic, stopMusic }
}