import './BodyPartSelector.css'

interface BodyPartSelectorProps {
  selectedParts: string[]
  onSelectionChange: (parts: string[]) => void
}

const BODY_PARTS = [
  { id: 'leftHand', label: 'Left Hand' },
  { id: 'rightHand', label: 'Right Hand' },
  { id: 'leftElbow', label: 'Left Elbow' },
  { id: 'rightElbow', label: 'Right Elbow' },
  { id: 'leftShoulder', label: 'Left Shoulder' },
  { id: 'rightShoulder', label: 'Right Shoulder' },
  { id: 'head', label: 'Head' },
  { id: 'leftHip', label: 'Left Hip' },
  { id: 'rightHip', label: 'Right Hip' },
  { id: 'leftKnee', label: 'Left Knee' },
  { id: 'rightKnee', label: 'Right Knee' },
  { id: 'leftFoot', label: 'Left Foot' },
  { id: 'rightFoot', label: 'Right Foot' },
]

const PRESETS = [
  { name: 'Conductor Mode', parts: ['leftHand', 'rightHand'] },
  { name: 'Dancer Mode', parts: ['leftHand', 'rightHand', 'leftFoot', 'rightFoot'] },
  { name: 'Full Body', parts: BODY_PARTS.map(part => part.id) },
]

function BodyPartSelector({ selectedParts, onSelectionChange }: BodyPartSelectorProps) {
  const togglePart = (partId: string) => {
    if (selectedParts.includes(partId)) {
      onSelectionChange(selectedParts.filter(id => id !== partId))
    } else {
      onSelectionChange([...selectedParts, partId])
    }
  }

  const applyPreset = (parts: string[]) => {
    onSelectionChange(parts)
  }

  return (
    <div className="body-part-selector">
      <div className="presets">
        <h3>Presets:</h3>
        {PRESETS.map(preset => (
          <button 
            key={preset.name}
            onClick={() => applyPreset(preset.parts)}
          >
            {preset.name}
          </button>
        ))}
      </div>
      
      <div className="body-parts-grid">
        {BODY_PARTS.map(part => (
          <label key={part.id} className="body-part-option">
            <input
              type="checkbox"
              checked={selectedParts.includes(part.id)}
              onChange={() => togglePart(part.id)}
            />
            <span>{part.label}</span>
          </label>
        ))}
      </div>

    </div>
  )
}

export default BodyPartSelector