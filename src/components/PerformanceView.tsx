import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import WebcamCapture from './WebcamCapture'
import MusicGenerator from './MusicGenerator'
import BodyDiagram from './BodyDiagram'
import HarpPedals, { DEFAULT_PRESETS } from './HarpPedals'
import { usePoseDetection } from '../hooks/usePoseDetection'
import { useMusicGeneration } from '../hooks/useMusicGeneration'
import { createHarpSynth, playHarpNote } from '../services/harpMusic'
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
  musicMode: 'standard' | 'harp'
  onBackToSetup: () => void
}

function PerformanceView({ selectedBodyParts, musicMode, onBackToSetup }: PerformanceViewProps) {
  const [isPerforming, setIsPerforming] = useState(false)
  const [error, setError] = useState<string>('')
  const [showDebug, setShowDebug] = useState(false)
  const webcamRef = useRef<any>(null)
  
  // Harp mode state
  const [harpPedalPositions, setHarpPedalPositions] = useState<{ [key: string]: 'flat' | 'natural' | 'sharp' }>(
    DEFAULT_PRESETS['C Major']
  )
  const harpSynthRef = useRef<Tone.PolySynth | null>(null)
  
  const { poses, startDetection, stopDetection } = usePoseDetection(webcamRef)
  const { generateMusic, stopMusic, currentPreset, isMobile } = useMusicGeneration()

  useEffect(() => {
    if (isPerforming && poses && musicMode === 'standard') {
      generateMusic(poses, selectedBodyParts)
    }
  }, [poses, isPerforming, selectedBodyParts, generateMusic, musicMode])
  
  // Initialize harp synth when in harp mode
  useEffect(() => {
    if (musicMode === 'harp' && !harpSynthRef.current) {
      harpSynthRef.current = createHarpSynth()
    }
    
    return () => {
      if (harpSynthRef.current) {
        harpSynthRef.current.dispose()
        harpSynthRef.current = null
      }
    }
  }, [musicMode])
  
  // Add a separate effect to log when performance starts
  useEffect(() => {
    if (isPerforming) {
      console.log('Performance started with body parts:', selectedBodyParts)
    }
  }, [isPerforming, selectedBodyParts])

  // Harp mode handlers
  const handleHarpStringPlucked = (stringIndex: number, note: string) => {
    if (harpSynthRef.current && isPerforming) {
      playHarpNote(harpSynthRef.current, note, '8n', 0.7)
    }
  }
  
  const handlePedalChange = (pedal: string, position: 'flat' | 'natural' | 'sharp') => {
    setHarpPedalPositions(prev => ({
      ...prev,
      [pedal]: position
    }))
  }
  
  const handlePresetSelect = (presetName: string) => {
    if (presetName in DEFAULT_PRESETS) {
      setHarpPedalPositions(DEFAULT_PRESETS[presetName as keyof typeof DEFAULT_PRESETS])
    }
  }

  const handleTogglePerformance = async () => {
    try {
      setError('')
      if (isPerforming) {
        stopDetection()
        if (musicMode === 'standard') {
          stopMusic()
        }
        setIsPerforming(false)
        return
      }
      
      // Initialize audio properly for this device type
      try {
        console.log('Setting up audio context before starting performance...')
        
        // Create a new context with appropriate settings based on device
        Tone.setContext(new Tone.Context({
          latencyHint: isMobile ? 'interactive' : 'balanced',
          lookAhead: isMobile ? 0.1 : 0.2,
          updateInterval: isMobile ? 0.03 : 0.05
        }))
        
        // Start Tone.js audio context on user interaction
        await Tone.start()
        console.log('Started Tone.js context successfully')
      } catch (audioErr) {
        console.warn('Audio initialization warning:', audioErr)
        // Try to recover by resuming the current context
        try {
          await Tone.context.resume()
          console.log('Resumed existing audio context')
        } catch (resumeErr) {
          console.error('Could not resume audio context:', resumeErr)
          throw new Error('Could not initialize audio. Please try again.')
        }
      }
      
      try {
        // Now start pose detection
        await startDetection()
        console.log('Pose detection started successfully')
        setIsPerforming(true)
      } catch (detectionErr) {
        console.error('Detection error:', detectionErr)
        throw new Error('Could not start pose detection. Please check camera permissions.')
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
            poses={poses} 
            selectedBodyParts={selectedBodyParts}
            showHarpOverlay={musicMode === 'harp'}
            harpPedalPositions={harpPedalPositions}
            onHarpStringPlucked={handleHarpStringPlucked}
          />
          {musicMode === 'harp' && (
            <HarpPedals
              pedalPositions={harpPedalPositions}
              onPedalChange={handlePedalChange}
              onPresetSelect={handlePresetSelect}
            />
          )}
        </div>
        
        <div className="status-panel">
          {musicMode === 'standard' ? (
            <>
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
                />
              </div>
            </>
          ) : (
            <div className="harp-info-panel">
              <h3>Harp Mode</h3>
              <p>Move your hands across the strings to play!</p>
              <div className="harp-legend">
                <div><span style={{ color: '#ff0000' }}>●</span> C strings (Red)</div>
                <div><span style={{ color: '#000080' }}>●</span> F strings (Blue)</div>
                <div><span style={{ color: '#ffffff' }}>●</span> Other strings</div>
              </div>
            </div>
          )}
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
    </div>
  )
}

export default PerformanceView