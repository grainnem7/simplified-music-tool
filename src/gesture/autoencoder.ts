import * as tf from '@tensorflow/tfjs';
import { WindowedFeatures } from './types';

export class AutoencoderGate {
  private model: tf.LayersModel | null = null;
  private threshold: number = 0.1;
  private scaler: { mean: Float32Array; std: Float32Array } | null = null;

  async train(positiveFeatures: Float32Array[]): Promise<void> {
    if (positiveFeatures.length === 0) {
      throw new Error('No positive samples provided for autoencoder training');
    }

    console.log('Training autoencoder gate...');

    // Fit scaler
    this.fitScaler(positiveFeatures);

    // Scale features
    const scaledFeatures = this.scaleFeatures(positiveFeatures);

    // Create and train autoencoder
    await this.createAndTrainAutoencoder(scaledFeatures);

    // Calculate reconstruction threshold
    await this.calculateThreshold(scaledFeatures);

    console.log('Autoencoder training completed');
  }

  private fitScaler(features: Float32Array[]): void {
    const numFeatures = features[0].length;
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

  private async createAndTrainAutoencoder(features: Float32Array[]): Promise<void> {
    const inputDim = features[0].length;
    const encodingDim = Math.floor(inputDim / 4); // Compress to 1/4 size

    // Create autoencoder model
    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [inputDim],
          units: Math.floor(inputDim / 2),
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dense({
          units: encodingDim,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        })
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [encodingDim],
          units: Math.floor(inputDim / 2),
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        tf.layers.dense({
          units: inputDim,
          activation: 'linear',
          kernelInitializer: 'glorotNormal'
        })
      ]
    });

    // Combine encoder and decoder
    const input = tf.input({ shape: [inputDim] });
    const encoded = encoder.apply(input) as tf.SymbolicTensor;
    const decoded = decoder.apply(encoded) as tf.SymbolicTensor;

    this.model = tf.model({ inputs: input, outputs: decoded });

    // Compile model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    // Prepare data
    const xTensor = tf.tensor2d(features.map(f => Array.from(f)));

    // Train
    await this.model.fit(xTensor, xTensor, {
      epochs: 30,
      batchSize: 32,
      validationSplit: 0.1,
      shuffle: true,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Autoencoder epoch ${epoch}: loss = ${logs?.loss.toFixed(6)}`);
          }
        }
      }
    });

    // Clean up
    xTensor.dispose();
    encoder.dispose();
    decoder.dispose();
  }

  private async calculateThreshold(features: Float32Array[]): Promise<void> {
    if (!this.model) return;

    // Calculate reconstruction errors on training data
    const errors: number[] = [];

    for (const feature of features) {
      const error = await this.getReconstructionError(feature);
      errors.push(error);
    }

    // Set threshold as mean + 2 * std of reconstruction errors
    const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
    const variance = errors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / errors.length;
    const std = Math.sqrt(variance);

    this.threshold = mean + 2 * std;
    console.log(`Autoencoder threshold set to: ${this.threshold.toFixed(6)}`);
  }

  private async getReconstructionError(feature: Float32Array): Promise<number> {
    if (!this.model || !this.scaler) return Infinity;

    // Scale feature
    const scaled = new Float32Array(feature.length);
    for (let i = 0; i < feature.length; i++) {
      scaled[i] = (feature[i] - this.scaler.mean[i]) / this.scaler.std[i];
    }

    // Reconstruct
    const input = tf.tensor2d([Array.from(scaled)]);
    const reconstructed = this.model.predict(input) as tf.Tensor;
    const reconstructedArray = await reconstructed.array() as number[][];

    // Calculate MSE
    let error = 0;
    for (let i = 0; i < scaled.length; i++) {
      const diff = scaled[i] - reconstructedArray[0][i];
      error += diff * diff;
    }
    error /= scaled.length;

    // Clean up
    input.dispose();
    reconstructed.dispose();

    return error;
  }

  async gate(windowedFeatures: WindowedFeatures): Promise<boolean> {
    if (!this.model || !this.scaler) {
      // If not trained, always pass
      return true;
    }

    const error = await this.getReconstructionError(windowedFeatures.features);
    return error <= this.threshold;
  }

  getModelWeights(): any {
    if (!this.model) return null;

    return {
      weights: this.model.getWeights().map(w => ({
        data: Array.from(w.dataSync()),
        shape: w.shape
      })),
      threshold: this.threshold
    };
  }

  async setModelWeights(data: any): Promise<void> {
    if (!data || !data.weights) return;

    // Recreate model
    const inputDim = data.weights[0].shape[0];
    const encodingDim = data.weights[1].shape[1];

    const encoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [inputDim],
          units: data.weights[0].shape[1],
          activation: 'relu'
        }),
        tf.layers.dense({
          units: encodingDim,
          activation: 'relu'
        })
      ]
    });

    const decoder = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [encodingDim],
          units: data.weights[2].shape[1],
          activation: 'relu'
        }),
        tf.layers.dense({
          units: inputDim,
          activation: 'linear'
        })
      ]
    });

    const input = tf.input({ shape: [inputDim] });
    const encoded = encoder.apply(input) as tf.SymbolicTensor;
    const decoded = decoder.apply(encoded) as tf.SymbolicTensor;

    this.model = tf.model({ inputs: input, outputs: decoded });

    // Set weights
    const tensorWeights = data.weights.map((w: any) =>
      tf.tensor(w.data, w.shape)
    );
    this.model.setWeights(tensorWeights);

    // Compile
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });

    // Set threshold
    this.threshold = data.threshold;

    // Clean up
    tensorWeights.forEach((t: tf.Tensor) => t.dispose());
    encoder.dispose();
    decoder.dispose();
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}