import { useEffect, useRef, useState, useCallback } from 'react'
import { Pose } from '@tensorflow-models/pose-detection'
import * as Tone from 'tone'
import { useLanePersonalization } from '../hooks/useLanePersonalization'
import { getCursorFromPose, TrackingSource, TRACKING_SOURCE_LABELS } from '../services/zoneMapping'
import './NoteLanesInstrument.css'

/**
 * Lane definition - represents a single note lane
 */
interface Lane {
  id: string
  label: string          // Display name (note name)
  centerY: number        // Normalized Y position (0-1)
  height: number         // Normalized height (0-1)
  notes: string[]        // MIDI notes to play
  color: string          // Visual color
}

/**
 * Default lane configuration - 6 lanes using pentatonic scale
 * Stacked vertically from top to bottom
 */
const DEFAULT_LANES: Lane[] = [
  {
    id: 'lane-0',
    label: 'C5',
    centerY: 0.0833,      // Top lane (1/12 from top)
    height: 0.1667,       // Each lane is 1/6 of screen
    notes: ['C5'],
    color: '#FF6B6B'      // Red
  },
  {
    id: 'lane-1',
    label: 'A4',
    centerY: 0.25,
    height: 0.1667,
    notes: ['A4'],
    color: '#4ECDC4'      // Cyan
  },
  {
    id: 'lane-2',
    label: 'G4',
    centerY: 0.4167,
    height: 0.1667,
    notes: ['G4'],
    color: '#45B7D1'      // Blue
  },
  {
    id: 'lane-3',
    label: 'E4',
    centerY: 0.5833,
    height: 0.1667,
    notes: ['E4'],
    color: '#96CEB4'      // Green
  },
  {
    id: 'lane-4',
    label: 'D4',
    centerY: 0.75,
    height: 0.1667,
    notes: ['D4'],
    color: '#FFEAA7'      // Yellow
  },
  {
    id: 'lane-5',
    label: 'C4',
    centerY: 0.9167,      // Bottom lane
    height: 0.1667,
    notes: ['C4'],
    color: '#DFE6E9'      // Light gray
  }
]

// Hysteresis threshold - must move this far into next lane to switch
const HYSTERESIS_THRESHOLD = 0.25 // 25% of lane height

interface NoteLanesInstrumentProps {
  poses: Pose[] | null
  isActive: boolean
  onBack: () => void
}

