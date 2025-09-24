import * as tf from '@tensorflow/tfjs';
import { PoseDetector } from '@tensorflow-models/pose-detection';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {
  GestureEngineConfig,
  GestureEvent,
  PoseFrame,
  TrainingData,
  GestureProfile
} from './types';
import { FeatureExtractor } from './features';
import { RuleFilter } from './rules';
import { GestureClassifier } from './classifier';
import { AutoencoderGate } from './autoencoder';
import { ProfileManager } from './profiles';

export interface GestureEngine {
  start(stream: MediaStream, gestures: string[]): Promise<void>;
  stop(): void;
  onDetect(cb: (event: GestureEvent) => void): void;
  train(idleSamples: PoseFrame[], gestureSamples: Record<string, PoseFrame[]>): Promise<void>;
  saveProfile(name: string): Promise<void>;
  loadProfile(name: string): Promise<void>;
  listProfiles(): Promise<string[]>;
  exportProfile(name: string): Promise<string>;
  importProfile(jsonData: string): Promise<void>;
  setConfig(config: Partial<GestureEngineConfig>): void;
  getConfig(): GestureEngineConfig;
  dispose(): void;
}

class GestureEngineImpl implements GestureEngine {
  private config: GestureEngineConfig;
  private featureExtractor: FeatureExtractor;
  private ruleFilter: RuleFilter;
  private classifier: GestureClassifier;
  private autoencoderGate?: AutoencoderGate;
  private profileManager: ProfileManager;
  private poseDetector?: PoseDetector;
  private detectionCallbacks: Array<(event: GestureEvent) => void> = [];
  private isRunning = false;
  private animationFrameId?: number;
  private currentGestures: string[] = [];
  private videoElement?: HTMLVideoElement;
  private worker?: Worker;
  private useAutoencoder = false;

  constructor(config: GestureEngineConfig) {
    this.config = config;
    this.featureExtractor = new FeatureExtractor(
      config.windowSizeMs,
      config.strideMs,
      config.smoothingAlpha
    );
    this.ruleFilter = new RuleFilter(config);
    this.classifier = new GestureClassifier(this.featureExtractor);
    this.profileManager = new ProfileManager();

    if (this.useAutoencoder) {
      this.autoencoderGate = new AutoencoderGate();
    }

    // Initialize TensorFlow.js backend
    this.initializeTensorFlow();
  }

  private async initializeTensorFlow(): Promise<void> {
    await tf.ready();
    // Set backend to WebGL for better performance
    await tf.setBackend('webgl');
  }

