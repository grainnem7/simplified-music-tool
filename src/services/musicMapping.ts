import { Pose, Keypoint } from '@tensorflow-models/pose-detection'

export interface MusicNote {
  pitch: string
  duration: string
  velocity: number
}

export interface MusicParams {
  notes: MusicNote[]
  tempo: number
}

// Musical scales to use for mapping movement to notes
export const SCALES = {
  pentatonic: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'],
  major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  minor: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
  chromatic: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']
}

// Map body part names from UI to TensorFlow keypoint names
// MoveNet keypoint names use underscores
export const BODY_PART_TO_KEYPOINT: Record<string, string[]> = {
  // Face
  'nose': ['nose'],
  'leftEye': ['left_eye', 'leftEye'],
  'rightEye': ['right_eye', 'rightEye'],
  'leftEar': ['left_ear', 'leftEar'],
  'rightEar': ['right_ear', 'rightEar'],
  
  // Upper body
  'leftShoulder': ['left_shoulder', 'leftShoulder'],
  'rightShoulder': ['right_shoulder', 'rightShoulder'],
  'leftElbow': ['left_elbow', 'leftElbow'],
  'rightElbow': ['right_elbow', 'rightElbow'],
  'leftWrist': ['left_wrist', 'leftWrist'],
  'rightWrist': ['right_wrist', 'rightWrist'],
  
  // Lower body
  'leftHip': ['left_hip', 'leftHip'],
  'rightHip': ['right_hip', 'rightHip'],
  'leftKnee': ['left_knee', 'leftKnee'],
  'rightKnee': ['right_knee', 'rightKnee'],
  'leftAnkle': ['left_ankle', 'leftAnkle'],
  'rightAnkle': ['right_ankle', 'rightAnkle']
}

// Map movement data to musical parameters
export function mapMovementToMusic(pose: Pose, selectedBodyParts: string[]): MusicParams {
  const notes: MusicNote[] = []
  const scale = SCALES.pentatonic
  
  // Calculate tempo based on overall movement speed
  let totalMovement = 0
  let validPartCount = 0
  
  // Process each selected body part
  selectedBodyParts.forEach(bodyPart => {
    const possibleKeypointNames = BODY_PART_TO_KEYPOINT[bodyPart] || [bodyPart]
    const keypoint = pose.keypoints.find(kp => {
      return possibleKeypointNames.includes(kp.name || '')
    })
    
    if (keypoint && keypoint.score && keypoint.score > 0.3) {
      // Normalize Y position (0 = top, 1 = bottom, but flip it for musical sense)
      const normalizedY = 1 - keypoint.y
      
      // Map Y position to note index (0 to scale.length)
      const noteIndex = Math.floor(normalizedY * scale.length)
      const pitchIndex = Math.max(0, Math.min(scale.length - 1, noteIndex))
      const pitch = scale[pitchIndex]
      
      // Map X position to duration
      const normalizedX = keypoint.x
      const duration = normalizedX < 0.3 ? '16n' : normalizedX < 0.7 ? '8n' : '4n'
      
      // Calculate velocity based on confidence
      const velocity = keypoint.score * 0.8
      
      notes.push({ pitch, duration, velocity })
      
      // Calculate movement for tempo
      totalMovement += Math.abs(keypoint.x - 0.5) + Math.abs(keypoint.y - 0.5)
      validPartCount++
    }
  })
  
  // Calculate tempo based on average movement
  const averageMovement = validPartCount > 0 ? totalMovement / validPartCount : 0
  const tempo = Math.floor(60 + averageMovement * 120) // 60-180 BPM based on movement
  
  return {
    notes,
    tempo: Math.min(180, Math.max(60, tempo))
  }
}