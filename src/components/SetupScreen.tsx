import { useState } from 'react'
import BodyPartSelector from './BodyPartSelector'

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
    <div className="container">
      <h2>Setup Body Tracking</h2>
      <p>Select which body parts you want to use for music generation:</p>
      <BodyPartSelector 
        selectedParts={selectedParts}
        onSelectionChange={setSelectedParts}
      />
      <button 
        onClick={handleContinue}
        disabled={selectedParts.length === 0}
      >
        Continue to Performance
      </button>
    </div>
  )
}

export default SetupScreen