  async start(stream: MediaStream, gestures: string[]): Promise<void> {
    if (this.isRunning) {
      console.warn('Gesture engine is already running');
      return;
    }

    this.currentGestures = gestures;

    // Create video element for pose detection
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = stream;
    this.videoElement.width = 640;
    this.videoElement.height = 480;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;

    // Wait for video to be ready
    await new Promise((resolve) => {
      this.videoElement!.onloadedmetadata = resolve;
    });

    // Initialize pose detector
    if (!this.poseDetector) {
      this.poseDetector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.25
        }
      );
    }

    // Initialize worker if not already done
    if (!this.worker && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('./poseWorker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = (e) => {
          if (e.data.type === 'features' && e.data.data) {
            this.processFeatures(e.data.data);
          }
        };

        this.worker.postMessage({
          type: 'init',
          data: { config: this.config }
        });
      } catch (error) {
        console.warn('Failed to initialize worker, using main thread:', error);
      }
    }

    this.isRunning = true;
    this.detectPoses();
  }

  private async detectPoses(): Promise<void> {
    if (!this.isRunning || !this.videoElement || !this.poseDetector) {
      return;
    }

    try {
      // Detect poses
      const poses = await this.poseDetector.estimatePoses(this.videoElement);

      if (poses.length > 0) {
        const pose = poses[0];

        // Convert to our PoseFrame format
        const frame: PoseFrame = {
          keypoints: pose.keypoints.map(kp => ({
            x: kp.x / this.videoElement!.width,
            y: kp.y / this.videoElement!.height,
            score: kp.score || 0,
            name: kp.name
          })),
          timestamp: Date.now()
        };

        // Process in worker if available, otherwise process locally
        if (this.worker) {
          this.worker.postMessage({
            type: 'processPose',
            data: { pose: frame }
          });
        } else {
          this.processPoseFrame(frame);
        }
      }
    } catch (error) {
      console.error('Error detecting poses:', error);
    }

    // Schedule next detection
    this.animationFrameId = requestAnimationFrame(() => this.detectPoses());
  }

  private processPoseFrame(frame: PoseFrame): void {
    // Apply rule-based filtering
    const ruleResult = this.ruleFilter.filter(frame);

    if (!ruleResult.pass) {
      return;
    }

    // Extract features
    const windowedFeatures = this.featureExtractor.addFrame(frame);

    if (windowedFeatures) {
      this.processFeatures(windowedFeatures);
    }
  }

  private async processFeatures(windowedFeatures: any): Promise<void> {
    try {
      // Apply autoencoder gate if enabled
      if (this.autoencoderGate && this.useAutoencoder) {
        const pass = await this.autoencoderGate.gate(windowedFeatures);
        if (!pass) {
          return;
        }
      }

      // Classify gesture
      const result = await this.classifier.predict(windowedFeatures);

      // Check if it's an intentional gesture (not "Other")
      if (result.label !== 'Other' &&
          result.confidence >= this.config.confidenceThreshold &&
          this.currentGestures.includes(result.label)) {

        const event: GestureEvent = {
          label: result.label,
          confidence: result.confidence,
          timestamp: Date.now()
        };

        // Notify all listeners
        this.detectionCallbacks.forEach(cb => cb(event));
      }
    } catch (error) {
      console.error('Error processing features:', error);
    }
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    if (this.videoElement) {
      const stream = this.videoElement.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      this.videoElement.srcObject = null;
      this.videoElement = undefined;
    }

    if (this.worker) {
      this.worker.postMessage({ type: 'reset' });
    }

    this.featureExtractor.reset();
    this.ruleFilter.reset();
  }

  onDetect(cb: (event: GestureEvent) => void): void {
    this.detectionCallbacks.push(cb);
  }

  async train(
    idleSamples: PoseFrame[],
    gestureSamples: Record<string, PoseFrame[]>
  ): Promise<void> {
    const trainingData: TrainingData = {
      idleSamples,
      gestureSamples
    };

    // Train classifier
    await this.classifier.train(trainingData);

    // Train autoencoder if enabled
    if (this.autoencoderGate && this.useAutoencoder) {
      // Collect all positive samples (gestures)
      const positiveSamples: PoseFrame[] = [];
      for (const samples of Object.values(gestureSamples)) {
        positiveSamples.push(...samples);
      }

      // Extract features for autoencoder
      const features: Float32Array[] = [];
      for (const frame of positiveSamples) {
        const window = this.featureExtractor.addFrame(frame);
        if (window) {
          features.push(window.features);
        }
      }

      if (features.length > 0) {
        await this.autoencoderGate.train(features);
      }
    }

    this.currentGestures = Object.keys(gestureSamples);
  }

  async saveProfile(name: string): Promise<void> {
    const profile: GestureProfile = {
      name,
      gestures: this.currentGestures,
      config: this.config,
      modelWeights: {
        classifier: this.classifier.getModelWeights(),
        autoencoder: this.autoencoderGate?.getModelWeights(),
        labels: {
          encoder: Array.from(this.classifier.getLabels().encoder.entries()),
          decoder: Array.from(this.classifier.getLabels().decoder.entries())
        }
      },
      scaler: this.classifier['scaler'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.profileManager.saveProfile(profile);
  }

  async loadProfile(name: string): Promise<void> {
    const profile = await this.profileManager.loadProfile(name);

    if (!profile) {
      throw new Error(`Profile "${name}" not found`);
    }

    // Update config
    this.config = profile.config;
    this.featureExtractor = new FeatureExtractor(
      profile.config.windowSizeMs,
      profile.config.strideMs,
      profile.config.smoothingAlpha
    );
    this.ruleFilter = new RuleFilter(profile.config);

    // Load model weights
    if (profile.modelWeights) {
      if (profile.modelWeights.classifier) {
        await this.classifier.setModelWeights(profile.modelWeights.classifier);
      }

      if (profile.modelWeights.labels) {
        const encoder = new Map(profile.modelWeights.labels.encoder);
        const decoder = new Map(profile.modelWeights.labels.decoder);
        this.classifier.setLabels(encoder, decoder);
      }

      if (profile.modelWeights.autoencoder && this.autoencoderGate) {
        await this.autoencoderGate.setModelWeights(profile.modelWeights.autoencoder);
      }
    }

    // Set scaler
    if (profile.scaler) {
      this.classifier['scaler'] = profile.scaler;
    }

    this.currentGestures = profile.gestures;

    console.log(`Profile "${name}" loaded`);
  }

  async listProfiles(): Promise<string[]> {
    return this.profileManager.listProfiles();
  }

  async exportProfile(name: string): Promise<string> {
    return this.profileManager.exportProfile(name);
  }

  async importProfile(jsonData: string): Promise<void> {
    const profileName = await this.profileManager.importProfile(jsonData);
    await this.loadProfile(profileName);
  }

  setConfig(config: Partial<GestureEngineConfig>): void {
    this.config = { ...this.config, ...config };

    // Update components with new config
    this.ruleFilter = new RuleFilter(this.config);

    if (config.windowSizeMs || config.strideMs || config.smoothingAlpha) {
      this.featureExtractor = new FeatureExtractor(
        this.config.windowSizeMs,
        this.config.strideMs,
        this.config.smoothingAlpha
      );
    }

    if (this.worker) {
      this.worker.postMessage({
        type: 'updateConfig',
        data: { config: this.config }
      });
    }
  }

  getConfig(): GestureEngineConfig {
    return { ...this.config };
  }

  dispose(): void {
    this.stop();

    if (this.poseDetector) {
      this.poseDetector.dispose();
      this.poseDetector = undefined;
    }

    this.classifier.dispose();

    if (this.autoencoderGate) {
      this.autoencoderGate.dispose();
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
    }

    this.profileManager.close();
    this.detectionCallbacks = [];
  }
}

export function createGestureEngine(config: GestureEngineConfig): GestureEngine {
  return new GestureEngineImpl(config);
}

export * from './types';