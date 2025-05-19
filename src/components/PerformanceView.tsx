import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import WebcamCapture from './WebcamCapture'
import MusicGenerator from './MusicGenerator'
import BodyDiagram from './BodyDiagram'
import MusicDebugger from './MusicDebugger'
import MusicMappingConfig from './MusicMappingConfig'
import { usePoseDetection } from '../hooks/usePoseDetection'
import { useMusicGeneration } from '../hooks/useMusicGeneration'
import './PerformanceView.css'

// Mapping to display human-readable names
const BODY_PART_LABELS: Record<string, string> = {
  'nose': 'Nose',
  'leftEye': 'Left Eye',
  'rightEye': 'Right Eye',
  'leftEar': 'Left Ear',
  'rightEar': 'Right Ear',
  'leftShoulder': 'Left Shoulder',
  'rightShoulder': 'Right Shoulder',
  'leftElbow': 'Left Elbow',
  'rightElbow': 'Right Elbow',
  'leftWrist': 'Left Wrist',
  'rightWrist': 'Right Wrist',
  'leftHip': 'Left Hip',
  'rightHip': 'Right Hip',
  'leftKnee': 'Left Knee',
  'rightKnee': 'Right Knee',
  'leftAnkle': 'Left Ankle',
  'rightAnkle': 'Right Ankle'
}

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
  const { generateMusic, stopMusic, currentConfig, updateConfig } = useMusicGeneration()

  useEffect(() => {
    if (isPerforming && poses) {
      generateMusic(poses, selectedBodyParts)
    }
  }, [poses, isPerforming, selectedBodyParts, generateMusic])
  
  // Add a separate effect to log when performance starts
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
      } else {
        // Start Tone.js audio context on user interaction
        await Tone.start()
        console.log('Started Tone.js context')
        
        await startDetection()
      }
      setIsPerforming(!isPerforming)
    } catch (err: any) {
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
      </div>
      
      {error && (
        <div className="error-message">
          <span>⚠️</span>
          {error}
        </div>
      )}
      
      {/* Music Mapping Configuration */}
      <MusicMappingConfig
        selectedBodyParts={selectedBodyParts}
        currentConfig={currentConfig}
        onConfigUpdate={updateConfig}
      />
      
      <div className="performance-area">
        <div className="webcam-container">
          <WebcamCapture ref={webcamRef} poses={poses} />
        </div>
        
        <div className="status-panel">
          {/* Body Parts Visual */}
          <div className="body-parts-panel">
            <h3>Selected Body Parts</h3>
            <BodyDiagram selectedParts={selectedBodyParts} />
            {selectedBodyParts.length === 0 && (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '1rem' }}>
                No body parts selected
              </p>
            )}
          </div>
          
          {/* Music Controls */}
          <div className="music-controls">
            <MusicGenerator 
              isActive={isPerforming}
              poses={poses}
              selectedBodyParts={selectedBodyParts}
              currentConfig={currentConfig}
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
                  <div key={i} style={{ 
                    color: isSelected ? '#88ff88' : '#cccccc',
                    fontWeight: isSelected ? 'bold' : 'normal'
                  }}>
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
        style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          opacity: 0.3,
          background: 'black',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          cursor: 'pointer'
        }}
      >
        Debug
      </button>
      
      {/* Music Debugger for testing */}
      <MusicDebugger />
    </div>
  )
}

export default PerformanceView