import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import WebcamCapture from './WebcamCapture'
import MusicGenerator from './MusicGenerator'
import BodyDiagram from './BodyDiagram'
import { usePoseDetection } from '../hooks/usePoseDetection'
import { useMusicGeneration } from '../hooks/useMusicGeneration'
import './PerformanceView.css'

interface PerformanceViewProps {
  selectedBodyParts: string[]
  onBackToSetup: () => void
}

function PerformanceView({ selectedBodyParts, onBackToSetup }: PerformanceViewProps) {
  const [isPerforming, setIsPerforming] = useState(false)
  const [error, setError] = useState<string>('')
  const [showDebug, setShowDebug] = useState(false)
  const webcamRef = useRef<any>(null)

  const { poses, startDetection, stopDetection } = usePoseDetection(webcamRef)
  const { generateMusic, stopMusic, isMobile } = useMusicGeneration()

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

  return (
    <div className="performance-view">
      <div className="controls">
        <button onClick={onBackToSetup} className="button secondary">
          Back to Setup
        </button>
        <button onClick={handleTogglePerformance} className="button">
          {isPerforming ? 'Stop' : 'Start'} Performance
        </button>

        {isMobile && (
          <div className="mobile-mode-indicator">
            <span>📱</span> Mobile Optimized
          </div>
        )}
      </div>

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
          <div className="body-parts-panel">
            <h3>Active Tracking</h3>
            <BodyDiagram selectedParts={selectedBodyParts} />
            {selectedBodyParts.length === 0 && (
              <p className="empty-state">No body parts selected</p>
            )}
          </div>

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
    </div>
  )
}

export default PerformanceView
