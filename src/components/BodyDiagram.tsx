import './BodyDiagram.css'

interface BodyDiagramProps {
  selectedParts: string[]
}

const BODY_PART_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  // Face
  nose: { x: 100, y: 40, label: 'Nose' },
  leftEye: { x: 90, y: 35, label: 'L Eye' },
  rightEye: { x: 110, y: 35, label: 'R Eye' },
  leftEar: { x: 80, y: 40, label: 'L Ear' },
  rightEar: { x: 120, y: 40, label: 'R Ear' },
  
  // Upper body
  leftShoulder: { x: 70, y: 80, label: 'L Shoulder' },
  rightShoulder: { x: 130, y: 80, label: 'R Shoulder' },
  leftElbow: { x: 50, y: 120, label: 'L Elbow' },
  rightElbow: { x: 150, y: 120, label: 'R Elbow' },
  leftWrist: { x: 40, y: 150, label: 'L Wrist' },
  rightWrist: { x: 160, y: 150, label: 'R Wrist' },
  
  // Lower body
  leftHip: { x: 85, y: 140, label: 'L Hip' },
  rightHip: { x: 115, y: 140, label: 'R Hip' },
  leftKnee: { x: 80, y: 190, label: 'L Knee' },
  rightKnee: { x: 120, y: 190, label: 'R Knee' },
  leftAnkle: { x: 75, y: 240, label: 'L Ankle' },
  rightAnkle: { x: 125, y: 240, label: 'R Ankle' },
}

function BodyDiagram({ selectedParts }: BodyDiagramProps) {
  return (
    <div className="body-diagram">
      <svg viewBox="0 0 200 260" className="body-svg">
        {/* Simple body outline */}
        <g className="body-outline">
          {/* Head */}
          <circle cx="100" cy="40" r="20" />
          
          {/* Torso */}
          <line x1="100" y1="60" x2="100" y2="140" />
          
          {/* Arms */}
          <line x1="100" y1="80" x2="70" y2="80" />
          <line x1="70" y1="80" x2="50" y2="120" />
          <line x1="50" y1="120" x2="40" y2="150" />
          
          <line x1="100" y1="80" x2="130" y2="80" />
          <line x1="130" y1="80" x2="150" y2="120" />
          <line x1="150" y1="120" x2="160" y2="150" />
          
          {/* Legs */}
          <line x1="100" y1="140" x2="85" y2="140" />
          <line x1="85" y1="140" x2="80" y2="190" />
          <line x1="80" y1="190" x2="75" y2="240" />
          
          <line x1="100" y1="140" x2="115" y2="140" />
          <line x1="115" y1="140" x2="120" y2="190" />
          <line x1="120" y1="190" x2="125" y2="240" />
        </g>
        
        {/* Body part dots with labels */}
        {Object.entries(BODY_PART_POSITIONS).map(([partId, position]) => {
          const isSelected = selectedParts.includes(partId)
          return (
            <g key={partId}>
              <circle
                cx={position.x}
                cy={position.y}
                r="6"
                className={`body-point ${isSelected ? 'active' : ''}`}
              />
              {isSelected && (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="8"
                  fill="none"
                  stroke="var(--accent-color)"
                  strokeWidth="2"
                  opacity="0.6"
                  className="body-point-glow"
                />
              )}
              <text
                x={position.x}
                y={position.y - 10}
                className="body-label"
              >
                {position.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default BodyDiagram