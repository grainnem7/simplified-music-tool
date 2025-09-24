import { PoseFrame, TrainingData } from './types';

export function createMockPoseFrame(timestamp?: number): PoseFrame {
  const t = timestamp || Date.now();

  return {
    timestamp: t,
    keypoints: [
      { x: 0.5, y: 0.3, score: 0.95, name: 'nose' },
      { x: 0.48, y: 0.35, score: 0.93, name: 'left_eye' },
      { x: 0.52, y: 0.35, score: 0.94, name: 'right_eye' },
      { x: 0.47, y: 0.36, score: 0.91, name: 'left_ear' },
      { x: 0.53, y: 0.36, score: 0.92, name: 'right_ear' },
      { x: 0.45, y: 0.45, score: 0.96, name: 'left_shoulder' },
      { x: 0.55, y: 0.45, score: 0.97, name: 'right_shoulder' },
      { x: 0.43, y: 0.55, score: 0.88, name: 'left_elbow' },
      { x: 0.57, y: 0.55, score: 0.89, name: 'right_elbow' },
      { x: 0.41, y: 0.65, score: 0.85, name: 'left_wrist' },
      { x: 0.59, y: 0.65, score: 0.86, name: 'right_wrist' },
      { x: 0.44, y: 0.65, score: 0.94, name: 'left_hip' },
      { x: 0.56, y: 0.65, score: 0.95, name: 'right_hip' },
      { x: 0.43, y: 0.75, score: 0.82, name: 'left_knee' },
      { x: 0.57, y: 0.75, score: 0.83, name: 'right_knee' },
      { x: 0.42, y: 0.85, score: 0.78, name: 'left_ankle' },
      { x: 0.58, y: 0.85, score: 0.79, name: 'right_ankle' }
    ]
  };
}

export function createWaveGesture(startTime: number, duration: number = 2000): PoseFrame[] {
  const frames: PoseFrame[] = [];
  const numFrames = Math.floor(duration / 33); // ~30 FPS

  for (let i = 0; i < numFrames; i++) {
    const t = startTime + i * 33;
    const progress = i / numFrames;
    const frame = createMockPoseFrame(t);

    // Wave gesture: move right wrist in a wave pattern
    const waveX = 0.7 + Math.sin(progress * Math.PI * 4) * 0.1;
    const waveY = 0.4 + Math.cos(progress * Math.PI * 4) * 0.05;

    const rightWrist = frame.keypoints.find(k => k.name === 'right_wrist');
    if (rightWrist) {
      rightWrist.x = waveX;
      rightWrist.y = waveY;
    }

    const rightElbow = frame.keypoints.find(k => k.name === 'right_elbow');
    if (rightElbow) {
      rightElbow.x = 0.65;
      rightElbow.y = 0.45;
    }

    frames.push(frame);
  }

  return frames;
}

export function createPointGesture(startTime: number, duration: number = 1500): PoseFrame[] {
  const frames: PoseFrame[] = [];
  const numFrames = Math.floor(duration / 33);

  for (let i = 0; i < numFrames; i++) {
    const t = startTime + i * 33;
    const progress = i / numFrames;
    const frame = createMockPoseFrame(t);

    // Point gesture: extend right arm forward
    const extendProgress = Math.min(1, progress * 2);
    const rightWrist = frame.keypoints.find(k => k.name === 'right_wrist');
    if (rightWrist) {
      rightWrist.x = 0.55 + extendProgress * 0.25;
      rightWrist.y = 0.45 + extendProgress * 0.05;
    }

    const rightElbow = frame.keypoints.find(k => k.name === 'right_elbow');
    if (rightElbow) {
      rightElbow.x = 0.55 + extendProgress * 0.15;
      rightElbow.y = 0.45 + extendProgress * 0.03;
    }

    frames.push(frame);
  }

  return frames;
}

