import './MusicGenerator.css'
import * as Tone from 'tone'
import { useState, useEffect } from 'react'
import { useMusicGeneration } from '../hooks/useMusicGeneration'
import { Pose } from '@tensorflow-models/pose-detection'

interface MusicGeneratorProps {
  isActive: boolean
  poses: Pose[] | null
  selectedBodyParts: string[]
}

function MusicGenerator({ isActive, poses, selectedBodyParts }: MusicGeneratorProps) {
  const [testStatus, setTestStatus] = useState<string>('')
  const { generateMusic, selectPreset, currentPreset, testSound, isMobile } = useMusicGeneration()
  
  // Base presets available on all devices
  const basePresets = [
    { name: 'piano', label: 'Piano', description: 'Classic piano sounds' },
    { name: 'synth', label: 'Synthesizer', description: 'Electronic sounds' },
  ]
  
  // Add mobile-optimized preset if on mobile
  const presets = isMobile
    ? [
        ...basePresets,
        { name: 'mobile-optimized', label: 'Mobile', description: 'Optimized for mobile performance' }
      ]
    : [
        ...basePresets,
        { name: 'drums', label: 'Drums', description: 'Percussion kit' }
      ]
      
  // Auto-select mobile-optimized preset on mobile devices
  useEffect(() => {
    if (isMobile) {
      selectPreset('mobile-optimized')
    }
  }, [isMobile, selectPreset])
  
  const handleTestSound = async () => {
    setTestStatus('Testing...')
    
    try {
      // Create a clean context first
      try {
        // Create a new context with appropriate settings for the device type
        Tone.setContext(new Tone.Context({
          latencyHint: isMobile ? 'interactive' : 'balanced',
          lookAhead: isMobile ? 0.1 : 0.2,
          updateInterval: isMobile ? 0.03 : 0.05
        }))
      } catch (e) {
        console.warn('Could not create custom audio context, using default')
      }
      
      // Ensure Tone.js is started on user interaction
      try {
        if (Tone.context.state !== 'running') {
          await Tone.start()
        }
      } catch (e) {
        console.warn('Error starting Tone context:', e)
        // Try to recover with a direct resume
        await Tone.context.resume()
      }
      
      await testSound()
      setTestStatus('Success')
      setTimeout(() => setTestStatus(''), 1000)
    } catch (error) {
      console.error('Test sound error:', error)
      setTestStatus('Error - Try again')
      setTimeout(() => setTestStatus(''), 3000)
    }
  }

  return (
    <div className="music-generator">
      {/* Preset Selection */}
      <div className="preset-selection">
        <h4>Sound Preset</h4>
        <div className="preset-buttons">
          {presets.map(preset => (
            <button
              key={preset.name}
              onClick={() => selectPreset(preset.name)}
              className={`preset-button ${currentPreset === preset.name ? 'active' : ''}`}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
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
      
      {/* Preset info */}
      <div className="preset-info">
        <p>{presets.find(p => p.name === currentPreset)?.description}</p>
      </div>
    </div>
  )
}

export default MusicGenerator