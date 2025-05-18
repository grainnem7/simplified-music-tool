import { Pose, Keypoint } from '@tensorflow-models/pose-detection'

export interface MusicNote {
  pitch: string
  duration: string
  velocity: number
}

export interface MusicParams {
  notes: MusicNote[]
  tempo: number
  scale: string[]
}

// Map body part IDs to keypoint names
const BODY_PART_TO_KEYPOINT: Record<string, string> = {
  'leftHand': 'left_wrist',
  'rightHand': 'right_wrist',
  'leftElbow': 'left_elbow',
  'rightElbow': 'right_elbow',
  'leftShoulder': 'left_shoulder',
  'rightShoulder': 'right_shoulder',
  'head': 'nose',
  'leftHip': 'left_hip',
  'rightHip': 'right_hip',
  'leftKnee': 'left_knee',
  'rightKnee': 'right_knee',
  'leftFoot': 'left_ankle',
  'rightFoot': 'right_ankle'
}

// Musical scales
const SCALES = {
  major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  minor: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
  pentatonic: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5']
}

export function mapMovementToMusic(pose: Pose, selectedBodyParts: string[]): MusicParams {
  const notes: MusicNote[] = []
  const scale = SCALES.pentatonic
  
  console.log('Mapping movement to music...')
  console.log('Selected body parts:', selectedBodyParts)
  console.log('Pose keypoints:', pose.keypoints.map(kp => `${kp.name}: ${kp.score}`))
  
  selectedBodyParts.forEach(bodyPart => {
    const keypointName = BODY_PART_TO_KEYPOINT[bodyPart]
    console.log(`Looking for keypoint: ${keypointName} for body part: ${bodyPart}`)
    
    const keypoint = pose.keypoints.find(kp => kp.name === keypointName)
    
    if (keypoint && keypoint.score && keypoint.score > 0.3) {
      console.log(`Found keypoint ${keypointName} with score ${keypoint.score}`)
      
      // Map Y position to pitch (higher position = higher pitch)
      const pitchIndex = Math.floor((1 - keypoint.y) * scale.length)
      const pitch = scale[Math.max(0, Math.min(pitchIndex, scale.length - 1))]
      
      // Map confidence score to velocity
      const velocity = keypoint.score * 0.8
      
      // Map X position to note duration
      const duration = keypoint.x > 0.5 ? '8n' : '16n'
      
      console.log(`Generated note: ${pitch}, duration: ${duration}, velocity: ${velocity}`)
      notes.push({ pitch, duration, velocity })
    } else {
      console.log(`Keypoint ${keypointName} not found or low confidence`)
    }
  })
  
  // Calculate tempo based on overall movement
  const validKeypoints = pose.keypoints.filter(kp => kp.score && kp.score > 0.3)
  const averageY = validKeypoints.reduce((sum, kp) => sum + kp.y, 0) / validKeypoints.length
  
  const tempo = Math.floor(60 + (1 - averageY) * 120) // 60-180 BPM
  
  console.log(`Generated ${notes.length} notes with tempo ${tempo}`)
  
  return {
    notes,
    tempo,
    scale
  }
}