export function NoteLanesInstrument({ poses, isActive, onBack }: NoteLanesInstrumentProps) {
  const [cursorY, setCursorY] = useState<number | null>(null)
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [touchMode, setTouchMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [trackingSource, setTrackingSource] = useState<TrackingSource>('auto')
  const [currentSource, setCurrentSource] = useState<string>('')

  // Personalization hook - adapts lane positions to user's vertical range
  const { adaptLanes, updateMovementData, resetAdaptation, getStats } = useLanePersonalization()

  // Audio references
  const synthRef = useRef<Tone.Synth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const currentNoteRef = useRef<string | null>(null)
  const lastLaneIdRef = useRef<string | null>(null)

  // Get adapted lanes based on personalization
  const adaptedLanes = adaptLanes(DEFAULT_LANES)

  // Initialize audio
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return

    console.log('Initializing Note Lanes audio...')

    try {
      // Ensure audio context is running
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      // Create reverb
      reverbRef.current = new Tone.Reverb({
        decay: 2,
        wet: 0.25
      }).toDestination()

      // Create synth with smooth envelope
      synthRef.current = new Tone.Synth({
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.7,
          release: 0.8
        }
      }).connect(reverbRef.current)

      synthRef.current.volume.value = -10

      setIsInitialized(true)
      console.log('Note Lanes audio initialized')

    } catch (error) {
      console.error('Failed to initialize audio:', error)
      throw error
    }
  }, [isInitialized])

  /**
   * Detect which lane the cursor is in, with hysteresis
   * Hysteresis prevents flickering when cursor is near lane boundary
   *
   * The hysteresis logic:
   * - If we're NOT in a lane, use normal boundaries to enter
   * - If we ARE in a lane, we stay in it until we move past hysteresis threshold into another lane
   * - This prevents gaps where no lane is detected
   */
  const detectLane = useCallback((y: number): Lane | null => {
    const currentLaneId = lastLaneIdRef.current

    // First, check if we're still in the current lane (with expanded boundaries due to hysteresis)
    if (currentLaneId) {
      const currentLane = adaptedLanes.find(l => l.id === currentLaneId)
      if (currentLane) {
        const halfHeight = currentLane.height / 2
        const hysteresisAmount = currentLane.height * HYSTERESIS_THRESHOLD
        // Current lane has expanded boundaries (easier to stay in)
        const minY = currentLane.centerY - halfHeight - hysteresisAmount
        const maxY = currentLane.centerY + halfHeight + hysteresisAmount

        if (y >= minY && y <= maxY) {
          return currentLane
        }
      }
    }

    // Not in current lane (or no current lane), find a new lane using normal boundaries
    for (const lane of adaptedLanes) {
      const halfHeight = lane.height / 2
      const minY = lane.centerY - halfHeight
      const maxY = lane.centerY + halfHeight

      if (y >= minY && y <= maxY) {
        return lane
      }
    }

    // Cursor is outside all lanes - but if we had a current lane, try to stay in closest lane
    // This prevents note cutout when cursor goes slightly out of bounds
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

      // Stay in closest lane if within reasonable distance (50% of lane height)
      if (closestLane && closestDistance < closestLane.height * 0.5) {
        return closestLane
      }
    }

    return null
  }, [adaptedLanes])

  /**
   * Trigger sound for a lane
   */
  const triggerLane = useCallback(async (lane: Lane) => {
    // If we're already on this lane, do nothing
    if (lastLaneIdRef.current === lane.id) return

    // Initialize audio on first interaction if not already done
    if (!isInitialized) {
      try {
        await initializeAudio()
      } catch (error) {
        console.error('Failed to initialize audio on trigger:', error)
        return
      }
    }

    if (!synthRef.current) return

    // Release previous note
    if (currentNoteRef.current) {
      try {
        synthRef.current.triggerRelease()
      } catch (e) {
        // Ignore release errors
      }
    }

    // Play new note
    const note = lane.notes[0]
    try {
      synthRef.current.triggerAttack(note)
      currentNoteRef.current = note
      lastLaneIdRef.current = lane.id

      setActiveLaneId(lane.id)

      // Clear active state after 200ms
      setTimeout(() => {
        setActiveLaneId(null)
      }, 200)
    } catch (error) {
      console.error('Failed to trigger note:', error)
    }

  }, [isInitialized, initializeAudio])

  /**
   * Handle direct tap/click on a lane
   */
  const handleLaneClick = useCallback((lane: Lane) => {
    if (!touchMode) {
      setTouchMode(true)
    }
    triggerLane(lane)
  }, [touchMode, triggerLane])

  // Handle pose updates
  useEffect(() => {
    if (!isActive || touchMode) {
      if (!touchMode) {
        setCursorY(null)
        setDebugInfo('Not active')
      }
      // Release note when stopping
      if (currentNoteRef.current && synthRef.current) {
        synthRef.current.triggerRelease()
        currentNoteRef.current = null
        lastLaneIdRef.current = null
      }
      return
    }

    if (!poses || poses.length === 0) {
      setDebugInfo('No poses detected')
      return
    }

    const pose = poses[0]
    const cursor = getCursorFromPose(pose, trackingSource)

    if (!cursor) {
      setDebugInfo(`Pose has ${pose.keypoints?.length || 0} keypoints but no valid cursor`)
      setCurrentSource('')
      return
    }

    // Update current source display
    setCurrentSource(cursor.source)

    // Debug: show raw cursor value and source
    setDebugInfo(`Y: ${(cursor.y * 100).toFixed(1)}% | ${cursor.source}`)

    // Update personalization data with Y position
    updateMovementData(cursor.y)

    // Set cursor position
    setCursorY(cursor.y)

    // Detect lane
    const lane = detectLane(cursor.y)

    if (lane) {
      triggerLane(lane)
    } else {
      // Cursor is between lanes (in gap) - release note
      if (currentNoteRef.current && synthRef.current) {
        synthRef.current.triggerRelease()
        currentNoteRef.current = null
        lastLaneIdRef.current = null
      }
    }
  }, [poses, isActive, touchMode, trackingSource, detectLane, triggerLane, updateMovementData])

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

  const stats = getStats()

  return (
    <div className="note-lanes-instrument">
      <div className="lanes-header">
        <button onClick={onBack} className="button secondary">
          Back
        </button>
        <h2>Note Lanes</h2>
        <div className="lanes-header-actions">
          <button
            onClick={() => setTouchMode(!touchMode)}
            className={`button ${touchMode ? 'primary' : 'secondary'}`}
            title="Toggle touch mode"
          >
            {touchMode ? 'Touch' : 'Movement'}
          </button>
          <button onClick={resetAdaptation} className="button secondary" title="Reset adaptation">
            Reset
          </button>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`button ${settingsOpen ? 'primary' : 'secondary'}`}
            title="Toggle settings"
          >
            {settingsOpen ? 'Hide' : 'Settings'}
          </button>
        </div>
      </div>

      <div className="lanes-instruction">
        <p>
          {touchMode
            ? 'Tap lanes to play notes'
            : 'Move up and down to play different notes'
          }
        </p>
        <p className="lanes-subtext">
          {isActive && !touchMode ? debugInfo : 'The lanes adapt to your vertical movement range over time'}
        </p>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="lanes-settings-panel">
          <div className="lanes-setting-group">
            <label htmlFor="tracking-source"><strong>Track body part:</strong></label>
            <select
              id="tracking-source"
              value={trackingSource}
              onChange={(e) => setTrackingSource(e.target.value as TrackingSource)}
              className="lanes-select"
            >
              {(Object.keys(TRACKING_SOURCE_LABELS) as TrackingSource[]).map((key) => (
                <option key={key} value={key}>
                  {TRACKING_SOURCE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          {currentSource && (
            <div className="lanes-current-source">
              <strong>Currently using:</strong> {currentSource}
            </div>
          )}
          <div className="lanes-stats">
            <p><strong>Samples:</strong> {stats.sampleCount}</p>
            {stats.sampleCount > 15 && (
              <>
                <p><strong>Vertical range:</strong> {(stats.rangeY * 100).toFixed(0)}%</p>
                <p><strong>Smoothing:</strong> {(stats.smoothingFactor * 100).toFixed(0)}%</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Lanes Area */}
      <div className="lanes-container">
        {/* Status indicator when no cursor detected */}
        {!touchMode && isActive && cursorY === null && (
          <div className="lanes-no-cursor">
            <p>Looking for you...</p>
            <p className="small">Make sure your body is visible to the camera</p>
          </div>
        )}

        {/* Cursor indicator (movement mode only) */}
        {!touchMode && cursorY !== null && (
          <div
            className="lanes-cursor"
            style={{
              top: `${cursorY * 100}%`
            }}
          >
            <div className="lanes-cursor-dot" />
          </div>
        )}

        {/* Render lanes */}
        {adaptedLanes.map((lane) => {
          const halfHeight = lane.height / 2
          const minY = lane.centerY - halfHeight
          const isActive = activeLaneId === lane.id

          return (
            <button
              key={lane.id}
              className={`lane ${isActive ? 'lane-active' : ''}`}
              style={{
                top: `${minY * 100}%`,
                height: `${lane.height * 100}%`,
                borderColor: lane.color,
                '--lane-color': lane.color
              } as React.CSSProperties}
              onClick={() => handleLaneClick(lane)}
              disabled={!touchMode}
            >
              <span className="lane-label">{lane.label}</span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="lanes-legend">
        <h3>Note Map</h3>
        <div className="lanes-legend-grid">
          {DEFAULT_LANES.map((lane) => (
            <div key={lane.id} className="lanes-legend-item">
              <div
                className="lanes-legend-color"
                style={{ backgroundColor: lane.color }}
              />
              <span className="lanes-legend-label">{lane.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
