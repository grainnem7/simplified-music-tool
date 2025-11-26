import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import WebcamCapture from './WebcamCapture'
import MusicGenerator from './MusicGenerator'
import BodyPartActivity from './BodyPartActivity'
import SettingsPanel from './SettingsPanel'
import { MovementZonesInstrument } from './MovementZonesInstrument'
import { GridPadsInstrument } from './GridPadsInstrument'
import { XYControllerInstrument } from './XYControllerInstrument'
import { NoteLanesInstrument } from './NoteLanesInstrument'
import NoteLanesOverlay from './NoteLanesOverlay'
import { useNoteLanes } from '../hooks/useNoteLanes'
import { TRACKING_SOURCE_LABELS, TrackingSource } from '../services/zoneMapping'
import { usePoseDetection } from '../hooks/usePoseDetection'
import { useMusicGeneration } from '../hooks/useMusicGeneration'
import { useMusicSettings } from '../contexts/MusicSettingsContext'
import { useMovements } from '../contexts/MovementContext'
import './PerformanceView.css'

interface PerformanceViewProps {
  selectedBodyParts: string[]
  onBackToSetup: () => void
  onChangeMovements?: () => void
}

type InstrumentMode = 'traditional' | 'zones' | 'grid' | 'xy' | 'lanes'

// Webcam dimensions
const WEBCAM_WIDTH = 640
const WEBCAM_HEIGHT = 480

