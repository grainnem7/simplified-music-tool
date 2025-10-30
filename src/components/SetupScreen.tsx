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
    <div className="setup-screen">
      <div className="setup-header">
        <h1 className="setup-title">Configure Body Tracking</h1>
        <p className="setup-subtitle">
          Select the body parts you want to track for music generation
        </p>
      </div>

      <div className="setup-grid">
        <div className="diagram-card">
          <h2 className="card-title">Body Map</h2>
          <p className="card-description">
            {selectedParts.length === 0
              ? 'Select body parts from the list'
              : `${selectedParts.length} part${selectedParts.length !== 1 ? 's' : ''} selected`}
          </p>
          <BodyDiagram selectedParts={selectedParts} />
        </div>

        <div className="selector-card">
          <h2 className="card-title">Body Parts</h2>
          <p className="card-description">
            Click to select or deselect body parts
          </p>
          <BodyPartSelector
            selectedParts={selectedParts}
            onSelectionChange={setSelectedParts}
          />
        </div>
      </div>

      <div className="setup-actions">
        <button
          className="primary-action-button"
          onClick={handleContinue}
          disabled={selectedParts.length === 0}
        >
          Start Performance
        </button>
      </div>
    </div>
  )
}

export default SetupScreen
