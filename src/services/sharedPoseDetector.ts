import * as poseDetection from '@tensorflow-models/pose-detection';

let sharedDetector: poseDetection.PoseDetector | null = null;
let initializationPromise: Promise<poseDetection.PoseDetector> | null = null;

export async function getSharedPoseDetector(): Promise<poseDetection.PoseDetector> {
  // If already initialized, return the existing detector
  if (sharedDetector) {
    return sharedDetector;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
      minPoseScore: 0.25
    }
  ).then(detector => {
    sharedDetector = detector;
    initializationPromise = null;
    console.log('Shared pose detector initialized');
    return detector;
  }).catch(error => {
    console.error('Failed to initialize shared pose detector:', error);
    initializationPromise = null;
    throw error;
  });

  return initializationPromise;
}

export function disposeSharedDetector(): void {
  if (sharedDetector) {
    console.log('Disposing shared pose detector');
    sharedDetector.dispose();
    sharedDetector = null;
    initializationPromise = null;
  }
}