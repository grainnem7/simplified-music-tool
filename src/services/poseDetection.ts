import * as poseDetection from '@tensorflow-models/pose-detection'
import '@tensorflow/tfjs-backend-webgl'

export interface PosePoint {
  x: number
  y: number
  score?: number
  name?: string
}

export async function createPoseDetector() {
  const model = poseDetection.SupportedModels.MoveNet
  
  const detector = await poseDetection.createDetector(model, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    enableTracking: true,
    trackerType: poseDetection.TrackerType.BoundingBox
  })
  
  return detector
}

export function normalizeKeypoints(keypoints: poseDetection.Keypoint[]) {
  const normalized = keypoints.map(kp => ({
    x: kp.x,
    y: kp.y,
    score: kp.score,
    name: kp.name
  }))
  
  return normalized
}