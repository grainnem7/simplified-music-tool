import { useEffect, useRef, useState, useCallback } from 'react'
import { Pose } from '@tensorflow-models/pose-detection'
import * as Tone from 'tone'
import { useZonePersonalization } from '../hooks/useZonePersonalization'
import { getCursorFromPose } from '../services/zoneMapping'
import './MovementZonesInstrument.css'

export interface Zone {
  id: string
  label: string
  description: string
  // Normalized coordinates (0-1)
  x: number
  y: number
  width: number
  height: number
  // Musical properties
  noteRange: [string, string]  // e.g., ['C3', 'C4']
  timbre: 'bright' | 'warm' | 'deep'
}

interface MovementZonesInstrumentProps {
  poses: Pose[] | null
  isActive: boolean
  onBack: () => void
}

// Default zone layout: 2 columns x 3 rows = 6 zones
// Left column = lower pitch, Right column = higher pitch
// Top row = highest in column, Bottom row = lowest in column
const DEFAULT_ZONES: Zone[] = [
  // Left column - Lower register
  {
    id: 'zone-low-bottom',
    label: 'Deep Bass',
    description: 'Very low, rich tones',
    x: 0,
    y: 0.66,
    width: 0.5,
    height: 0.34,
    noteRange: ['C2', 'G2'],
    timbre: 'deep'
  },
  {
    id: 'zone-low-mid',
    label: 'Low Notes',
    description: 'Warm, mellow sounds',
    x: 0,
    y: 0.33,
    width: 0.5,
    height: 0.33,
    noteRange: ['G2', 'D3'],
    timbre: 'warm'
  },
  {
    id: 'zone-low-top',
    label: 'Mid-Low',
    description: 'Medium-low tones',
    x: 0,
    y: 0,
    width: 0.5,
    height: 0.33,
    noteRange: ['D3', 'A3'],
    timbre: 'warm'
  },
  // Right column - Higher register
  {
    id: 'zone-high-bottom',
    label: 'Mid Notes',
    description: 'Central, balanced tones',
    x: 0.5,
    y: 0.66,
    width: 0.5,
    height: 0.34,
    noteRange: ['A3', 'E4'],
    timbre: 'warm'
  },
  {
    id: 'zone-high-mid',
    label: 'High Notes',
    description: 'Clear, singing tones',
    x: 0.5,
    y: 0.33,
    width: 0.5,
    height: 0.33,
    noteRange: ['E4', 'B4'],
    timbre: 'bright'
  },
  {
    id: 'zone-high-top',
    label: 'Bright High',
    description: 'Shimmering, brilliant sounds',
    x: 0.5,
    y: 0,
    width: 0.5,
    height: 0.33,
    noteRange: ['B4', 'E5'],
    timbre: 'bright'
  }
]