export function createSwipeGesture(startTime: number, direction: 'left' | 'right', duration: number = 1000): PoseFrame[] {
  const frames: PoseFrame[] = [];
  const numFrames = Math.floor(duration / 33);

  for (let i = 0; i < numFrames; i++) {
    const t = startTime + i * 33;
    const progress = i / numFrames;
    const frame = createMockPoseFrame(t);

    // Swipe gesture: move hand horizontally
    const startX = direction === 'right' ? 0.3 : 0.7;
    const endX = direction === 'right' ? 0.7 : 0.3;

    const rightWrist = frame.keypoints.find(k => k.name === 'right_wrist');
    if (rightWrist) {
      rightWrist.x = startX + (endX - startX) * progress;
      rightWrist.y = 0.5;
    }

    const rightElbow = frame.keypoints.find(k => k.name === 'right_elbow');
    if (rightElbow) {
      rightElbow.x = startX + (endX - startX) * progress * 0.7;
      rightElbow.y = 0.48;
    }

    frames.push(frame);
  }

  return frames;
}

export function createIdleMovement(startTime: number, duration: number = 20000): PoseFrame[] {
  const frames: PoseFrame[] = [];
  const numFrames = Math.floor(duration / 33);

  for (let i = 0; i < numFrames; i++) {
    const t = startTime + i * 33;
    const frame = createMockPoseFrame(t);

    // Idle movement: small random movements
    frame.keypoints.forEach(kp => {
      kp.x += (Math.random() - 0.5) * 0.02;
      kp.y += (Math.random() - 0.5) * 0.02;
    });

    frames.push(frame);
  }

  return frames;
}

export function createMockTrainingData(): TrainingData {
  const startTime = Date.now();

  return {
    idleSamples: createIdleMovement(startTime, 5000),
    gestureSamples: {
      'Wave': [
        ...createWaveGesture(startTime + 5000),
        ...createWaveGesture(startTime + 8000),
        ...createWaveGesture(startTime + 11000),
        ...createWaveGesture(startTime + 14000),
        ...createWaveGesture(startTime + 17000)
      ],
      'Point': [
        ...createPointGesture(startTime + 20000),
        ...createPointGesture(startTime + 22000),
        ...createPointGesture(startTime + 24000),
        ...createPointGesture(startTime + 26000),
        ...createPointGesture(startTime + 28000)
      ],
      'Swipe Left': [
        ...createSwipeGesture(startTime + 30000, 'left'),
        ...createSwipeGesture(startTime + 32000, 'left'),
        ...createSwipeGesture(startTime + 34000, 'left'),
        ...createSwipeGesture(startTime + 36000, 'left'),
        ...createSwipeGesture(startTime + 38000, 'left')
      ],
      'Swipe Right': [
        ...createSwipeGesture(startTime + 40000, 'right'),
        ...createSwipeGesture(startTime + 42000, 'right'),
        ...createSwipeGesture(startTime + 44000, 'right'),
        ...createSwipeGesture(startTime + 46000, 'right'),
        ...createSwipeGesture(startTime + 48000, 'right')
      ]
    }
  };
}

export function simulatePoseDetection(
  callback: (pose: PoseFrame) => void,
  gesture: 'wave' | 'point' | 'swipe-left' | 'swipe-right' | 'idle',
  duration: number = 2000
): () => void {
  let frameIndex = 0;
  const startTime = Date.now();
  let frames: PoseFrame[];

  switch (gesture) {
    case 'wave':
      frames = createWaveGesture(startTime, duration);
      break;
    case 'point':
      frames = createPointGesture(startTime, duration);
      break;
    case 'swipe-left':
      frames = createSwipeGesture(startTime, 'left', duration);
      break;
    case 'swipe-right':
      frames = createSwipeGesture(startTime, 'right', duration);
      break;
    default:
      frames = createIdleMovement(startTime, duration);
  }

  const intervalId = setInterval(() => {
    if (frameIndex < frames.length) {
      callback(frames[frameIndex]);
      frameIndex++;
    } else {
      clearInterval(intervalId);
    }
  }, 33);

  return () => clearInterval(intervalId);
}