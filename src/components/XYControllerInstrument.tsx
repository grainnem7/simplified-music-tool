import { useEffect, useRef, useState, useCallback } from 'react'
import { Pose } from '@tensorflow-models/pose-detection'
import * as Tone from 'tone'
import { useXYPersonalization } from '../hooks/useXYPersonalization'
import { getCursorFromPose } from '../services/zoneMapping'
import './XYControllerInstrument.css'

// Available parameter mappings for X and Y axes
export type XYParameter = 'pitch' | 'filter' | 'volume' | 'reverb' | 'delay' | 'vibrato'

interface XYParameterMapping {
  label: string
  unit: string
  range: [number, number]
}

const PARAMETER_CONFIGS: Record<XYParameter, XYParameterMapping> = {
  pitch: { label: 'Pitch', unit: 'note', range: [0, 1] },
  filter: { label: 'Brightness', unit: 'Hz', range: [200, 8000] },
  volume: { label: 'Volume', unit: 'dB', range: [-20, 0] },
  reverb: { label: 'Reverb', unit: '%', range: [0, 1] },
  delay: { label: 'Delay', unit: '%', range: [0, 1] },
  vibrato: { label: 'Vibrato', unit: 'Hz', range: [0, 10] }
}

interface XYControllerInstrumentProps {
  poses: Pose[] | null
  isActive: boolean
  onBack: () => void
}

