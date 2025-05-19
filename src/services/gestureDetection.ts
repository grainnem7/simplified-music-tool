import { Pose, Keypoint } from '@tensorflow-models/pose-detection'

export interface Gesture {
  type: 'swipe' | 'circle' | 'hold' | 'wave' | 'clap' | 'distance'
  confidence: number
  parameters: Record<string, number>
}

// Store history for gesture detection
const poseHistory: Pose[] = []
const maxHistoryLength = 10

// Gesture detection functions
export function detectGestures(pose: Pose, selectedBodyParts: string[]): Gesture[] {
  const gestures: Gesture[] = []
  
  // Add current pose to history
  poseHistory.push(pose)
  if (poseHistory.length > maxHistoryLength) {
    poseHistory.shift()
  }
  
  // Need at least 3 frames for gesture detection
  if (poseHistory.length < 3) return gestures
  
  // Detect various gestures
  const swipeGesture = detectSwipe(selectedBodyParts)
  if (swipeGesture) gestures.push(swipeGesture)
  
  const waveGesture = detectWave(selectedBodyParts)
  if (waveGesture) gestures.push(waveGesture)
  
  const distanceGesture = detectDistanceBetweenParts(pose, selectedBodyParts)
  if (distanceGesture) gestures.push(distanceGesture)
  
  const holdGesture = detectHold(selectedBodyParts)
  if (holdGesture) gestures.push(holdGesture)
  
  return gestures
}

function detectSwipe(selectedParts: string[]): Gesture | null {
  if (poseHistory.length < 5) return null
  
  // Check for horizontal swipe with wrists
  const wristParts = selectedParts.filter(part => part.includes('Wrist'))
  
  for (const wristPart of wristParts) {
    const positions = poseHistory.map(pose => {
      const keypoint = pose.keypoints.find(kp => kp.name === wristPart)
      return keypoint && keypoint.score && keypoint.score > 0.3 ? keypoint : null
    }).filter(kp => kp !== null) as Keypoint[]
    
    if (positions.length < 5) continue
    
    // Calculate horizontal movement
    const startX = positions[0].x
    const endX = positions[positions.length - 1].x
    const distance = Math.abs(endX - startX)
    
    if (distance > 0.3) { // Significant horizontal movement
      const direction = endX > startX ? 1 : -1
      return {
        type: 'swipe',
        confidence: Math.min(distance * 2, 1),
        parameters: {
          direction,
          speed: distance / positions.length,
          distance
        }
      }
    }
  }
  
  return null
}

function detectWave(selectedParts: string[]): Gesture | null {
  if (poseHistory.length < 8) return null
  
  const handParts = selectedParts.filter(part => 
    part.includes('Wrist') || part.includes('Elbow')
  )
  
  for (const part of handParts) {
    const positions = poseHistory.map(pose => {
      const keypoint = pose.keypoints.find(kp => kp.name === part)
      return keypoint && keypoint.score && keypoint.score > 0.3 ? keypoint : null
    }).filter(kp => kp !== null) as Keypoint[]
    
    if (positions.length < 8) continue
    
    // Detect oscillating motion (wave)
    let directionChanges = 0
    let lastDirection = 0
    
    for (let i = 1; i < positions.length; i++) {
      const direction = positions[i].x - positions[i - 1].x
      if (lastDirection !== 0 && Math.sign(direction) !== Math.sign(lastDirection)) {
        directionChanges++
      }
      lastDirection = direction
    }
    
    if (directionChanges >= 3) { // At least 3 direction changes
      return {
        type: 'wave',
        confidence: Math.min(directionChanges / 5, 1),
        parameters: {
          frequency: directionChanges / positions.length,
          amplitude: calculateAmplitude(positions)
        }
      }
    }
  }
  
  return null
}

function detectDistanceBetweenParts(pose: Pose, selectedParts: string[]): Gesture | null {
  // Calculate distance between two tracked parts
  if (selectedParts.length < 2) return null
  
  const keypoints = selectedParts.map(part => {
    return pose.keypoints.find(kp => kp.name === part && kp.score && kp.score > 0.3)
  }).filter(kp => kp !== undefined) as Keypoint[]
  
  if (keypoints.length < 2) return null
  
  // Calculate distances between all pairs
  const distances: number[] = []
  for (let i = 0; i < keypoints.length - 1; i++) {
    for (let j = i + 1; j < keypoints.length; j++) {
      const distance = Math.sqrt(
        Math.pow(keypoints[i].x - keypoints[j].x, 2) +
        Math.pow(keypoints[i].y - keypoints[j].y, 2)
      )
      distances.push(distance)
    }
  }
  
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length
  
  return {
    type: 'distance',
    confidence: 1,
    parameters: {
      distance: avgDistance,
      minDistance: Math.min(...distances),
      maxDistance: Math.max(...distances)
    }
  }
}

function detectHold(selectedParts: string[]): Gesture | null {
  if (poseHistory.length < 5) return null
  
  // Check if parts are relatively stationary
  for (const part of selectedParts) {
    const positions = poseHistory.slice(-5).map(pose => {
      const keypoint = pose.keypoints.find(kp => kp.name === part)
      return keypoint && keypoint.score && keypoint.score > 0.3 ? keypoint : null
    }).filter(kp => kp !== null) as Keypoint[]
    
    if (positions.length < 5) continue
    
    // Calculate variance in position
    const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length
    const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length
    
    const variance = positions.reduce((sum, p) => {
      return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2)
    }, 0) / positions.length
    
    if (variance < 0.01) { // Very little movement
      return {
        type: 'hold',
        confidence: 1 - (variance * 100),
        parameters: {
          duration: positions.length,
          x: avgX,
          y: avgY
        }
      }
    }
  }
  
  return null
}

function calculateAmplitude(positions: Keypoint[]): number {
  const xValues = positions.map(p => p.x)
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  return maxX - minX
}

// Calculate velocity between keypoints
export function calculateVelocity(
  current: Keypoint, 
  previous: Keypoint, 
  deltaTime: number = 1
): number {
  const distance = Math.sqrt(
    Math.pow(current.x - previous.x, 2) +
    Math.pow(current.y - previous.y, 2)
  )
  return distance / deltaTime
}

// Calculate barycenter of selected keypoints
export function calculateBarycenter(keypoints: Keypoint[]): { x: number; y: number } {
  const validKeypoints = keypoints.filter(kp => kp.score && kp.score > 0.3)
  
  if (validKeypoints.length === 0) {
    return { x: 0, y: 0 }
  }
  
  const sumX = validKeypoints.reduce((sum, kp) => sum + kp.x, 0)
  const sumY = validKeypoints.reduce((sum, kp) => sum + kp.y, 0)
  
  return {
    x: sumX / validKeypoints.length,
    y: sumY / validKeypoints.length
  }
}