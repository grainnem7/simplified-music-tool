import { useState } from 'react'
import { Link } from 'react-router-dom'
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h1 className="setup-title">Configure Body Tracking</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to="/about"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid currentColor',
                textDecoration: 'none',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              About
            </Link>
            <Link
              to="/proposal"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid currentColor',
                textDecoration: 'none',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Proposal
            </Link>
          </div>
        </div>
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