export function XYControllerInstrument({ poses, isActive, onBack }: XYControllerInstrumentProps) {
  const [xyPosition, setXYPosition] = useState<{ x: number; y: number } | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [xParameter, setXParameter] = useState<XYParameter>('pitch')
  const [yParameter, setYParameter] = useState<XYParameter>('filter')

  // Personalization hook - adapts movement range and smoothing
  const { adaptXY, updateMovementData, resetAdaptation, getStats } = useXYPersonalization()

  // Audio references
  const synthRef = useRef<Tone.Synth | null>(null)
  const filterRef = useRef<Tone.Filter | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const delayRef = useRef<Tone.FeedbackDelay | null>(null)
  const vibratoRef = useRef<Tone.Vibrato | null>(null)
  const currentNoteRef = useRef<string | null>(null)

  // Musical scale for pitch mapping
  const SCALE = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
                 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
                 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']

  // Initialize audio
  const initializeAudio = useCallback(async () => {
    if (isInitialized) return

    console.log('Initializing XY Controller audio...')

    try {
      // Ensure audio context is running
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      // Create effects chain
      vibratoRef.current = new Tone.Vibrato({
        frequency: 5,
        depth: 0
      })

      reverbRef.current = new Tone.Reverb({
        decay: 2,
        wet: 0.2
      }).connect(vibratoRef.current)

      delayRef.current = new Tone.FeedbackDelay({
        delayTime: '8n',
        feedback: 0.3,
        wet: 0.1
      }).connect(reverbRef.current)

      filterRef.current = new Tone.Filter({
        frequency: 2000,
        type: 'lowpass',
        rolloff: -24
      }).connect(delayRef.current)

      // Create synth with continuous tone
      synthRef.current = new Tone.Synth({
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.05,
          decay: 0.1,
          sustain: 0.8,
          release: 0.5
        }
      }).connect(filterRef.current)

      synthRef.current.volume.value = -12

      // Connect to destination
      vibratoRef.current.toDestination()

      setIsInitialized(true)
      console.log('XY Controller audio initialized')

    } catch (error) {
      console.error('Failed to initialize audio:', error)
      throw error
    }
  }, [isInitialized])

  // Map X coordinate to parameter value
  const mapXToValue = useCallback((x: number): number => {
    const config = PARAMETER_CONFIGS[xParameter]
    const [min, max] = config.range
    return min + x * (max - min)
  }, [xParameter])

  // Map Y coordinate to parameter value
  const mapYToValue = useCallback((y: number): number => {
    const config = PARAMETER_CONFIGS[yParameter]
    const [min, max] = config.range
    // Invert Y so up = higher value (more intuitive)
    return min + (1 - y) * (max - min)
  }, [yParameter])

  // Apply XY parameters to audio engine
  const applyAudioParameters = useCallback((x: number, y: number) => {
    if (!isInitialized) return

    const xValue = mapXToValue(x)
    const yValue = mapYToValue(y)

    // Apply X parameter
    switch (xParameter) {
      case 'pitch':
        // Map to scale index
        const noteIndex = Math.floor(x * (SCALE.length - 1))
        const note = SCALE[noteIndex]

        // Only trigger new note if it changed
        if (note !== currentNoteRef.current && synthRef.current) {
          if (currentNoteRef.current) {
            synthRef.current.triggerRelease()
          }
          synthRef.current.triggerAttack(note)
          currentNoteRef.current = note
        }
        break

      case 'filter':
        if (filterRef.current) {
          filterRef.current.frequency.rampTo(xValue, 0.05)
        }
        break

      case 'volume':
        if (synthRef.current) {
          synthRef.current.volume.rampTo(xValue, 0.05)
        }
        break

      case 'reverb':
        if (reverbRef.current) {
          reverbRef.current.wet.value = xValue
        }
        break

      case 'delay':
        if (delayRef.current) {
          delayRef.current.wet.value = xValue
        }
        break

      case 'vibrato':
        if (vibratoRef.current) {
          vibratoRef.current.frequency.value = xValue
        }
        break
    }

    // Apply Y parameter
    switch (yParameter) {
      case 'pitch':
        const noteIndex = Math.floor((1 - y) * (SCALE.length - 1))
        const note = SCALE[noteIndex]

        if (note !== currentNoteRef.current && synthRef.current) {
          if (currentNoteRef.current) {
            synthRef.current.triggerRelease()
          }
          synthRef.current.triggerAttack(note)
          currentNoteRef.current = note
        }
        break

      case 'filter':
        if (filterRef.current) {
          filterRef.current.frequency.rampTo(yValue, 0.05)
        }
        break

      case 'volume':
        if (synthRef.current) {
          synthRef.current.volume.rampTo(yValue, 0.05)
        }
        break

      case 'reverb':
        if (reverbRef.current) {
          reverbRef.current.wet.value = yValue
        }
        break

      case 'delay':
        if (delayRef.current) {
          delayRef.current.wet.value = yValue
        }
        break

      case 'vibrato':
        if (vibratoRef.current) {
          vibratoRef.current.depth = yValue
        }
        break
    }
  }, [isInitialized, xParameter, yParameter, mapXToValue, mapYToValue, SCALE])

  // Handle pose updates
  useEffect(() => {
    if (!poses || poses.length === 0 || !isActive) {
      setXYPosition(null)
      // Release note when stopping
      if (currentNoteRef.current && synthRef.current) {
        synthRef.current.triggerRelease()
        currentNoteRef.current = null
      }
      return
    }

    const pose = poses[0]
    const cursor = getCursorFromPose(pose)

    if (cursor) {
      // Update personalization data
      updateMovementData(cursor.x, cursor.y)

      // Adapt cursor position to personalized range
      const adapted = adaptXY(cursor.x, cursor.y)
      setXYPosition(adapted)

      // Apply audio parameters
      applyAudioParameters(adapted.x, adapted.y)
    }
  }, [poses, isActive, adaptXY, updateMovementData, applyAudioParameters])

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
      if (filterRef.current) {
        filterRef.current.dispose()
      }
      if (reverbRef.current) {
        reverbRef.current.dispose()
      }
      if (delayRef.current) {
        delayRef.current.dispose()
      }
      if (vibratoRef.current) {
        vibratoRef.current.dispose()
      }
    }
  }, [])

  const xConfig = PARAMETER_CONFIGS[xParameter]
  const yConfig = PARAMETER_CONFIGS[yParameter]
  const stats = getStats()

  return (
    <div className="xy-controller-instrument">
      <div className="xy-header">
        <button onClick={onBack} className="button secondary">
          Back
        </button>
        <h2>XY Controller</h2>
        <div className="xy-header-actions">
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

      <div className="xy-instruction">
        <p>
          Your movement controls the crosshair.
          <strong> Left/right: {xConfig.label}</strong> ·
          <strong> Up/down: {yConfig.label}</strong>
        </p>
        <p className="xy-subtext">
          The controller adapts to your movement range over time
        </p>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="xy-settings-panel">
          <div className="xy-setting">
            <label>X Axis (Left/Right):</label>
            <select
              value={xParameter}
              onChange={(e) => setXParameter(e.target.value as XYParameter)}
              className="xy-select"
            >
              {Object.entries(PARAMETER_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="xy-setting">
            <label>Y Axis (Up/Down):</label>
            <select
              value={yParameter}
              onChange={(e) => setYParameter(e.target.value as XYParameter)}
              className="xy-select"
            >
              {Object.entries(PARAMETER_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          {stats.sampleCount > 10 && (
            <div className="xy-stats">
              <p>Adapted range: {(stats.rangeX * 100).toFixed(0)}% × {(stats.rangeY * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Main XY Control Area */}
      <div className="xy-control-area">
        {/* Y Axis Label (Left side, vertical) */}
        <div className="xy-axis-label xy-axis-y">
          <div className="xy-axis-text">
            <span className="xy-axis-min">{yConfig.label}</span>
            <span className="xy-axis-arrow">↕</span>
            <span className="xy-axis-max">{yConfig.label}</span>
          </div>
        </div>

        {/* Main XY Surface */}
        <div className="xy-surface-container">
          <div className="xy-surface">
            {/* Grid lines for visual reference */}
            <div className="xy-grid">
              <div className="xy-grid-line xy-grid-line-v" style={{ left: '25%' }} />
              <div className="xy-grid-line xy-grid-line-v" style={{ left: '50%' }} />
              <div className="xy-grid-line xy-grid-line-v" style={{ left: '75%' }} />
              <div className="xy-grid-line xy-grid-line-h" style={{ top: '25%' }} />
              <div className="xy-grid-line xy-grid-line-h" style={{ top: '50%' }} />
              <div className="xy-grid-line xy-grid-line-h" style={{ top: '75%' }} />
            </div>

            {/* Crosshair/Cursor */}
            {xyPosition && (
              <div
                className="xy-cursor"
                style={{
                  left: `${xyPosition.x * 100}%`,
                  top: `${xyPosition.y * 100}%`
                }}
              >
                <div className="xy-cursor-crosshair">
                  <div className="xy-cursor-line xy-cursor-line-h" />
                  <div className="xy-cursor-line xy-cursor-line-v" />
                  <div className="xy-cursor-dot" />
                </div>
              </div>
            )}

            {/* Center indicator */}
            <div className="xy-center-marker" />
          </div>

          {/* X Axis Label (Bottom, horizontal) */}
          <div className="xy-axis-label xy-axis-x">
            <span className="xy-axis-min">{xConfig.label}</span>
            <span className="xy-axis-arrow">↔</span>
            <span className="xy-axis-max">{xConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Value Display */}
      {xyPosition && (
        <div className="xy-value-display">
          <div className="xy-value-item">
            <span className="xy-value-label">X ({xConfig.label}):</span>
            <span className="xy-value-number">
              {xParameter === 'pitch'
                ? SCALE[Math.floor(xyPosition.x * (SCALE.length - 1))]
                : mapXToValue(xyPosition.x).toFixed(xParameter === 'filter' ? 0 : 2)}
            </span>
          </div>
          <div className="xy-value-item">
            <span className="xy-value-label">Y ({yConfig.label}):</span>
            <span className="xy-value-number">
              {yParameter === 'pitch'
                ? SCALE[Math.floor((1 - xyPosition.y) * (SCALE.length - 1))]
                : mapYToValue(xyPosition.y).toFixed(yParameter === 'filter' ? 0 : 2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
