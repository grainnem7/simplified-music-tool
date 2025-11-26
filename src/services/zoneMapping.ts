import { Pose, Keypoint } from '@tensorflow-models/pose-detection'

/**
 * Cursor position in normalized coordinates (0-1)
 */
export interface CursorPosition {
  x: number
  y: number
  confidence: number  // 0-1, based on keypoint confidence
}

/**
 * Smoothing buffer for reducing jitter
 */
class PositionSmoother {
  private buffer: Array<{ x: number; y: number }> = []
  private maxBufferSize: number

  constructor(bufferSize: number = 5) {
    this.maxBufferSize = bufferSize
  }

  addPosition(x: number, y: number): { x: number; y: number } {
    this.buffer.push({ x, y })
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift()
    }

    // Return exponentially weighted moving average
    let totalWeight = 0
    let weightedX = 0
    let weightedY = 0

    this.buffer.forEach((pos, index) => {
      // More recent positions get higher weight
      const weight = Math.pow(2, index)
      totalWeight += weight
      weightedX += pos.x * weight
      weightedY += pos.y * weight
    })

    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight
    }
  }

  reset() {
    this.buffer = []
  }
}

// Global smoother instance
const smoother = new PositionSmoother(5)

// Default video dimensions (used when actual dimensions unknown)
const DEFAULT_VIDEO_WIDTH = 640
const DEFAULT_VIDEO_HEIGHT = 480

/**
 * Extract cursor position from pose data
 *
 * Strategy:
 * 1. Try to use torso centroid (shoulders + hips) for stability
 * 2. Fallback to nose if torso not detected
 * 3. Apply smoothing to reduce jitter
 * 4. Normalize coordinates to 0-1 range
 *
 * This is modular - we can easily swap which body point we track
 * by changing this function without affecting the rest of the system.
 *
 * @param pose - The detected pose from TensorFlow
 * @param videoWidth - Video frame width for normalization (default 640)
 * @param videoHeight - Video frame height for normalization (default 480)
 */
export function getCursorFromPose(
  pose: Pose,
  videoWidth: number = DEFAULT_VIDEO_WIDTH,
  videoHeight: number = DEFAULT_VIDEO_HEIGHT
): CursorPosition | null {
  if (!pose || !pose.keypoints || pose.keypoints.length === 0) {
    return null
  }

  const keypoints = pose.keypoints

  // Helper to find a keypoint by name
  const findKeypoint = (names: string[]): Keypoint | undefined => {
    return keypoints.find(kp => {
      return names.includes(kp.name || '')
    })
  }

  // Strategy 1: Use torso centroid (most stable for full-body tracking)
  const leftShoulder = findKeypoint(['left_shoulder', 'leftShoulder'])
  const rightShoulder = findKeypoint(['right_shoulder', 'rightShoulder'])
  const leftHip = findKeypoint(['left_hip', 'leftHip'])
  const rightHip = findKeypoint(['right_hip', 'rightHip'])

  // Confidence threshold for using a keypoint
  const MIN_CONFIDENCE = 0.3

  const torsoPoints: Array<{ x: number; y: number; score: number }> = []

  if (leftShoulder && leftShoulder.score && leftShoulder.score > MIN_CONFIDENCE) {
    torsoPoints.push({ x: leftShoulder.x, y: leftShoulder.y, score: leftShoulder.score })
  }
  if (rightShoulder && rightShoulder.score && rightShoulder.score > MIN_CONFIDENCE) {
    torsoPoints.push({ x: rightShoulder.x, y: rightShoulder.y, score: rightShoulder.score })
  }
  if (leftHip && leftHip.score && leftHip.score > MIN_CONFIDENCE) {
    torsoPoints.push({ x: leftHip.x, y: leftHip.y, score: leftHip.score })
  }
  if (rightHip && rightHip.score && rightHip.score > MIN_CONFIDENCE) {
    torsoPoints.push({ x: rightHip.x, y: rightHip.y, score: rightHip.score })
  }

  // If we have at least 2 torso points, use their centroid
  if (torsoPoints.length >= 2) {
    const avgX = torsoPoints.reduce((sum, p) => sum + p.x, 0) / torsoPoints.length
    const avgY = torsoPoints.reduce((sum, p) => sum + p.y, 0) / torsoPoints.length
    const avgConfidence = torsoPoints.reduce((sum, p) => sum + p.score, 0) / torsoPoints.length

    // Normalize to 0-1 range
    const normalizedX = Math.max(0, Math.min(1, avgX / videoWidth))
    const normalizedY = Math.max(0, Math.min(1, avgY / videoHeight))

    // Apply smoothing
    const smoothed = smoother.addPosition(normalizedX, normalizedY)

    return {
      x: smoothed.x,
      y: smoothed.y,
      confidence: avgConfidence
    }
  }

  // Strategy 2: Fallback to nose (good for head/upper body tracking)
  const nose = findKeypoint(['nose'])
  if (nose && nose.score && nose.score > MIN_CONFIDENCE) {
    const normalizedX = Math.max(0, Math.min(1, nose.x / videoWidth))
    const normalizedY = Math.max(0, Math.min(1, nose.y / videoHeight))
    const smoothed = smoother.addPosition(normalizedX, normalizedY)

    return {
      x: smoothed.x,
      y: smoothed.y,
      confidence: nose.score
    }
  }

  // Strategy 3: Fallback to any high-confidence keypoint
  const bestKeypoint = keypoints
    .filter(kp => kp.score && kp.score > MIN_CONFIDENCE)
    .sort((a, b) => (b.score || 0) - (a.score || 0))[0]

  if (bestKeypoint) {
    const normalizedX = Math.max(0, Math.min(1, bestKeypoint.x / videoWidth))
    const normalizedY = Math.max(0, Math.min(1, bestKeypoint.y / videoHeight))
    const smoothed = smoother.addPosition(normalizedX, normalizedY)

    return {
      x: smoothed.x,
      y: smoothed.y,
      confidence: bestKeypoint.score || 0
    }
  }

  // No suitable keypoints found
  return null
}

/**
 * Reset the position smoother (useful when starting a new session)
 */
export function resetCursorSmoothing() {
  smoother.reset()
}
