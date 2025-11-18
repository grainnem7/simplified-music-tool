import { useMusicSettings } from '../contexts/MusicSettingsContext'
import './BodyPartActivity.css'

interface BodyPartActivityProps {
  bodyPartIntensities: Record<string, number>
  selectedBodyParts: string[]
}

const BODY_PART_LABELS: Record<string, string> = {
  rightWrist: 'R. Wrist',
  rightElbow: 'R. Elbow',
  rightShoulder: 'R. Shoulder',
  rightHip: 'R. Hip',
  rightKnee: 'R. Knee',
  rightAnkle: 'R. Ankle',
  leftWrist: 'L. Wrist',
  leftElbow: 'L. Elbow',
  leftShoulder: 'L. Shoulder',
  leftHip: 'L. Hip',
  leftKnee: 'L. Knee',
  leftAnkle: 'L. Ankle',
  nose: 'Head',
}

function BodyPartActivity({ bodyPartIntensities, selectedBodyParts }: BodyPartActivityProps) {
  const { settings } = useMusicSettings()

  // Debug logging
  console.log('BodyPartActivity render:', {
    selectedBodyParts,
    bodyPartIntensities,
    configs: Object.fromEntries(
      selectedBodyParts.map(p => [p, settings.bodyPartConfigs[p]?.role])
    )
  })

  if (selectedBodyParts.length === 0) {
    console.log('BodyPartActivity: No selected body parts')
    return null
  }

  // Filter out disabled parts for display
  const activeParts = selectedBodyParts.filter(partId => {
    const config = settings.bodyPartConfigs[partId]
    return config?.role !== 'disabled'
  })

  console.log('BodyPartActivity activeParts:', activeParts)

  if (activeParts.length === 0) {
    console.log('BodyPartActivity: All parts are disabled')
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
          const label = BODY_PART_LABELS[partId] || partId

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
