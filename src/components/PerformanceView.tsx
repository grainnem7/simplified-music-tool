import { useEffect, useRef, useState, useCallback } from 'react'
import * as Tone from 'tone'
import WebcamCapture from './WebcamCapture'
import MusicGenerator from './MusicGenerator'
import BodyDiagram from './BodyDiagram'
import HarpPedals, { DEFAULT_PRESETS } from './HarpPedals'
import { usePoseDetection } from '../hooks/usePoseDetection'
import { useMusicGeneration } from '../hooks/useMusicGeneration'
import { useHandDetection } from '../hooks/useHandDetection'
import { createHarpSynth, playHarpNote } from '../services/harpMusic'
import { getFingertipPositions, HAND_LANDMARKS } from '../services/handDetection'
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
  const { hands, startDetection: startHandDetection, stopDetection: stopHandDetection } = useHandDetection(webcamRef)

  useEffect(() => {
    if (isPerforming && poses && musicMode === 'standard') {
      generateMusic(poses, selectedBodyParts)
    }
  }, [poses, isPerforming, selectedBodyParts, generateMusic, musicMode])
  
  // Initialize harp synth when in harp mode
  useEffect(() => {
    if (musicMode === 'harp' && !harpSynthRef.current) {
      console.log('Initializing harp synth for harp mode');
      harpSynthRef.current = createHarpSynth();
    }
    
    return () => {
      if (harpSynthRef.current) {
        console.log('Disposing harp synth');
        harpSynthRef.current.dispose();
        harpSynthRef.current = null;
      }
    }
  }, [musicMode])
  
  // Add a separate effect to log when performance starts
  useEffect(() => {
    if (isPerforming) {
      console.log('Performance started with body parts:', selectedBodyParts)
    }
  }, [isPerforming, selectedBodyParts])

  // Get fingertip positions from detected hands
  const getFingertipPositionsFromHands = useCallback(() => {
    if (!hands || hands.length === 0) {
      return undefined;
    }
    
    console.log('Processing hands for fingertips:', hands.length);
    const fingertips: Array<{ x: number; y: number; finger: string; hand: 'left' | 'right' }> = [];
    
    hands.forEach(hand => {
      // Only track index finger for now
      const keypoint = hand.keypoints[HAND_LANDMARKS.INDEX_FINGER_TIP];
      if (keypoint && !isNaN(keypoint.x) && !isNaN(keypoint.y)) {
        // MediaPipe returns pixel coordinates
        fingertips.push({
          x: keypoint.x,
          y: keypoint.y,
          finger: 'index',
          hand: (hand.handedness || 'right').toLowerCase() as 'left' | 'right'
        });
      }
    });
    
    console.log('Fingertips found:', fingertips.length);
    return fingertips.length > 0 ? fingertips : undefined;
  }, [hands]);

  // Harp mode handlers
  const handleHarpStringPlucked = (stringIndex: number, note: string, velocity: number = 0.7) => {
    console.log('String plucked:', stringIndex, note, 'velocity:', velocity);
    if (harpSynthRef.current && isPerforming) {
      try {
        playHarpNote(harpSynthRef.current, note, '8n', velocity);
        console.log('Note played successfully:', note);
      } catch (err) {
        console.error('Error playing note:', err);
      }
    } else {
      console.log('Cannot play note:', { hasSynth: !!harpSynthRef.current, isPerforming });
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
        // Stop both detection types in case we're using fallback
        stopHandDetection()
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
        
        // Create a new context with balanced settings
        Tone.setContext(new Tone.Context({
          latencyHint: 'interactive',
          lookAhead: 0.05, // More stable lookahead
          updateInterval: 0.02 // Balanced update rate
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
        // Always start pose detection first
        await startDetection()
        console.log('Pose detection started successfully')
        
        // Additionally try hand detection for harp mode
        if (musicMode === 'harp') {
          try {
            await startHandDetection()
            console.log('Hand detection started successfully')
          } catch (handErr) {
            console.warn('Hand detection failed, will use wrist tracking only:', handErr)
          }
        }
        
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
      
      <div className={`performance-area ${musicMode === 'harp' ? 'harp-mode' : ''}`}>
        <div className="webcam-container">
          <WebcamCapture 
            ref={webcamRef} 
            poses={poses} 
            selectedBodyParts={selectedBodyParts}
            showHarpOverlay={musicMode === 'harp'}
            harpPedalPositions={harpPedalPositions}
            onHarpStringPlucked={handleHarpStringPlucked}
            fingertipPositions={musicMode === 'harp' ? getFingertipPositionsFromHands() : undefined}
          />
        </div>
        
        {musicMode === 'harp' && (
          <HarpPedals
            pedalPositions={harpPedalPositions}
            onPedalChange={handlePedalChange}
            onPresetSelect={handlePresetSelect}
          />
        )}
        
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
              {isPerforming && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {hands && hands.length > 0 ? (
                    `Hand Detection: ${hands.length} hand(s) with ${getFingertipPositionsFromHands()?.length || 0} fingertips`
                  ) : poses && poses.length > 0 ? (
                    'Using wrist tracking (hand detection unavailable)'
                  ) : (
                    'Waiting for detection...'
                  )}
                  <br />
                  <small>Debug: hands={!!hands}, poses={!!poses}</small>
                </div>
              )}
            </div>
          )}
          
          {/* Test button for harp sound */}
          {musicMode === 'harp' && isPerforming && (
            <button
              onClick={() => handleHarpStringPlucked(20, 'C4')}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Test Harp Sound (C4)
            </button>
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