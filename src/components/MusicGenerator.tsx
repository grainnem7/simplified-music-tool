import './MusicGenerator.css'
import * as Tone from 'tone'
import { useState } from 'react'
import { useMusicGeneration } from '../hooks/useMusicGeneration'
import { Pose } from '@tensorflow-models/pose-detection'

interface MusicGeneratorProps {
  isActive: boolean
  poses: Pose[] | null
  selectedBodyParts: string[]
  currentConfig?: any
}

function MusicGenerator({ isActive, poses, selectedBodyParts, currentConfig }: MusicGeneratorProps) {
  const [testStatus, setTestStatus] = useState<string>('')
  const { testSound } = useMusicGeneration()
  
  const presets = [
    { name: 'piano', label: 'Piano', description: 'Classic piano sounds' },
    { name: 'drums', label: 'Drums', description: 'Percussion kit' },
    { name: 'synth', label: 'Synthesizer', description: 'Electronic sounds' }
  ]
  
  const handleTestSound = async () => {
    setTestStatus('Testing...')
    
    try {
      // Ensure Tone.js is started on user interaction
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }
      
      await testSound()
      setTimeout(() => setTestStatus(''), 1000)
    } catch (error) {
      console.error('Test sound error:', error)
      setTestStatus('Error')
      setTimeout(() => setTestStatus(''), 2000)
    }
  }

  return (
    <div className="music-generator">
      {/* Configuration status */}
      <div className="config-status">
        {currentConfig && (
          <div>
            <h4>Current Configuration</h4>
            <p>{currentConfig.name}: {currentConfig.description}</p>
          </div>
        )}
      </div>
      
      <div className={`status ${isActive ? 'active' : ''}`}>
        <span className="status-icon"></span>
        {isActive ? 'Generating Music' : 'Ready'}
      </div>
      
      <div className="test-controls">
        <button onClick={handleTestSound} className="test-button">
          Test Sound
        </button>
      </div>
      
      {testStatus && (
        <div className="test-status">
          {testStatus}
        </div>
      )}
      
      <div className="visualization">
        {isActive && (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="visualization-bar"
                style={{
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Active mappings info */}
      <div className="active-mappings">
        {selectedBodyParts.length > 0 && currentConfig && (
          <div>
            <h5>Active Mappings</h5>
            {selectedBodyParts.map(part => {
              const mapping = currentConfig.mappings?.[part]
              if (!mapping) return null
              return (
                <div key={part} className="mapping-info">
                  <span>{part}: </span>
                  <span>{mapping.instrument} ({mapping.role})</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MusicGenerator