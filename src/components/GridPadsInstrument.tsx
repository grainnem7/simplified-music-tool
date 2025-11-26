import { useEffect, useRef, useState, useCallback } from 'react'
import { Pose } from '@tensorflow-models/pose-detection'
import * as Tone from 'tone'
import { useGridPersonalization } from '../hooks/useGridPersonalization'
import { getCursorFromPose } from '../services/zoneMapping'
import './GridPadsInstrument.css'

export interface GridPad {
  id: string
  label: string
  description: string
  // Grid position (0-indexed)
  row: number
  col: number
  // Normalized coordinates (0-1) - center of pad
  centerX: number
  centerY: number
  // Pad size in normalized coordinates
  width: number
  height: number
  // Sound properties
  notes: string[]  // Chord or single note
  color: string    // Visual color coding
}

interface GridPadsInstrumentProps {
  poses: Pose[] | null
  isActive: boolean
  onBack: () => void
}

// Grid layout: 2 columns x 3 rows = 6 pads
// Each pad is centered in its grid cell with some gap between pads
const ROWS = 3
const COLS = 2
const PAD_WIDTH = 0.42  // 42% of screen width per pad (with 8% gap)
const PAD_HEIGHT = 0.28 // 28% of screen height per pad (with 8% gap)
const GAP = 0.08        // 8% gap between pads

// Define pad sounds - using major chords for pleasant sound
const DEFAULT_PADS: GridPad[] = [
  // Top row
  {
    id: 'pad-0',
    label: 'Pad 1',
    description: 'C Major',
    row: 0,
    col: 0,
    centerX: 0.25,
    centerY: 0.17,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    notes: ['C4', 'E4', 'G4'],
    color: '#FF6B6B'
  },
  {
    id: 'pad-1',
    label: 'Pad 2',
    description: 'G Major',
    row: 0,
    col: 1,
    centerX: 0.75,
    centerY: 0.17,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    notes: ['G4', 'B4', 'D5'],
    color: '#4ECDC4'
  },
  // Middle row
  {
    id: 'pad-2',
    label: 'Pad 3',
    description: 'A Minor',
    row: 1,
    col: 0,
    centerX: 0.25,
    centerY: 0.5,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    notes: ['A3', 'C4', 'E4'],
    color: '#95E1D3'
  },
  {
    id: 'pad-3',
    label: 'Pad 4',
    description: 'F Major',
    row: 1,
    col: 1,
    centerX: 0.75,
    centerY: 0.5,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    notes: ['F4', 'A4', 'C5'],
    color: '#F38181'
  },
  // Bottom row
  {
    id: 'pad-4',
    label: 'Pad 5',
    description: 'D Minor',
    row: 2,
    col: 0,
    centerX: 0.25,
    centerY: 0.83,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    notes: ['D3', 'F3', 'A3'],
    color: '#AA96DA'
  },
  {
    id: 'pad-5',
    label: 'Pad 6',
    description: 'E Minor',
    row: 2,
    col: 1,
    centerX: 0.75,
    centerY: 0.83,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    notes: ['E4', 'G4', 'B4'],
    color: '#FCBAD3'
  }
]

