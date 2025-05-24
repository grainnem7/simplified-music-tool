import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@mediapipe/hands';

export interface HandKeypoint {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name?: string;
}

export interface Hand {
  keypoints: HandKeypoint[];
  keypoints3D?: HandKeypoint[];
  handedness: 'Left' | 'Right';
  score: number;
}

// MediaPipe Hands landmark indices
export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20
};

// Get fingertip indices for easy access
export const FINGERTIP_INDICES = [
  HAND_LANDMARKS.THUMB_TIP,
  HAND_LANDMARKS.INDEX_FINGER_TIP,
  HAND_LANDMARKS.MIDDLE_FINGER_TIP,
  HAND_LANDMARKS.RING_FINGER_TIP,
  HAND_LANDMARKS.PINKY_TIP
];

let handDetector: handPoseDetection.HandDetector | null = null;

export const initializeHandDetector = async (): Promise<handPoseDetection.HandDetector> => {
  if (handDetector) {
    return handDetector;
  }

  console.log('Creating MediaPipe Hands detector...');
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig: handPoseDetection.MediaPipeHandsDetectorConfig = {
    runtime: 'mediapipe',  // Use MediaPipe runtime for better accuracy
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    modelType: 'full', // Full model for better finger detection
    maxHands: 2,
  };

  try {
    handDetector = await handPoseDetection.createDetector(model, detectorConfig);
    console.log('MediaPipe Hands detector created successfully');
    
    // Test the detector is working
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    try {
      await handDetector.estimateHands(testCanvas);
      console.log('Hand detector test successful');
    } catch (testErr) {
      console.log('Hand detector test failed (this is normal):', testErr);
    }
    
    return handDetector;
  } catch (error) {
    console.error('Failed to create hand detector:', error);
    throw error;
  }
};

export const detectHands = async (
  videoElement: HTMLVideoElement,
  flipHorizontal: boolean = true
): Promise<Hand[]> => {
  if (!handDetector) {
    throw new Error('Hand detector not initialized');
  }

  try {
    // Validate video element
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      console.warn('Video element not ready:', {
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
        readyState: videoElement.readyState
      });
      return [];
    }

    const hands = await handDetector.estimateHands(videoElement, {
      flipHorizontal
    });

    // Log when hands are detected
    if (hands.length > 0) {
      console.log(`MediaPipe detected ${hands.length} hand(s)`);
      hands.forEach((hand, idx) => {
        console.log(`Hand ${idx}: handedness=${hand.handedness}, keypoints=${hand.keypoints.length}`);
      });
    }

    // Convert to our Hand format
    return hands.map(hand => ({
      keypoints: hand.keypoints.map(kp => ({
        x: kp.x,
        y: kp.y,
        z: kp.z,
        name: kp.name
      })),
      keypoints3D: hand.keypoints3D?.map(kp => ({
        x: kp.x,
        y: kp.y,
        z: kp.z,
        name: kp.name
      })),
      handedness: hand.handedness as 'Left' | 'Right',
      score: hand.score || 1
    }));
  } catch (error) {
    console.error('Error during hand detection:', error);
    return [];
  }
};

export const getFingertipPositions = (hand: Hand): HandKeypoint[] => {
  return FINGERTIP_INDICES.map(index => hand.keypoints[index]);
};

export const getFingerName = (fingertipIndex: number): string => {
  switch (fingertipIndex) {
    case HAND_LANDMARKS.THUMB_TIP: return 'thumb';
    case HAND_LANDMARKS.INDEX_FINGER_TIP: return 'index';
    case HAND_LANDMARKS.MIDDLE_FINGER_TIP: return 'middle';
    case HAND_LANDMARKS.RING_FINGER_TIP: return 'ring';
    case HAND_LANDMARKS.PINKY_TIP: return 'pinky';
    default: return 'unknown';
  }
};

export const disposeHandDetector = async (): Promise<void> => {
  if (handDetector) {
    handDetector.dispose();
    handDetector = null;
  }
};