import { Pose, Keypoint } from '@tensorflow-models/pose-detection'

/**
 * Cursor position in normalized coordinates (0-1)
 */
export interface CursorPosition {
  x: number
  y: number
  confidence: number  // 0-1, based on keypoint confidence
  source: string      // Which body part(s) the cursor is derived from
}

/**
 * Available tracking sources for cursor position
 */
export type TrackingSource = 'auto' | 'torso' | 'nose' | 'left_wrist' | 'right_wrist' | 'left_index' | 'right_index'

export const TRACKING_SOURCE_LABELS: Record<TrackingSource, string> = {
  'auto': 'Auto (best available)',
  'torso': 'Torso (center of body)',
  'nose': 'Head (nose)',
  'left_wrist': 'Left Hand (wrist)',
  'right_wrist': 'Right Hand (wrist)',
  'left_index': 'Left Finger (index)',
  'right_index': 'Right Finger (index)'
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

/**
 * Extract cursor position from pose data
 *
 * @param pose - The detected pose
 * @param trackingSource - Which body part to track ('auto' uses fallback strategy)
 *
 * NOTE: Coordinates are expected to already be normalized (0-1) from usePoseDetection
 */
export function getCursorFromPose(pose: Pose, trackingSource: TrackingSource = 'auto'): CursorPosition | null {
  if (!pose || !pose.keypoints || pose.keypoints.length === 0) {
    return null
  }

  const keypoints = pose.keypoints
  const MIN_CONFIDENCE = 0.3

  // Helper to find a keypoint by name
  const findKeypoint = (names: string[]): Keypoint | undefined => {
    return keypoints.find(kp => names.includes(kp.name || ''))
  }

  // Helper to get a specific keypoint as cursor
  const getKeypointCursor = (names: string[], sourceName: string): CursorPosition | null => {
    const kp = findKeypoint(names)
    if (kp && kp.score && kp.score > MIN_CONFIDENCE) {
      const smoothed = smoother.addPosition(kp.x, kp.y)
      return {
        x: smoothed.x,
        y: smoothed.y,
        confidence: kp.score,
        source: sourceName
      }
    }
    return null
  }

  // Helper to get torso centroid
  const getTorsoCursor = (): CursorPosition | null => {
    const leftShoulder = findKeypoint(['left_shoulder', 'leftShoulder'])
    const rightShoulder = findKeypoint(['right_shoulder', 'rightShoulder'])
    const leftHip = findKeypoint(['left_hip', 'leftHip'])
    const rightHip = findKeypoint(['right_hip', 'rightHip'])

    const torsoPoints: Array<{ x: number; y: number; score: number; name: string }> = []

    if (leftShoulder && leftShoulder.score && leftShoulder.score > MIN_CONFIDENCE) {
      torsoPoints.push({ x: leftShoulder.x, y: leftShoulder.y, score: leftShoulder.score, name: 'L.Shoulder' })
    }
    if (rightShoulder && rightShoulder.score && rightShoulder.score > MIN_CONFIDENCE) {
      torsoPoints.push({ x: rightShoulder.x, y: rightShoulder.y, score: rightShoulder.score, name: 'R.Shoulder' })
    }
    if (leftHip && leftHip.score && leftHip.score > MIN_CONFIDENCE) {
      torsoPoints.push({ x: leftHip.x, y: leftHip.y, score: leftHip.score, name: 'L.Hip' })
    }
    if (rightHip && rightHip.score && rightHip.score > MIN_CONFIDENCE) {
      torsoPoints.push({ x: rightHip.x, y: rightHip.y, score: rightHip.score, name: 'R.Hip' })
    }

    if (torsoPoints.length >= 2) {
      const avgX = torsoPoints.reduce((sum, p) => sum + p.x, 0) / torsoPoints.length
      const avgY = torsoPoints.reduce((sum, p) => sum + p.y, 0) / torsoPoints.length
      const avgConfidence = torsoPoints.reduce((sum, p) => sum + p.score, 0) / torsoPoints.length
      const smoothed = smoother.addPosition(avgX, avgY)

      return {
        x: smoothed.x,
        y: smoothed.y,
        confidence: avgConfidence,
        source: `Torso (${torsoPoints.map(p => p.name).join(', ')})`
      }
    }
    return null
  }

  // If specific source requested, try that first
  if (trackingSource !== 'auto') {
    switch (trackingSource) {
      case 'torso':
        return getTorsoCursor()
      case 'nose':
        return getKeypointCursor(['nose'], 'Nose')
      case 'left_wrist':
        return getKeypointCursor(['left_wrist', 'leftWrist'], 'Left Wrist')
      case 'right_wrist':
        return getKeypointCursor(['right_wrist', 'rightWrist'], 'Right Wrist')
      case 'left_index':
        return getKeypointCursor(['left_index', 'leftIndex', 'left_index_finger'], 'Left Index')
      case 'right_index':
        return getKeypointCursor(['right_index', 'rightIndex', 'right_index_finger'], 'Right Index')
    }
  }

  // Auto mode: try strategies in order
  // Strategy 1: Torso centroid (most stable)
  const torsoCursor = getTorsoCursor()
  if (torsoCursor) return torsoCursor

  // Strategy 2: Nose (good for upper body)
  const noseCursor = getKeypointCursor(['nose'], 'Nose')
  if (noseCursor) return noseCursor

  // Strategy 3: Any high-confidence keypoint
  const bestKeypoint = keypoints
    .filter(kp => kp.score && kp.score > MIN_CONFIDENCE)
    .sort((a, b) => (b.score || 0) - (a.score || 0))[0]

  if (bestKeypoint) {
    const smoothed = smoother.addPosition(bestKeypoint.x, bestKeypoint.y)
    return {
      x: smoothed.x,
      y: smoothed.y,
      confidence: bestKeypoint.score || 0,
      source: bestKeypoint.name || 'Unknown'
    }
  }

  return null
}

/**
 * Reset the position smoother (useful when starting a new session)
 */
export function resetCursorSmoothing() {
  smoother.reset()
}
