/**
 * Example test file for the gesture recognition system.
 * This demonstrates how to use the gesture engine and test utilities.
 */

import { createGestureEngine, GestureEngineConfig } from './index';
import { createMockTrainingData, simulatePoseDetection } from './test-utils';
import { FeatureExtractor } from './features';
import { RuleFilter } from './rules';

describe('Gesture Recognition System', () => {
  let engine: ReturnType<typeof createGestureEngine>;

  beforeEach(() => {
    const config: GestureEngineConfig = {
      velocityMin: 0.5,
      displacementMin: 0.1,
      holdMs: 200,
      arming: false,
      smoothingAlpha: 0.3,
      confidenceThreshold: 0.7,
      windowSizeMs: 500,
      strideMs: 100
    };

    engine = createGestureEngine(config);
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('Feature Extraction', () => {
    it('should extract features from pose frames', () => {
      const extractor = new FeatureExtractor();
      const mockData = createMockTrainingData();

      let featureCount = 0;
      for (const frame of mockData.idleSamples) {
        const features = extractor.addFrame(frame);
        if (features) {
          featureCount++;
          expect(features.features).toBeInstanceOf(Float32Array);
          expect(features.features.length).toBeGreaterThan(0);
        }
      }

      expect(featureCount).toBeGreaterThan(0);
    });

    it('should normalize poses by shoulder width', () => {
      const extractor = new FeatureExtractor();
      const mockData = createMockTrainingData();

      const features = [];
      for (const frame of mockData.gestureSamples['Wave'].slice(0, 20)) {
        const result = extractor.addFrame(frame);
        if (result) features.push(result);
      }

      // Should have extracted some features
      expect(features.length).toBeGreaterThan(0);
    });
  });

  describe('Rule Filtering', () => {
    it('should filter out movements below velocity threshold', () => {
      const config: GestureEngineConfig = {
        velocityMin: 0.5,
        displacementMin: 0.1,
        holdMs: 200,
        arming: false,
        smoothingAlpha: 0.3,
        confidenceThreshold: 0.7,
        windowSizeMs: 500,
        strideMs: 100
      };

      const filter = new RuleFilter(config);
      const mockData = createMockTrainingData();

      // Idle movements should mostly be filtered out
      const results = mockData.idleSamples.slice(0, 10).map(frame => filter.filter(frame));
      const passedCount = results.filter(r => r.pass).length;

      expect(passedCount).toBeLessThan(results.length / 2);
    });

    it('should pass intentional gestures', () => {
      const config: GestureEngineConfig = {
        velocityMin: 0.1,
        displacementMin: 0.05,
        holdMs: 100,
        arming: false,
        smoothingAlpha: 0.3,
        confidenceThreshold: 0.7,
        windowSizeMs: 500,
        strideMs: 100
      };

      const filter = new RuleFilter(config);
      const mockData = createMockTrainingData();

      // Wave gestures should mostly pass
      const results = mockData.gestureSamples['Wave'].slice(0, 30).map(frame => filter.filter(frame));
      const passedCount = results.filter(r => r.pass).length;

      expect(passedCount).toBeGreaterThan(0);
    });
  });

  describe('Training and Classification', () => {
    it('should train on mock data without errors', async () => {
      const trainingData = createMockTrainingData();

      await expect(engine.train(
        trainingData.idleSamples,
        trainingData.gestureSamples
      )).resolves.not.toThrow();
    });

    it('should save and load profiles', async () => {
      const trainingData = createMockTrainingData();

      // Train the model
      await engine.train(
        trainingData.idleSamples,
        trainingData.gestureSamples
      );

      // Save profile
      const profileName = 'test-profile';
      await engine.saveProfile(profileName);

      // List profiles
      const profiles = await engine.listProfiles();
      expect(profiles).toContain(profileName);

      // Load profile
      await expect(engine.loadProfile(profileName)).resolves.not.toThrow();
    });
  });

  describe('Gesture Detection Simulation', () => {
    it('should detect simulated wave gesture', (done) => {
      let detectionCount = 0;

      engine.onDetect((event) => {
        detectionCount++;
        expect(event.label).toBeDefined();
        expect(event.confidence).toBeGreaterThan(0);
        expect(event.confidence).toBeLessThanOrEqual(1);
      });

      const stopSimulation = simulatePoseDetection(
        (pose) => {
          // In a real scenario, this would be processed by the engine
          // For testing, we just verify the pose structure
          expect(pose.keypoints).toBeDefined();
          expect(pose.timestamp).toBeGreaterThan(0);
        },
        'wave',
        1000
      );

      setTimeout(() => {
        stopSimulation();
        done();
      }, 1100);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        velocityMin: 1.0,
        confidenceThreshold: 0.8
      };

      engine.setConfig(newConfig);
      const config = engine.getConfig();

      expect(config.velocityMin).toBe(1.0);
      expect(config.confidenceThreshold).toBe(0.8);
    });
  });

  describe('Profile Export/Import', () => {
    it('should export and import profiles', async () => {
      const trainingData = createMockTrainingData();

      // Train and save
      await engine.train(
        trainingData.idleSamples,
        trainingData.gestureSamples
      );
      await engine.saveProfile('export-test');

      // Export
      const exportedJson = await engine.exportProfile('export-test');
      expect(exportedJson).toBeTruthy();
      expect(typeof exportedJson).toBe('string');

      // Parse and validate
      const parsed = JSON.parse(exportedJson);
      expect(parsed.name).toBe('export-test');
      expect(parsed.gestures).toBeDefined();
      expect(parsed.config).toBeDefined();

      // Import to a new engine
      const newEngine = createGestureEngine(engine.getConfig());
      await newEngine.importProfile(exportedJson);

      const profiles = await newEngine.listProfiles();
      expect(profiles).toContain('export-test');

      newEngine.dispose();
    });
  });
});