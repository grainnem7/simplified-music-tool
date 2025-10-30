import './BodyDiagram.css'

interface BodyDiagramProps {
  selectedParts: string[]
}

// Complete body parts including eyes, no nose
const BODY_PARTS = [
  { id: 'leftEye', x: 185, y: 55, label: 'L Eye' },
  { id: 'rightEye', x: 215, y: 55, label: 'R Eye' },
  { id: 'leftShoulder', x: 160, y: 140, label: 'L Shoulder' },
  { id: 'rightShoulder', x: 240, y: 140, label: 'R Shoulder' },
  { id: 'leftElbow', x: 130, y: 200, label: 'L Elbow' },
  { id: 'rightElbow', x: 270, y: 200, label: 'R Elbow' },
  { id: 'leftWrist', x: 110, y: 260, label: 'L Wrist' },
  { id: 'rightWrist', x: 290, y: 260, label: 'R Wrist' },
  { id: 'leftHip', x: 175, y: 240, label: 'L Hip' },
  { id: 'rightHip', x: 225, y: 240, label: 'R Hip' },
  { id: 'leftKnee', x: 170, y: 320, label: 'L Knee' },
  { id: 'rightKnee', x: 230, y: 320, label: 'R Knee' },
  { id: 'leftAnkle', x: 165, y: 400, label: 'L Ankle' },
  { id: 'rightAnkle', x: 235, y: 400, label: 'R Ankle' },
]

function BodyDiagram({ selectedParts }: BodyDiagramProps) {
  return (
    <div className="body-diagram-container">
      <svg viewBox="0 0 400 450" className="body-svg" xmlns="http://www.w3.org/2000/svg">
        {/* Simple stick figure */}
        <g className="body-figure" strokeLinecap="round" strokeLinejoin="round">
          {/* Head circle */}
          <circle cx="200" cy="60" r="32" />

          {/* Eyes within head */}
          <circle cx="185" cy="55" r="4" className="eye-outline" />
          <circle cx="215" cy="55" r="4" className="eye-outline" />

          {/* Torso */}
          <line x1="200" y1="92" x2="200" y2="240" strokeWidth="3" />

          {/* Shoulders */}
          <line x1="160" y1="140" x2="240" y2="140" strokeWidth="3" />

          {/* Left arm */}
          <line x1="160" y1="140" x2="130" y2="200" strokeWidth="2.5" />
          <line x1="130" y1="200" x2="110" y2="260" strokeWidth="2.5" />

          {/* Right arm */}
          <line x1="240" y1="140" x2="270" y2="200" strokeWidth="2.5" />
          <line x1="270" y1="200" x2="290" y2="260" strokeWidth="2.5" />

          {/* Hips */}
          <line x1="175" y1="240" x2="225" y2="240" strokeWidth="3" />

          {/* Left leg */}
          <line x1="175" y1="240" x2="170" y2="320" strokeWidth="2.5" />
          <line x1="170" y1="320" x2="165" y2="400" strokeWidth="2.5" />

          {/* Right leg */}
          <line x1="225" y1="240" x2="230" y2="320" strokeWidth="2.5" />
          <line x1="230" y1="320" x2="235" y2="400" strokeWidth="2.5" />
        </g>

        {/* Interactive body points - simple dots only */}
        {BODY_PARTS.map((part) => {
          const isSelected = selectedParts.includes(part.id)
          return (
            <g key={part.id} className="body-point-group">
              {/* Simple dot */}
              <circle
                cx={part.x}
                cy={part.y}
                r="7"
                className={`body-point ${isSelected ? 'selected' : ''}`}
              />

              {/* Label always visible */}
              <text
                x={part.x}
                y={part.y - 20}
                className={`point-label ${isSelected ? 'selected' : ''}`}
                textAnchor="middle"
              >
                {part.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default BodyDiagram
