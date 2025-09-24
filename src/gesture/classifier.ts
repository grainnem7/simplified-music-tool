import * as tf from '@tensorflow/tfjs';
import { WindowedFeatures, ClassifierResult, TrainingData, PoseFrame } from './types';
import { FeatureExtractor } from './features';

export class GestureClassifier {
  private model: tf.LayersModel | null = null;
  private labelEncoder: Map<string, number> = new Map();
  private labelDecoder: Map<number, string> = new Map();
  private scaler: { mean: Float32Array; std: Float32Array } | null = null;
  private featureExtractor: FeatureExtractor;
  private numFeatures: number = 0;

  constructor(featureExtractor: FeatureExtractor) {
    this.featureExtractor = featureExtractor;
  }

  async train(trainingData: TrainingData): Promise<void> {
    console.log('Starting gesture classifier training...');

    // Extract features from training data
    const { features, labels } = this.prepareTrainingData(trainingData);

    if (features.length === 0) {
      throw new Error('No valid training samples found');
    }

    // Fit scaler
    this.fitScaler(features);

    // Scale features
    const scaledFeatures = this.scaleFeatures(features);

    // Encode labels
    const encodedLabels = this.encodeLabels(labels);

    // Create and train model
    await this.createAndTrainModel(scaledFeatures, encodedLabels);

    console.log('Training completed');
  }

  private prepareTrainingData(trainingData: TrainingData): {
    features: Float32Array[];
    labels: string[];
  } {
    const features: Float32Array[] = [];
    const labels: string[] = [];

    // Process idle samples as "Other" class
    const idleWindows = this.extractWindows(trainingData.idleSamples);
    for (const window of idleWindows) {
      features.push(window.features);
      labels.push('Other');
    }

    // Process gesture samples
    for (const [gestureName, samples] of Object.entries(trainingData.gestureSamples)) {
      const windows = this.extractWindows(samples);
      for (const window of windows) {
        features.push(window.features);
        labels.push(gestureName);
      }
    }

    return { features, labels };
  }

  private extractWindows(frames: PoseFrame[]): WindowedFeatures[] {
    const windows: WindowedFeatures[] = [];
    this.featureExtractor.reset();

    for (const frame of frames) {
      const window = this.featureExtractor.addFrame(frame);
      if (window) {
        windows.push(window);
      }
    }

    return windows;
  }

  private fitScaler(features: Float32Array[]): void {
    if (features.length === 0) return;

    const numFeatures = features[0].length;
    this.numFeatures = numFeatures;

    const mean = new Float32Array(numFeatures);
    const std = new Float32Array(numFeatures);

    // Calculate mean
    for (let i = 0; i < numFeatures; i++) {
      let sum = 0;
      for (const feature of features) {
        sum += feature[i];
      }
      mean[i] = sum / features.length;
    }

    // Calculate standard deviation
    for (let i = 0; i < numFeatures; i++) {
      let sumSquaredDiff = 0;
      for (const feature of features) {
        const diff = feature[i] - mean[i];
        sumSquaredDiff += diff * diff;
      }
      std[i] = Math.sqrt(sumSquaredDiff / features.length);
      // Avoid division by zero
      if (std[i] < 1e-8) std[i] = 1;
    }

    this.scaler = { mean, std };
  }

  private scaleFeatures(features: Float32Array[]): Float32Array[] {
    if (!this.scaler) return features;

    return features.map(feature => {
      const scaled = new Float32Array(feature.length);
      for (let i = 0; i < feature.length; i++) {
        scaled[i] = (feature[i] - this.scaler!.mean[i]) / this.scaler!.std[i];
      }
      return scaled;
    });
  }

  private encodeLabels(labels: string[]): number[] {
    const uniqueLabels = Array.from(new Set(labels));

    // Create encoder/decoder
    this.labelEncoder.clear();
    this.labelDecoder.clear();

    uniqueLabels.forEach((label, index) => {
      this.labelEncoder.set(label, index);
      this.labelDecoder.set(index, label);
    });

    return labels.map(label => this.labelEncoder.get(label)!);
  }

  private async createAndTrainModel(
    features: Float32Array[],
    labels: number[]
  ): Promise<void> {
    const numClasses = this.labelDecoder.size;
    const numFeatures = features[0].length;

    // Convert to tensors
    const xTensor = tf.tensor2d(features.map(f => Array.from(f)));
    const yTensor = tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);

    // Create model architecture
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [numFeatures],
          units: 64,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: numClasses,
          activation: 'softmax',
          kernelInitializer: 'glorotNormal'
        })
      ]
    });

    // Compile model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    // Train model
    await this.model.fit(xTensor, yTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, ` +
                       `accuracy = ${logs?.acc.toFixed(4)}`);
          }
        }
      }
    });

    // Clean up tensors
    xTensor.dispose();
    yTensor.dispose();
  }

  async predict(windowedFeatures: WindowedFeatures): Promise<ClassifierResult> {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained');
    }

    // Scale features
    const scaled = new Float32Array(windowedFeatures.features.length);
    for (let i = 0; i < windowedFeatures.features.length; i++) {
      scaled[i] = (windowedFeatures.features[i] - this.scaler.mean[i]) / this.scaler.std[i];
    }

    // Predict
    const input = tf.tensor2d([Array.from(scaled)]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const probabilities = await prediction.array() as number[][];

    // Clean up tensors
    input.dispose();
    prediction.dispose();

    // Find best class
    const probs = probabilities[0];
    let maxProb = 0;
    let maxIdx = 0;

    const probabilityMap: Record<string, number> = {};

    for (let i = 0; i < probs.length; i++) {
      const label = this.labelDecoder.get(i)!;
      probabilityMap[label] = probs[i];

      if (probs[i] > maxProb) {
        maxProb = probs[i];
        maxIdx = i;
      }
    }

    return {
      label: this.labelDecoder.get(maxIdx)!,
      confidence: maxProb,
      probabilities: probabilityMap
    };
  }

  getModelWeights(): any {
    if (!this.model) return null;

    return this.model.getWeights().map(w => ({
      data: Array.from(w.dataSync()),
      shape: w.shape
    }));
  }

  async setModelWeights(weights: any): Promise<void> {
    if (!weights) return;

    // Recreate model architecture
    const numClasses = weights[weights.length - 1].shape[1]; // Last layer output size
    const numFeatures = weights[0].shape[0]; // First layer input size

    this.numFeatures = numFeatures;

    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [numFeatures],
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: numClasses,
          activation: 'softmax'
        })
      ]
    });

    // Set weights
    const tensorWeights = weights.map((w: any) =>
      tf.tensor(w.data, w.shape)
    );

    this.model.setWeights(tensorWeights);

    // Compile model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    // Clean up tensors
    tensorWeights.forEach((t: tf.Tensor) => t.dispose());
  }

  setLabels(encoder: Map<string, number>, decoder: Map<number, string>): void {
    this.labelEncoder = new Map(encoder);
    this.labelDecoder = new Map(decoder);
  }

  getLabels(): { encoder: Map<string, number>; decoder: Map<number, string> } {
    return {
      encoder: new Map(this.labelEncoder),
      decoder: new Map(this.labelDecoder)
    };
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}