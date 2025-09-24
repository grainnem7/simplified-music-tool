import { useState } from 'react'
import BodyPartSelector from './BodyPartSelector'
import BodyDiagram from './BodyDiagram'
import GestureTrainingWizard from './GestureTrainingWizard'
import './SetupScreen.css'

interface SetupScreenProps {
  onComplete: (bodyParts: string[], mode: 'standard' | 'harp' | 'gesture', gestureProfile?: string) => void
}

const MUSIC_MODES = [
  { id: 'standard', label: 'Standard Mode', description: 'Use body movements to generate music' },
  { id: 'harp', label: 'Harp Mode', description: 'Play a virtual harp with hand movements' },
  { id: 'gesture', label: 'Gesture Mode', description: 'Train custom gestures to control music' }
] as const

function SetupScreen({ onComplete }: SetupScreenProps) {
  const [selectedParts, setSelectedParts] = useState<string[]>([])
  const [selectedMode, setSelectedMode] = useState<'standard' | 'harp' | 'gesture'>('standard')
  const [showGestureTraining, setShowGestureTraining] = useState(false)
  const [gestureProfile, setGestureProfile] = useState<string | undefined>()

  const handleContinue = () => {
    if (selectedMode === 'harp') {
      // For harp mode, don't select any body parts (we use hand detection)
      onComplete([], 'harp')
    } else if (selectedMode === 'gesture') {
      // Show gesture training wizard
      setShowGestureTraining(true)
    } else if (selectedParts.length > 0) {
      onComplete(selectedParts, 'standard')
    }
  }

  const handleGestureTrainingComplete = (profileName: string) => {
    setGestureProfile(profileName)
    onComplete([], 'gesture', profileName)
  }

  const handleGestureTrainingBack = () => {
    setShowGestureTraining(false)
  }

  if (showGestureTraining) {
    return (
      <GestureTrainingWizard
        onComplete={handleGestureTrainingComplete}
        onBack={handleGestureTrainingBack}
      />
    )
  }

  return (
    <div className="setup-container">
      <h2 className="setup-title">Setup Music Mode</h2>
      
      {/* Mode Selection */}
      <div className="mode-selection">
        <h3>Choose Music Mode</h3>
        <div className="mode-options">
          {MUSIC_MODES.map(mode => (
            <label key={mode.id} className={`mode-option ${selectedMode === mode.id ? 'selected' : ''}`}>
              <input
                type="radio"
                name="musicMode"
                value={mode.id}
                checked={selectedMode === mode.id}
                onChange={(e) => setSelectedMode(e.target.value as 'standard' | 'harp' | 'gesture')}
              />
              <div className="mode-info">
                <span className="mode-label">{mode.label}</span>
                <span className="mode-description">{mode.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Only show body part selector for standard mode */}
      {selectedMode === 'standard' ? (
        <div className="setup-content">
          <div className="diagram-section">
            <BodyDiagram selectedParts={selectedParts} />
            <p className="diagram-caption">
              Selected parts are highlighted.
            </p>
          </div>
          
          <div className="selector-section">
            <BodyPartSelector 
              selectedParts={selectedParts}
              onSelectionChange={setSelectedParts}
            />
          </div>
        </div>
      ) : selectedMode === 'harp' ? (
        <div className="harp-mode-info">
          <p>Harp Mode uses your hand movements to play a virtual concert harp.</p>
          <ul>
            <li>Move your hands across the strings to create glissandi</li>
            <li>Use the pedal system to change scale</li>
          </ul>
        </div>
      ) : (
        <div className="gesture-mode-info">
          <p>Gesture Mode lets you train custom gestures to control music.</p>
          <ul>
          </ul>
        </div>
      )}
      
      <button 
        className="continue-button"
        onClick={handleContinue}
        disabled={selectedMode === 'standard' && selectedParts.length === 0}
        aria-label={selectedMode === 'standard' && selectedParts.length === 0 ? 'Select at least one body part to continue' : 'Continue to performance'}
      >
        Continue to Performance
      </button>
    </div>
  )
}

export default SetupScreen