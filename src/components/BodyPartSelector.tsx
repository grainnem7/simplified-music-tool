import './BodyPartSelector.css'

interface BodyPartSelectorProps {
  selectedParts: string[]
  onSelectionChange: (parts: string[]) => void
}

const BODY_PART_GROUPS = {
  face: {
    label: 'Head',
    parts: [
      { id: 'leftEye', label: 'Left Eye' },
      { id: 'rightEye', label: 'Right Eye' },
    ]
  },
  upper: {
    label: 'Upper Body',
    parts: [
      { id: 'leftShoulder', label: 'Left Shoulder' },
      { id: 'rightShoulder', label: 'Right Shoulder' },
      { id: 'leftElbow', label: 'Left Elbow' },
      { id: 'rightElbow', label: 'Right Elbow' },
      { id: 'leftWrist', label: 'Left Wrist' },
      { id: 'rightWrist', label: 'Right Wrist' },
    ]
  },
  lower: {
    label: 'Lower Body',
    parts: [
      { id: 'leftHip', label: 'Left Hip' },
      { id: 'rightHip', label: 'Right Hip' },
      { id: 'leftKnee', label: 'Left Knee' },
      { id: 'rightKnee', label: 'Right Knee' },
      { id: 'leftAnkle', label: 'Left Ankle' },
      { id: 'rightAnkle', label: 'Right Ankle' },
    ]
  }
}

function BodyPartSelector({ selectedParts, onSelectionChange }: BodyPartSelectorProps) {
  const togglePart = (partId: string) => {
    if (selectedParts.includes(partId)) {
      onSelectionChange(selectedParts.filter(id => id !== partId))
    } else {
      onSelectionChange([...selectedParts, partId])
    }
  }

  const toggleAll = () => {
    const allParts = Object.values(BODY_PART_GROUPS).flatMap(group => group.parts.map(part => part.id))
    if (selectedParts.length === allParts.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(allParts)
    }
  }

  const allPartsCount = Object.values(BODY_PART_GROUPS).reduce((sum, group) => sum + group.parts.length, 0)

  return (
    <div className="body-part-selector">
      <div className="selector-actions">
        <button onClick={toggleAll} className="select-all-button">
          {selectedParts.length === allPartsCount ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="body-parts-grid">
        {Object.entries(BODY_PART_GROUPS).map(([groupKey, group]) => (
          <div key={groupKey} className="body-part-category">
            <div className="category-header">{group.label}</div>
            {group.parts.map(part => {
              const isSelected = selectedParts.includes(part.id)
              return (
                <label
                  key={part.id}
                  className={`body-part-item ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="body-part-checkbox"
                    checked={isSelected}
                    onChange={() => togglePart(part.id)}
                  />
                  <span className="body-part-label">{part.label}</span>
                </label>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BodyPartSelector