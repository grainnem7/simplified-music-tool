import { useEffect, useRef, useState } from 'react'
import WebcamCapture from './WebcamCapture'
import MusicGenerator from './MusicGenerator'
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
  const webcamRef = useRef<any>(null)
  
  const { poses, startDetection, stopDetection } = usePoseDetection(webcamRef)
  const { generateMusic, stopMusic } = useMusicGeneration()

  useEffect(() => {
    if (isPerforming && poses) {
      console.log('Performance View - Poses:', poses, 'Selected parts:', selectedBodyParts)
      generateMusic(poses, selectedBodyParts)
    }
  }, [poses, isPerforming, selectedBodyParts, generateMusic])

  const handleTogglePerformance = async () => {
    try {
      setError('')
      if (isPerforming) {
        stopDetection()
        stopMusic()
      } else {
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
        <button onClick={onBackToSetup}>Back to Setup</button>
        <button onClick={handleTogglePerformance}>
          {isPerforming ? 'Stop' : 'Start'} Performance
        </button>
      </div>
      
      {error && (
        <div style={{ 
          background: 'red', 
          color: 'white', 
          padding: '10px', 
          margin: '10px' 
        }}>
          Error: {error}
        </div>
      )}
      
      <div className="performance-area">
        <WebcamCapture ref={webcamRef} poses={poses} />
        <MusicGenerator 
          isActive={isPerforming}
          poses={poses}
          selectedBodyParts={selectedBodyParts}
        />
      </div>
      
      {/* Debug info */}
      <div style={{ 
        position: 'absolute', 
        top: '100px', 
        left: '10px', 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '10px',
        fontSize: '12px'
      }}>
        <p>Selected parts: {selectedBodyParts.join(', ')}</p>
        <p>Poses detected: {poses ? poses.length : 0}</p>
        <p>Is performing: {isPerforming ? 'Yes' : 'No'}</p>
        <p>Webcam ready: {webcamRef.current ? 'Yes' : 'No'}</p>
        {poses && poses[0] && (
          <>
            <p>Keypoints: {poses[0].keypoints.length}</p>
            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
              {poses[0].keypoints.map((kp, i) => (
                <div key={i}>
                  {kp.name}: {kp.score?.toFixed(2)} ({kp.x?.toFixed(2)}, {kp.y?.toFixed(2)})
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PerformanceView