export function GridPadsInstrument({ poses, isActive, onBack }: GridPadsInstrumentProps) {
  const [activePad, setActivePad] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [touchMode, setTouchMode] = useState(false)

  // Personalization hook - adapts pad positions and sizes based on user's movement
  const { adaptedPads, updateMovementData, resetAdaptation, enlargePad } = useGridPersonalization(DEFAULT_PADS)

  // Audio references
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const lastTriggerTimeRef = useRef<Record<string, number>>({})
  const DEBOUNCE_TIME = 400 // ms - prevent re-triggering too quickly

  // Initialize audio
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return

    console.log('Initializing Grid Pads audio...')

    try {
      // Ensure audio context is running
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      // Create reverb for space
      reverbRef.current = new Tone.Reverb({
        decay: 2,
        wet: 0.25
      }).toDestination()

      // Create polyphonic synth for chords
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 1.2
        }
      }).connect(reverbRef.current)

      synthRef.current.volume.value = -6

      setIsInitialized(true)
      console.log('Grid Pads audio initialized')

    } catch (error) {
      console.error('Failed to initialize audio:', error)
      throw error
    }
  }, [isInitialized])

  // Detect which pad the cursor is in
  const detectPad = useCallback((x: number, y: number): GridPad | null => {
    for (const pad of adaptedPads) {
      const halfWidth = pad.width / 2
      const halfHeight = pad.height / 2
      const minX = pad.centerX - halfWidth
      const maxX = pad.centerX + halfWidth
      const minY = pad.centerY - halfHeight
      const maxY = pad.centerY + halfHeight

      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return pad
      }
    }
    return null
  }, [adaptedPads])

  // Trigger pad sound
  const triggerPad = useCallback((pad: GridPad) => {
    if (!synthRef.current || !isInitialized) return

    const now = Date.now()
    const lastTrigger = lastTriggerTimeRef.current[pad.id] || 0

    // Debounce - don't retrigger too quickly
    if (now - lastTrigger < DEBOUNCE_TIME) {
      return
    }

    // Play the pad's notes
    const velocity = 0.7
    synthRef.current.triggerAttackRelease(pad.notes, '2n', undefined, velocity)

    lastTriggerTimeRef.current[pad.id] = now
    setActivePad(pad.id)

    // Clear active state after a moment
    setTimeout(() => {
      setActivePad(prev => prev === pad.id ? null : prev)
    }, 300)

  }, [isInitialized])

  // Handle pose updates (movement interaction)
  useEffect(() => {
    if (!poses || poses.length === 0 || !isActive || touchMode) {
      setCursorPosition(null)
      return
    }

    const pose = poses[0]
    const cursor = getCursorFromPose(pose)

    if (cursor) {
      setCursorPosition(cursor)

      // Update personalization data
      updateMovementData(cursor.x, cursor.y)

      // Detect pad
      const pad = detectPad(cursor.x, cursor.y)

      if (pad) {
        triggerPad(pad)
      }
    }
  }, [poses, isActive, touchMode, detectPad, triggerPad, updateMovementData])

  // Handle touch/click on pads (accessibility feature)
  const handlePadClick = useCallback((pad: GridPad) => {
    if (!isActive) return

    // Track that user is using touch
    if (!touchMode) {
      setTouchMode(true)
    }

    triggerPad(pad)

    // Also record this as movement data for personalization
    updateMovementData(pad.centerX, pad.centerY)
  }, [isActive, touchMode, triggerPad, updateMovementData])

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
    }
  }, [])

  return (
    <div className="grid-pads-instrument">
      <div className="grid-header">
        <button onClick={onBack} className="button secondary">
          Back
        </button>
        <h2>Grid Pads</h2>
        <div className="grid-header-actions">
          <button onClick={resetAdaptation} className="button secondary" title="Reset pad adaptation">
            Reset
          </button>
          <button
            onClick={() => setTouchMode(!touchMode)}
            className={`button ${touchMode ? 'primary' : 'secondary'}`}
            title="Toggle touch/movement mode"
          >
            {touchMode ? 'Touch' : 'Movement'}
          </button>
        </div>
      </div>

      <div className="grid-instruction">
        <p>
          {touchMode
            ? 'Tap pads to play sounds'
            : 'Move into a pad to play its sound'}
        </p>
        <p className="grid-subtext">
          {touchMode
            ? 'Switch to Movement mode to use camera tracking'
            : 'Switch to Touch mode for direct tapping'}
        </p>
      </div>

      <div className="grid-container">
        {adaptedPads.map(pad => {
          const isActive = activePad === pad.id

          // Calculate position from center coordinates
          const left = (pad.centerX - pad.width / 2) * 100
          const top = (pad.centerY - pad.height / 2) * 100
          const width = pad.width * 100
          const height = pad.height * 100

          return (
            <button
              key={pad.id}
              className={`grid-pad ${isActive ? 'grid-pad-active' : ''}`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
                backgroundColor: isActive ? pad.color : `${pad.color}40`, // 40 = 25% opacity when inactive
                borderColor: pad.color
              }}
              onClick={() => handlePadClick(pad)}
              disabled={!isActive && !touchMode}
              aria-label={`${pad.label}: ${pad.description}`}
            >
              <div className="pad-content">
                <h3 className="pad-label">{pad.label}</h3>
                <p className="pad-description">{pad.description}</p>
              </div>
            </button>
          )
        })}

        {/* Cursor indicator (only in movement mode) */}
        {cursorPosition && !touchMode && (
          <div
            className="grid-cursor-indicator"
            style={{
              left: `${cursorPosition.x * 100}%`,
              top: `${cursorPosition.y * 100}%`
            }}
          >
            <div className="grid-cursor-dot" />
          </div>
        )}
      </div>

      <div className="grid-legend">
        <p className="legend-title">Pad Sounds:</p>
        <div className="legend-items">
          {DEFAULT_PADS.map(pad => (
            <div key={pad.id} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: pad.color }} />
              <span>{pad.label}: {pad.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
