import { useMusicSettings } from '../contexts/MusicSettingsContext'
import './BodyPartActivity.css'

interface BodyPartActivityProps {
  bodyPartIntensities: Record<string, number>
  selectedBodyParts: string[]
}

/**
 * Labels for activity display
 * These use generic names to avoid normative body assumptions
 * while still allowing users to distinguish between inputs
 */
const ACTIVITY_LABELS: Record<string, string> = {
  rightWrist: 'Input 1',
  rightElbow: 'Input 2',
  rightShoulder: 'Input 3',
  rightHip: 'Input 4',
  rightKnee: 'Input 5',
  rightAnkle: 'Input 6',
  leftWrist: 'Input 7',
  leftElbow: 'Input 8',
  leftShoulder: 'Input 9',
  leftHip: 'Input 10',
  leftKnee: 'Input 11',
  leftAnkle: 'Input 12',
  nose: 'Input 13',
}

function BodyPartActivity({ bodyPartIntensities, selectedBodyParts }: BodyPartActivityProps) {
  const { settings } = useMusicSettings()

  if (selectedBodyParts.length === 0) {
    return null
  }

  // Filter out disabled parts for display
  const activeParts = selectedBodyParts.filter(partId => {
    const config = settings.bodyPartConfigs[partId]
    return config?.role !== 'disabled'
  })

  if (activeParts.length === 0) {
    return null
  }

  return (
    <div className="body-part-activity">
      <h4 className="activity-title">Activity Monitor</h4>
      <div className="activity-list">
        {activeParts.map(partId => {
          const config = settings.bodyPartConfigs[partId]
          const role = config?.role || 'melodic'
          const intensity = bodyPartIntensities[partId] || 0
          const label = ACTIVITY_LABELS[partId] || `Input ${activeParts.indexOf(partId) + 1}`

          return (
            <div key={partId} className="activity-item">
              <div className="activity-info">
                <span className="activity-label">{label}</span>
                <span className={`activity-role role-${role}`}>
                  {role.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="activity-bar-container">
                <div
                  className={`activity-bar role-${role}`}
                  style={{ width: `${Math.max(2, intensity * 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="activity-legend">
        <span className="legend-item">
          <span className="legend-dot role-melodic"></span>M = Melodic
        </span>
        <span className="legend-item">
          <span className="legend-dot role-bass"></span>B = Bass
        </span>
        <span className="legend-item">
          <span className="legend-dot role-chord"></span>C = Chord
        </span>
      </div>
    </div>
  )
}

export default BodyPartActivity