export function MovementZonesInstrument({ poses, isActive, onBack }: MovementZonesInstrumentProps) {
  const [currentZone, setCurrentZone] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Personalization hook - adapts zone boundaries to user's movement range
  const { adaptedZones, updateMovementRange, resetAdaptation } = useZonePersonalization(DEFAULT_ZONES)

  // Audio references
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const filterRef = useRef<Tone.Filter | null>(null)
  const lastNoteTimeRef = useRef<number>(0)
  const lastZoneRef = useRef<string | null>(null)

  // Initialize audio
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return

    console.log('Initializing Movement Zones audio...')

    try {
      // Ensure audio context is running
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      // Create reverb for space
      reverbRef.current = new Tone.Reverb({
        decay: 2.5,
        wet: 0.3
      }).toDestination()

      // Create filter for timbral variation
      filterRef.current = new Tone.Filter({
        frequency: 2000,
        type: 'lowpass',
        rolloff: -12
      }).connect(reverbRef.current)

      // Create main synth
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.05,
          decay: 0.3,
          sustain: 0.4,
          release: 1.5
        }
      }).connect(filterRef.current)

      synthRef.current.volume.value = -8

      setIsInitialized(true)
      console.log('Movement Zones audio initialized')

    } catch (error) {
      console.error('Failed to initialize audio:', error)
      throw error
    }
  }, [isInitialized])

  // Detect which zone the cursor is in
  const detectZone = useCallback((x: number, y: number): Zone | null => {
    // Use adapted zones for better personalization
    for (const zone of adaptedZones) {
      if (x >= zone.x && x < zone.x + zone.width &&
          y >= zone.y && y < zone.y + zone.height) {
        return zone
      }
    }
    return null
  }, [adaptedZones])

  // Get notes for a zone based on cursor position within zone
  const getNotesForZone = useCallback((zone: Zone, relativeX: number, relativeY: number): string[] => {
    // Parse note range
    const [lowNote, highNote] = zone.noteRange

    // For now, play a simple triad based on position
    // relativeY determines which note in the range (0 = high note, 1 = low note)
    const scale = ['C', 'D', 'E', 'G', 'A'] // Pentatonic for safety

    // Simple note selection - can be enhanced with more musical logic
    // For now, just play the root note of the range
    return [lowNote]
  }, [])

  // Handle pose updates
  useEffect(() => {
    if (!poses || poses.length === 0 || !isActive) {
      setCursorPosition(null)
      setCurrentZone(null)
      return
    }

    const pose = poses[0]
    const cursor = getCursorFromPose(pose)

    if (cursor) {
      setCursorPosition(cursor)

      // Update movement range for personalization
      updateMovementRange(cursor.x, cursor.y)

      // Detect zone
      const zone = detectZone(cursor.x, cursor.y)

      if (zone) {
        setCurrentZone(zone.id)

        // Play sound when entering a new zone or after sufficient time
        const now = Date.now()
        const shouldPlay = zone.id !== lastZoneRef.current || (now - lastNoteTimeRef.current) > 400

        if (shouldPlay && synthRef.current && isInitialized) {
          // Calculate relative position within zone
          const relativeX = (cursor.x - zone.x) / zone.width
          const relativeY = (cursor.y - zone.y) / zone.height

          // Get notes to play
          const notes = getNotesForZone(zone, relativeX, relativeY)

          // Adjust filter based on timbre
          if (filterRef.current) {
            const filterFreq = zone.timbre === 'bright' ? 3500 :
                               zone.timbre === 'warm' ? 2000 : 1200
            filterRef.current.frequency.rampTo(filterFreq, 0.2)
          }

          // Play notes
          const velocity = 0.6
          synthRef.current.triggerAttackRelease(notes, '2n', undefined, velocity)

          lastNoteTimeRef.current = now
          lastZoneRef.current = zone.id
        }
      } else {
        setCurrentZone(null)
      }
    }
  }, [poses, isActive, detectZone, getNotesForZone, updateMovementRange, isInitialized])

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
        synthRef.current.releaseAll()
        synthRef.current.dispose()
      }
      if (reverbRef.current) {
        reverbRef.current.dispose()
      }
      if (filterRef.current) {
        filterRef.current.dispose()
      }
    }
  }, [])

  return (
    <div className="movement-zones-instrument">
      <div className="zones-header">
        <button onClick={onBack} className="button secondary">
          Back
        </button>
        <h2>Movement Zones</h2>
        <button onClick={resetAdaptation} className="button secondary" title="Reset zone adaptation">
          Reset Zones
        </button>
      </div>

      <div className="zones-instruction">
        <p>Move to a zone to play its sound</p>
        <p className="zones-subtext">Zones adapt to your movement range over time</p>
      </div>

      <div className="zones-container">
        {adaptedZones.map(zone => {
          const isActive = currentZone === zone.id

          return (
            <div
              key={zone.id}
              className={`zone ${isActive ? 'zone-active' : ''} zone-${zone.timbre}`}
              style={{
                left: `${zone.x * 100}%`,
                top: `${zone.y * 100}%`,
                width: `${zone.width * 100}%`,
                height: `${zone.height * 100}%`
              }}
            >
              <div className="zone-content">
                <h3 className="zone-label">{zone.label}</h3>
                <p className="zone-description">{zone.description}</p>
              </div>
            </div>
          )
        })}

        {/* Cursor indicator */}
        {cursorPosition && (
          <div
            className="cursor-indicator"
            style={{
              left: `${cursorPosition.x * 100}%`,
              top: `${cursorPosition.y * 100}%`
            }}
          >
            <div className="cursor-dot" />
          </div>
        )}
      </div>
    </div>
  )
}
