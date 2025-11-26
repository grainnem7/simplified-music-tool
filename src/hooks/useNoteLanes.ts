import { useEffect, useRef, useState, useCallback } from 'react'
import { Pose } from '@tensorflow-models/pose-detection'
import * as Tone from 'tone'
import { useLanePersonalization } from './useLanePersonalization'
import { getCursorFromPose, TrackingSource } from '../services/zoneMapping'

/**
 * Lane definition - represents a single note lane
 */
export interface Lane {
  id: string
  label: string
  centerY: number
  height: number
  notes: string[]
  color: string
}

/**
 * Default lane configuration - 6 lanes using pentatonic scale
 */
export const DEFAULT_LANES: Lane[] = [
  { id: 'lane-0', label: 'C5', centerY: 0.0833, height: 0.1667, notes: ['C5'], color: '#FF6B6B' },
  { id: 'lane-1', label: 'A4', centerY: 0.25, height: 0.1667, notes: ['A4'], color: '#4ECDC4' },
  { id: 'lane-2', label: 'G4', centerY: 0.4167, height: 0.1667, notes: ['G4'], color: '#45B7D1' },
  { id: 'lane-3', label: 'E4', centerY: 0.5833, height: 0.1667, notes: ['E4'], color: '#96CEB4' },
  { id: 'lane-4', label: 'D4', centerY: 0.75, height: 0.1667, notes: ['D4'], color: '#FFEAA7' },
  { id: 'lane-5', label: 'C4', centerY: 0.9167, height: 0.1667, notes: ['C4'], color: '#DFE6E9' }
]

const HYSTERESIS_THRESHOLD = 0.25

interface UseNoteLanesOptions {
  poses: Pose[] | null
  isActive: boolean
  trackingSource?: TrackingSource
}

interface UseNoteLanesReturn {
  cursorY: number | null
  cursorSource: string
  activeLaneId: string | null
  adaptedLanes: Lane[]
  trackingSource: TrackingSource
  setTrackingSource: (source: TrackingSource) => void
  stats: { rangeY: number; sampleCount: number; smoothingFactor: number }
  resetAdaptation: () => void
  isAudioInitialized: boolean
}

export function useNoteLanes({ poses, isActive, trackingSource: initialSource = 'auto' }: UseNoteLanesOptions): UseNoteLanesReturn {
  const [cursorY, setCursorY] = useState<number | null>(null)
  const [cursorSource, setCursorSource] = useState<string>('')
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [trackingSource, setTrackingSource] = useState<TrackingSource>(initialSource)

  const { adaptLanes, updateMovementData, resetAdaptation, getStats } = useLanePersonalization()

  const synthRef = useRef<Tone.Synth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const currentNoteRef = useRef<string | null>(null)
  const lastLaneIdRef = useRef<string | null>(null)

  const adaptedLanes = adaptLanes(DEFAULT_LANES)

  // Initialize audio
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return

    try {
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      reverbRef.current = new Tone.Reverb({ decay: 2, wet: 0.25 }).toDestination()
      synthRef.current = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.8 }
      }).connect(reverbRef.current)
      synthRef.current.volume.value = -10

      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }, [isInitialized])

  // Detect lane with hysteresis
  const detectLane = useCallback((y: number): Lane | null => {
    const currentLaneId = lastLaneIdRef.current

    if (currentLaneId) {
      const currentLane = adaptedLanes.find(l => l.id === currentLaneId)
      if (currentLane) {
        const halfHeight = currentLane.height / 2
        const hysteresisAmount = currentLane.height * HYSTERESIS_THRESHOLD
        const minY = currentLane.centerY - halfHeight - hysteresisAmount
        const maxY = currentLane.centerY + halfHeight + hysteresisAmount

        if (y >= minY && y <= maxY) {
          return currentLane
        }
      }
    }

    for (const lane of adaptedLanes) {
      const halfHeight = lane.height / 2
      if (y >= lane.centerY - halfHeight && y <= lane.centerY + halfHeight) {
        return lane
      }
    }

    if (currentLaneId) {
      let closestLane: Lane | null = null
      let closestDistance = Infinity

      for (const lane of adaptedLanes) {
        const distance = Math.abs(y - lane.centerY)
        if (distance < closestDistance) {
          closestDistance = distance
          closestLane = lane
        }
      }

      if (closestLane && closestDistance < closestLane.height * 0.5) {
        return closestLane
      }
    }

    return null
  }, [adaptedLanes])

  // Trigger lane sound
  const triggerLane = useCallback(async (lane: Lane) => {
    if (lastLaneIdRef.current === lane.id) return

    if (!isInitialized) {
      await initializeAudio()
    }

    if (!synthRef.current) return

    if (currentNoteRef.current) {
      try { synthRef.current.triggerRelease() } catch (e) { /* ignore */ }
    }

    try {
      synthRef.current.triggerAttack(lane.notes[0])
      currentNoteRef.current = lane.notes[0]
      lastLaneIdRef.current = lane.id
      setActiveLaneId(lane.id)

      setTimeout(() => setActiveLaneId(null), 200)
    } catch (error) {
      console.error('Failed to trigger note:', error)
    }
  }, [isInitialized, initializeAudio])

  // Handle pose updates
  useEffect(() => {
    if (!isActive) {
      setCursorY(null)
      setCursorSource('')
      if (currentNoteRef.current && synthRef.current) {
        synthRef.current.triggerRelease()
        currentNoteRef.current = null
        lastLaneIdRef.current = null
      }
      return
    }

    if (!poses || poses.length === 0) return

    const cursor = getCursorFromPose(poses[0], trackingSource)

    if (!cursor) {
      setCursorSource('')
      return
    }

    setCursorSource(cursor.source)
    setCursorY(cursor.y)
    updateMovementData(cursor.y)

    const lane = detectLane(cursor.y)
    if (lane) {
      triggerLane(lane)
    } else if (currentNoteRef.current && synthRef.current) {
      synthRef.current.triggerRelease()
      currentNoteRef.current = null
      lastLaneIdRef.current = null
    }
  }, [poses, isActive, trackingSource, detectLane, triggerLane, updateMovementData])

  // Initialize audio when activated
  useEffect(() => {
    if (isActive && !isInitialized) {
      initializeAudio()
    }
  }, [isActive, isInitialized, initializeAudio])

  // Cleanup
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.triggerRelease()
        synthRef.current.dispose()
      }
      if (reverbRef.current) {
        reverbRef.current.dispose()
      }
    }
  }, [])

  return {
    cursorY,
    cursorSource,
    activeLaneId,
    adaptedLanes,
    trackingSource,
    setTrackingSource,
    stats: getStats(),
    resetAdaptation,
    isAudioInitialized: isInitialized
  }
}
