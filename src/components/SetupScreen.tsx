import { useState } from 'react'
import BodyPartSelector from './BodyPartSelector'
import BodyDiagram from './BodyDiagram'
import './SetupScreen.css'

interface SetupScreenProps {
  onComplete: (bodyParts: string[]) => void
}

function SetupScreen({ onComplete }: SetupScreenProps) {
  const [selectedParts, setSelectedParts] = useState<string[]>([])

  const handleContinue = () => {
    if (selectedParts.length > 0) {
      onComplete(selectedParts)
    }
  }

  return (
    <div className="setup-container">
      <h2 className="setup-title">Setup Body Tracking</h2>
      
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
      
      <button 
        className="continue-button"
        onClick={handleContinue}
        disabled={selectedParts.length === 0}
        aria-label={selectedParts.length === 0 ? 'Select at least one body part to continue' : 'Continue to performance'}
      >
        Continue to Performance
      </button>
    </div>
  )
}

export default SetupScreen