function PerformanceView({ selectedBodyParts, onBackToSetup, onChangeMovements }: PerformanceViewProps) {
  const [isPerforming, setIsPerforming] = useState(false)
  const [error, setError] = useState<string>('')
  const [showDebug, setShowDebug] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [instrumentMode, setInstrumentMode] = useState<InstrumentMode>('traditional')
  const [lanesSettingsOpen, setLanesSettingsOpen] = useState(false)
  const webcamRef = useRef<any>(null)

  const { settings } = useMusicSettings()
  const { poses, startDetection, stopDetection } = usePoseDetection(webcamRef)
  const { generateMusic, stopMusic, isMobile, currentChord, movementIntensity, bodyPartIntensities } = useMusicGeneration()
  const { movements, isDefaultMode, hasCustomMovements } = useMovements()

  // Note Lanes hook - only active when in lanes mode
  const noteLanes = useNoteLanes({
    poses,
    isActive: isPerforming && instrumentMode === 'lanes'
  })

  useEffect(() => {
    if (isPerforming && poses) {
      generateMusic(poses, selectedBodyParts)
    }
  }, [poses, isPerforming, selectedBodyParts, generateMusic])

  useEffect(() => {
    if (isPerforming) {
      console.log('Performance started with body parts:', selectedBodyParts)
    }
  }, [isPerforming, selectedBodyParts])

  const handleTogglePerformance = async () => {
    try {
      setError('')
      if (isPerforming) {
        stopDetection()
        stopMusic()
        setIsPerforming(false)
        return
      }

      // Initialize audio properly
      try {
        console.log('Setting up audio context before starting performance...')

        Tone.setContext(new Tone.Context({
          latencyHint: 'interactive',
          lookAhead: 0.05,
          updateInterval: 0.02
        }))

        await Tone.start()
        console.log('Started Tone.js context successfully')
      } catch (audioErr) {
        console.warn('Audio initialization warning:', audioErr)
        try {
          await Tone.context.resume()
          console.log('Resumed existing audio context')
        } catch (resumeErr) {
          console.error('Could not resume audio context:', resumeErr)
          throw new Error('Could not initialize audio. Please try again.')
        }
      }

      try {
        await startDetection()
        console.log('Pose detection started successfully')
        setIsPerforming(true)
      } catch (detectionErr) {
        console.error('Detection error:', detectionErr)
        throw new Error(`Could not start detection. Please check camera permissions.`)
      }
    } catch (err: any) {
      console.error('Performance start error:', err)
      setError(err.message || 'Failed to start performance')
    }
  }

  // Handle mode switch - stop performance when switching
  const handleModeSwitch = (newMode: InstrumentMode) => {
    if (isPerforming) {
      stopDetection()
      stopMusic()
      setIsPerforming(false)
    }
    setInstrumentMode(newMode)
  }

  // If in zones mode, render the zones instrument instead
  if (instrumentMode === 'zones') {
    return (
      <div className="performance-view zones-mode">
        <div className="zones-webcam-container" style={{ display: isPerforming ? 'block' : 'none' }}>
          <WebcamCapture
            ref={webcamRef}
            poses={poses || undefined}
            selectedBodyParts={[]}
          />
        </div>
        <MovementZonesInstrument
          poses={poses}
          isActive={isPerforming}
          onBack={() => handleModeSwitch('traditional')}
        />
        <div className="controls mode-switch-controls">
          <button onClick={() => handleModeSwitch('traditional')} className="button secondary">
            Traditional
          </button>
          <button onClick={() => handleModeSwitch('grid')} className="button secondary">
            Grid Pads
          </button>
          <button onClick={() => handleModeSwitch('xy')} className="button secondary">
            XY Pad
          </button>
          <button onClick={() => handleModeSwitch('lanes')} className="button secondary">
            Note Lanes
          </button>
          <button onClick={handleTogglePerformance} className="button primary">
            {isPerforming ? 'Stop' : 'Start'}
          </button>
          <button onClick={onBackToSetup} className="button secondary">
            Exit
          </button>
        </div>
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}
      </div>
    )
  }

  // If in grid pads mode, render the grid pads instrument
  if (instrumentMode === 'grid') {
    return (
      <div className="performance-view grid-mode">
        <div className="zones-webcam-container" style={{ display: isPerforming ? 'block' : 'none' }}>
          <WebcamCapture
            ref={webcamRef}
            poses={poses || undefined}
            selectedBodyParts={[]}
          />
        </div>
        <GridPadsInstrument
          poses={poses}
          isActive={isPerforming}
          onBack={() => handleModeSwitch('traditional')}
        />
        <div className="controls mode-switch-controls">
          <button onClick={() => handleModeSwitch('traditional')} className="button secondary">
            Traditional
          </button>
          <button onClick={() => handleModeSwitch('zones')} className="button secondary">
            Zones
          </button>
          <button onClick={() => handleModeSwitch('xy')} className="button secondary">
            XY Pad
          </button>
          <button onClick={() => handleModeSwitch('lanes')} className="button secondary">
            Note Lanes
          </button>
          <button onClick={handleTogglePerformance} className="button primary">
            {isPerforming ? 'Stop' : 'Start'}
          </button>
          <button onClick={onBackToSetup} className="button secondary">
            Exit
          </button>
        </div>
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}
      </div>
    )
  }

  // If in XY controller mode, render the XY controller instrument
  if (instrumentMode === 'xy') {
    return (
      <div className="performance-view xy-mode">
        <div className="zones-webcam-container" style={{ display: isPerforming ? 'block' : 'none' }}>
          <WebcamCapture
            ref={webcamRef}
            poses={poses || undefined}
            selectedBodyParts={[]}
          />
        </div>
        <XYControllerInstrument
          poses={poses}
          isActive={isPerforming}
          onBack={() => handleModeSwitch('traditional')}
        />
        <div className="controls mode-switch-controls">
          <button onClick={() => handleModeSwitch('traditional')} className="button secondary">
            Traditional
          </button>
          <button onClick={() => handleModeSwitch('zones')} className="button secondary">
            Zones
          </button>
          <button onClick={() => handleModeSwitch('grid')} className="button secondary">
            Grid Pads
          </button>
          <button onClick={() => handleModeSwitch('lanes')} className="button secondary">
            Note Lanes
          </button>
          <button onClick={handleTogglePerformance} className="button primary">
            {isPerforming ? 'Stop' : 'Start'}
          </button>
          <button onClick={onBackToSetup} className="button secondary">
            Exit
          </button>
        </div>
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}
      </div>
    )
  }

  // If in note lanes mode, render webcam with lanes overlay
  if (instrumentMode === 'lanes') {
    return (
      <div className="performance-view lanes-mode">
        <div className="controls mode-switch-controls">
          <button onClick={() => handleModeSwitch('traditional')} className="button secondary">
            Traditional
          </button>
          <button onClick={() => handleModeSwitch('zones')} className="button secondary">
            Zones
          </button>
          <button onClick={() => handleModeSwitch('grid')} className="button secondary">
            Grid Pads
          </button>
          <button onClick={() => handleModeSwitch('xy')} className="button secondary">
            XY Pad
          </button>
          <button onClick={handleTogglePerformance} className="button primary">
            {isPerforming ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={() => setLanesSettingsOpen(!lanesSettingsOpen)}
            className={`button ${lanesSettingsOpen ? 'primary' : 'secondary'}`}
          >
            Settings
          </button>
          <button onClick={onBackToSetup} className="button secondary">
            Exit
          </button>
        </div>

        {/* Settings panel for tracking source selection */}
        {lanesSettingsOpen && (
          <div className="lanes-settings-bar">
            <label htmlFor="lanes-tracking">Track:</label>
            <select
              id="lanes-tracking"
              value={noteLanes.trackingSource}
              onChange={(e) => noteLanes.setTrackingSource(e.target.value as TrackingSource)}
              className="lanes-tracking-select"
            >
              {(Object.keys(TRACKING_SOURCE_LABELS) as TrackingSource[]).map((key) => (
                <option key={key} value={key}>
                  {TRACKING_SOURCE_LABELS[key]}
                </option>
              ))}
            </select>
            <button onClick={noteLanes.resetAdaptation} className="button secondary small">
              Reset Adaptation
            </button>
            {noteLanes.stats.sampleCount > 15 && (
              <span className="lanes-stats-info">
                Range: {(noteLanes.stats.rangeY * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}

        {/* Main webcam area with lanes overlay */}
        <div className="lanes-webcam-area">
          <div className="lanes-webcam-container">
            <WebcamCapture
              ref={webcamRef}
              poses={poses || undefined}
              selectedBodyParts={[]}
            />
            {/* Lanes overlay on top of webcam */}
            <NoteLanesOverlay
              width={WEBCAM_WIDTH}
              height={WEBCAM_HEIGHT}
              lanes={noteLanes.adaptedLanes}
              activeLaneId={noteLanes.activeLaneId}
              cursorY={noteLanes.cursorY}
              cursorSource={noteLanes.cursorSource}
              showCursor={isPerforming}
            />
          </div>

          {/* Instructions */}
          <div className="lanes-instructions">
            {!isPerforming ? (
              <p>Press <strong>Start</strong> to begin. Move up and down to play different notes.</p>
            ) : noteLanes.cursorY === null ? (
              <p>Looking for you... Make sure your body is visible to the camera.</p>
            ) : (
              <p>
                <strong>Tracking:</strong> {noteLanes.cursorSource} |
                <strong> Y:</strong> {(noteLanes.cursorY * 100).toFixed(0)}%
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}
      </div>
    )
  }

  // Traditional mode rendering
  return (
    <div className="performance-view">
      <div className="controls">
        <button onClick={onBackToSetup} className="button secondary">
          Back
        </button>
        <button onClick={handleTogglePerformance} className="button">
          {isPerforming ? 'Stop' : 'Start'} Performance
        </button>
        <button onClick={() => setSettingsOpen(true)} className="button secondary">
          Settings
        </button>
        <button onClick={() => handleModeSwitch('zones')} className="button secondary">
          Zones
        </button>
        <button onClick={() => handleModeSwitch('grid')} className="button secondary">
          Grid Pads
        </button>
        <button onClick={() => handleModeSwitch('xy')} className="button secondary">
          XY Pad
        </button>
        <button onClick={() => handleModeSwitch('lanes')} className="button secondary">
          Note Lanes
        </button>
        {onChangeMovements && (
          <button onClick={onChangeMovements} className="button secondary">
            Change movements
          </button>
        )}

        {isMobile && (
          <div className="mobile-mode-indicator">
            <span>Mobile Optimized</span>
          </div>
        )}
      </div>

      {/* Visual Feedback */}
      {isPerforming && (
        <div className="visual-feedback">
          {settings.showCurrentChord && currentChord && (
            <div className="current-chord">
              <span className="chord-label">Chord:</span>
              <span className="chord-name">{currentChord}</span>
            </div>
          )}
          {settings.showMovementIntensity && (
            <div className="movement-intensity">
              <span className="intensity-label">Movement:</span>
              <div className="intensity-bar">
                <div
                  className="intensity-fill"
                  style={{ width: `${Math.min(movementIntensity * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          {error}
        </div>
      )}

      <div className="performance-area">
        <div className="webcam-container">
          <WebcamCapture
            ref={webcamRef}
            poses={poses || undefined}
            selectedBodyParts={selectedBodyParts}
          />
        </div>

        <div className="status-panel">
          {/* Movement status - generic, non-prescriptive display */}
          <div className="movements-panel">
            <h3>Movement Control</h3>
            {isDefaultMode ? (
              <div className="default-mode-info">
                <p className="mode-description">
                  Any movement in front of the camera will shape the sound.
                </p>
                {onChangeMovements && (
                  <button
                    onClick={onChangeMovements}
                    className="customize-link"
                  >
                    Customise movements
                  </button>
                )}
              </div>
            ) : (
              <div className="custom-movements-info">
                <p className="mode-description">
                  {movements.length} custom movement{movements.length !== 1 ? 's' : ''} active
                </p>
                <ul className="movements-list-compact">
                  {movements.slice(0, 3).map(m => (
                    <li key={m.id}>{m.name}</li>
                  ))}
                  {movements.length > 3 && (
                    <li className="more-indicator">+{movements.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Activity monitor - works with both default and custom modes */}
          {isPerforming && !isDefaultMode && (
            <BodyPartActivity
              bodyPartIntensities={bodyPartIntensities}
              selectedBodyParts={selectedBodyParts}
            />
          )}

          <div className="music-controls">
            <MusicGenerator
              isActive={isPerforming}
              poses={poses || []}
              selectedBodyParts={selectedBodyParts}
            />
          </div>
        </div>
      </div>

      {/* Debug Panel - Only show when debugging */}
      {showDebug && poses && poses[0] && (
        <div className="debug-panel">
          <details>
            <summary>Debug Info</summary>
            <div>
              <p>Poses detected: {poses.length}</p>
              <p>Keypoints: {poses[0].keypoints.length}</p>
              {poses[0].keypoints.map((kp, i) => {
                const isSelected = selectedBodyParts.includes(kp.name || '')
                return (
                  <div
                    key={i}
                    className={`debug-keypoint ${isSelected ? 'selected' : ''}`}
                  >
                    {kp.name}: {kp.score?.toFixed(2)}
                  </div>
                )
              })}
            </div>
          </details>
        </div>
      )}

      <button
        onClick={() => setShowDebug(!showDebug)}
        className="debug-toggle"
      >
        Debug
      </button>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default PerformanceView
