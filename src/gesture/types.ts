export interface PoseFrame {
  keypoints: Array<{
    x: number;
    y: number;
    score: number;
    name?: string;
  }>;
  timestamp: number;
}

export interface GestureEngineConfig {
  velocityMin: number;
  displacementMin: number;
  holdMs: number;
  arming?: boolean;
  armingGesture?: string;
  smoothingAlpha: number;
  confidenceThreshold: number;
  windowSizeMs: number;
  strideMs: number;
}

export interface GestureEvent {
  label: string;
  confidence: number;
  timestamp: number;
}

export interface FeatureVector {
  values: Float32Array;
  timestamp: number;
  label?: string;
}

export interface TrainingData {
  idleSamples: PoseFrame[];
  gestureSamples: Record<string, PoseFrame[]>;
}

export interface GestureProfile {
  name: string;
  gestures: string[];
  modelWeights?: any;
  scaler?: {
    mean: Float32Array;
    std: Float32Array;
  };
  config: GestureEngineConfig;
  createdAt: number;
  updatedAt: number;
}

export interface WindowedFeatures {
  features: Float32Array;
  startTime: number;
  endTime: number;
}

export interface ClassifierResult {
  label: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface RuleFilterResult {
  pass: boolean;
  reason?: string;
  metrics?: {
    velocity: number;
    displacement: number;
    holdDuration: number;
  };
}