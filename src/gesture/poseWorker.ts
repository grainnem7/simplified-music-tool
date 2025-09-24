// Web Worker for pose processing and gesture detection
import { PoseFrame, WindowedFeatures, GestureEngineConfig } from './types';

interface WorkerMessage {
  type: 'init' | 'processPose' | 'train' | 'reset' | 'updateConfig';
  data?: any;
}

interface WorkerResponse {
  type: 'ready' | 'gesture' | 'trained' | 'error' | 'features';
  data?: any;
}

class PoseProcessor {
  private config: GestureEngineConfig;
  private featureBuffer: WindowedFeatures[] = [];
  private isProcessing = false;

  constructor() {
    this.config = {
      velocityMin: 0.5,
      displacementMin: 0.1,
      holdMs: 200,
      arming: false,
      smoothingAlpha: 0.3,
      confidenceThreshold: 0.7,
      windowSizeMs: 500,
      strideMs: 100
    };
  }

  init(config: GestureEngineConfig): void {
    this.config = { ...this.config, ...config };
    this.featureBuffer = [];
  }

  processPose(pose: any): WindowedFeatures | null {
    if (this.isProcessing) return null;

    this.isProcessing = true;

    try {
      // Convert pose to our PoseFrame format
      const frame: PoseFrame = {
        keypoints: pose.keypoints.map((kp: any) => ({
          x: kp.x,
          y: kp.y,
          score: kp.score || kp.confidence || 0,
          name: kp.name || kp.part
        })),
        timestamp: Date.now()
      };

      // Extract features (simplified version for worker)
      const features = this.extractBasicFeatures(frame);

      if (features) {
        this.featureBuffer.push(features);
        // Keep only recent features
        const cutoff = Date.now() - 1000;
        this.featureBuffer = this.featureBuffer.filter(f => f.endTime > cutoff);
      }

      return features;
    } finally {
      this.isProcessing = false;
    }
  }

  private extractBasicFeatures(frame: PoseFrame): WindowedFeatures | null {
    // Simplified feature extraction for worker
    const features: number[] = [];

    // Extract basic position features for key joints
    const keyJoints = ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow'];

    for (const jointName of keyJoints) {
      const joint = frame.keypoints.find(kp => kp.name === jointName);

      if (joint && joint.score > 0.3) {
        features.push(joint.x, joint.y);
      } else {
        features.push(0, 0);
      }
    }

    // Add normalized center of mass
    const validKeypoints = frame.keypoints.filter(kp => kp.score > 0.3);
    if (validKeypoints.length > 0) {
      const centerX = validKeypoints.reduce((sum, kp) => sum + kp.x, 0) / validKeypoints.length;
      const centerY = validKeypoints.reduce((sum, kp) => sum + kp.y, 0) / validKeypoints.length;
      features.push(centerX, centerY);
    } else {
      features.push(0.5, 0.5);
    }

    // Add timestamp feature
    features.push(frame.timestamp / 1000000); // Normalize timestamp

    return {
      features: new Float32Array(features),
      startTime: frame.timestamp,
      endTime: frame.timestamp
    };
  }

  reset(): void {
    this.featureBuffer = [];
    this.isProcessing = false;
  }

  updateConfig(config: Partial<GestureEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Worker initialization
const processor = new PoseProcessor();

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case 'init':
        processor.init(data.config);
        self.postMessage({
          type: 'ready'
        } as WorkerResponse);
        break;

      case 'processPose':
        const features = processor.processPose(data.pose);
        if (features) {
          self.postMessage({
            type: 'features',
            data: features
          } as WorkerResponse);
        }
        break;

      case 'reset':
        processor.reset();
        break;

      case 'updateConfig':
        processor.updateConfig(data.config);
        break;

      default:
        self.postMessage({
          type: 'error',
          data: `Unknown message type: ${type}`
        } as WorkerResponse);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error'
    } as WorkerResponse);
  }
});

export {};