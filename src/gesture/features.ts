import { PoseFrame, WindowedFeatures } from './types';

export class FeatureExtractor {
  private windowSizeMs: number;
  private strideMs: number;
  private smoothingAlpha: number;
  private previousKeypoints: Map<string, { x: number; y: number }> = new Map();
  private windowBuffer: PoseFrame[] = [];

  constructor(windowSizeMs = 500, strideMs = 100, smoothingAlpha = 0.3) {
    this.windowSizeMs = windowSizeMs;
    this.strideMs = strideMs;
    this.smoothingAlpha = smoothingAlpha;
  }

  addFrame(frame: PoseFrame): WindowedFeatures | null {
    this.windowBuffer.push(frame);

    // Clean old frames
    const cutoffTime = frame.timestamp - this.windowSizeMs;
    this.windowBuffer = this.windowBuffer.filter(f => f.timestamp > cutoffTime);

    // Check if we have enough frames for a window
    if (this.windowBuffer.length < 5) {
      return null;
    }

    const oldestFrame = this.windowBuffer[0];
    const timeDiff = frame.timestamp - oldestFrame.timestamp;

    if (timeDiff >= this.strideMs) {
      return this.extractWindowFeatures(this.windowBuffer);
    }

    return null;
  }

  private extractWindowFeatures(window: PoseFrame[]): WindowedFeatures {
    const features: number[] = [];

    // Normalize poses by shoulder width
    const normalizedWindow = window.map(frame => this.normalizePose(frame));

    // Extract per-joint features
    const jointNames = ['nose', 'left_wrist', 'right_wrist', 'left_elbow', 'right_elbow',
                        'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];

    for (const jointName of jointNames) {
      const jointFeatures = this.extractJointFeatures(normalizedWindow, jointName);
      features.push(...jointFeatures);
    }

    // Extract angle features
    const angleFeatures = this.extractAngleFeatures(normalizedWindow);
    features.push(...angleFeatures);

    // Extract global features
    const globalFeatures = this.extractGlobalFeatures(normalizedWindow);
    features.push(...globalFeatures);

    return {
      features: new Float32Array(features),
      startTime: window[0].timestamp,
      endTime: window[window.length - 1].timestamp
    };
  }

  private normalizePose(frame: PoseFrame): PoseFrame {
    const leftShoulder = frame.keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = frame.keypoints.find(kp => kp.name === 'right_shoulder');

    if (!leftShoulder || !rightShoulder || leftShoulder.score < 0.3 || rightShoulder.score < 0.3) {
      return frame;
    }

    const shoulderWidth = Math.sqrt(
      Math.pow(rightShoulder.x - leftShoulder.x, 2) +
      Math.pow(rightShoulder.y - leftShoulder.y, 2)
    );

    if (shoulderWidth < 0.01) return frame;

    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const centerY = (leftShoulder.y + rightShoulder.y) / 2;

    return {
      ...frame,
      keypoints: frame.keypoints.map(kp => ({
        ...kp,
        x: (kp.x - centerX) / shoulderWidth,
        y: (kp.y - centerY) / shoulderWidth
      }))
    };
  }

  private extractJointFeatures(window: PoseFrame[], jointName: string): number[] {
    const features: number[] = [];
    const positions = window.map(frame => {
      const kp = frame.keypoints.find(k => k.name === jointName);
      return kp && kp.score > 0.3 ? { x: kp.x, y: kp.y, t: frame.timestamp } : null;
    }).filter(p => p !== null) as Array<{ x: number; y: number; t: number }>;

    if (positions.length < 2) {
      return Array(12).fill(0);
    }

    // Position statistics
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    features.push(this.mean(xs), this.std(xs), this.mean(ys), this.std(ys));

    // Velocity statistics
    const velocities = this.calculateVelocities(positions);
    features.push(this.mean(velocities), this.std(velocities), Math.max(...velocities));

    // Acceleration
    const accelerations = this.calculateAccelerations(positions);
    features.push(this.mean(accelerations), this.std(accelerations));

    // Path length and smoothness
    const pathLength = this.calculatePathLength(positions);
    const smoothness = this.calculateSmoothness(positions);
    features.push(pathLength, smoothness);

    // Direction change count
    const directionChanges = this.countDirectionChanges(positions);
    features.push(directionChanges);

    return features;
  }

  private extractAngleFeatures(window: PoseFrame[]): number[] {
    const features: number[] = [];

    // Calculate elbow angles
    const leftElbowAngles = window.map(frame => this.calculateElbowAngle(frame, 'left'));
    const rightElbowAngles = window.map(frame => this.calculateElbowAngle(frame, 'right'));

    features.push(
      this.mean(leftElbowAngles), this.std(leftElbowAngles),
      this.mean(rightElbowAngles), this.std(rightElbowAngles)
    );

    // Calculate shoulder angles
    const shoulderAngles = window.map(frame => this.calculateShoulderAngle(frame));
    features.push(this.mean(shoulderAngles), this.std(shoulderAngles));

    // Head tilt
    const headTilts = window.map(frame => this.calculateHeadTilt(frame));
    features.push(this.mean(headTilts), this.std(headTilts));

    return features;
  }

  private extractGlobalFeatures(window: PoseFrame[]): number[] {
    const features: number[] = [];

    // Center of mass movement
    const centerOfMass = window.map(frame => this.calculateCenterOfMass(frame));
    const comVelocities = this.calculateVelocities(centerOfMass.map((com, i) => ({
      ...com,
      t: window[i].timestamp
    })));

    features.push(this.mean(comVelocities), this.std(comVelocities));

    // Pose stability (inverse of variance)
    const stability = this.calculatePoseStability(window);
    features.push(stability);

    // Total energy (sum of all joint velocities)
    const energy = this.calculateTotalEnergy(window);
    features.push(energy);

    return features;
  }

  private calculateVelocities(positions: Array<{ x: number; y: number; t: number }>): number[] {
    const velocities: number[] = [];

    for (let i = 1; i < positions.length; i++) {
      const dt = (positions[i].t - positions[i - 1].t) / 1000; // Convert to seconds
      if (dt > 0) {
        const dx = positions[i].x - positions[i - 1].x;
        const dy = positions[i].y - positions[i - 1].y;
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
        velocities.push(velocity);
      }
    }

    return velocities.length > 0 ? velocities : [0];
  }

  private calculateAccelerations(positions: Array<{ x: number; y: number; t: number }>): number[] {
    const velocities = this.calculateVelocities(positions);
    const accelerations: number[] = [];

    for (let i = 1; i < velocities.length; i++) {
      const dt = (positions[i + 1].t - positions[i].t) / 1000;
      if (dt > 0) {
        const acceleration = Math.abs(velocities[i] - velocities[i - 1]) / dt;
        accelerations.push(acceleration);
      }
    }

    return accelerations.length > 0 ? accelerations : [0];
  }

  private calculatePathLength(positions: Array<{ x: number; y: number; t: number }>): number {
    let length = 0;

    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].x - positions[i - 1].x;
      const dy = positions[i].y - positions[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }

    return length;
  }

  private calculateSmoothness(positions: Array<{ x: number; y: number; t: number }>): number {
    if (positions.length < 3) return 1;

    let jerk = 0;
    for (let i = 2; i < positions.length; i++) {
      const v1x = positions[i - 1].x - positions[i - 2].x;
      const v1y = positions[i - 1].y - positions[i - 2].y;
      const v2x = positions[i].x - positions[i - 1].x;
      const v2y = positions[i].y - positions[i - 1].y;

      const dvx = v2x - v1x;
      const dvy = v2y - v1y;
      jerk += Math.sqrt(dvx * dvx + dvy * dvy);
    }

    return 1 / (1 + jerk);
  }

  private countDirectionChanges(positions: Array<{ x: number; y: number; t: number }>): number {
    if (positions.length < 3) return 0;

    let changes = 0;
    let prevDx = positions[1].x - positions[0].x;
    let prevDy = positions[1].y - positions[0].y;

    for (let i = 2; i < positions.length; i++) {
      const dx = positions[i].x - positions[i - 1].x;
      const dy = positions[i].y - positions[i - 1].y;

      // Check if direction changed significantly (dot product < 0)
      if (prevDx * dx + prevDy * dy < 0) {
        changes++;
      }

      prevDx = dx;
      prevDy = dy;
    }

    return changes;
  }

  private calculateElbowAngle(frame: PoseFrame, side: 'left' | 'right'): number {
    const shoulder = frame.keypoints.find(k => k.name === `${side}_shoulder`);
    const elbow = frame.keypoints.find(k => k.name === `${side}_elbow`);
    const wrist = frame.keypoints.find(k => k.name === `${side}_wrist`);

    if (!shoulder || !elbow || !wrist ||
        shoulder.score < 0.3 || elbow.score < 0.3 || wrist.score < 0.3) {
      return 180;
    }

    const v1 = { x: shoulder.x - elbow.x, y: shoulder.y - elbow.y };
    const v2 = { x: wrist.x - elbow.x, y: wrist.y - elbow.y };

    const angle = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
    return Math.abs(angle * 180 / Math.PI);
  }

  private calculateShoulderAngle(frame: PoseFrame): number {
    const leftShoulder = frame.keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = frame.keypoints.find(k => k.name === 'right_shoulder');

    if (!leftShoulder || !rightShoulder ||
        leftShoulder.score < 0.3 || rightShoulder.score < 0.3) {
      return 0;
    }

    const dx = rightShoulder.x - leftShoulder.x;
    const dy = rightShoulder.y - leftShoulder.y;

    return Math.atan2(dy, dx) * 180 / Math.PI;
  }

  private calculateHeadTilt(frame: PoseFrame): number {
    const nose = frame.keypoints.find(k => k.name === 'nose');
    const leftEar = frame.keypoints.find(k => k.name === 'left_ear');
    const rightEar = frame.keypoints.find(k => k.name === 'right_ear');

    if (!nose || !leftEar || !rightEar ||
        nose.score < 0.3 || leftEar.score < 0.3 || rightEar.score < 0.3) {
      return 0;
    }

    const dx = rightEar.x - leftEar.x;
    const dy = rightEar.y - leftEar.y;

    return Math.atan2(dy, dx) * 180 / Math.PI;
  }

  private calculateCenterOfMass(frame: PoseFrame): { x: number; y: number } {
    const validKeypoints = frame.keypoints.filter(kp => kp.score > 0.3);

    if (validKeypoints.length === 0) {
      return { x: 0.5, y: 0.5 };
    }

    const sumX = validKeypoints.reduce((sum, kp) => sum + kp.x, 0);
    const sumY = validKeypoints.reduce((sum, kp) => sum + kp.y, 0);

    return {
      x: sumX / validKeypoints.length,
      y: sumY / validKeypoints.length
    };
  }

  private calculatePoseStability(window: PoseFrame[]): number {
    const keypoints = ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow'];
    let totalVariance = 0;

    for (const kpName of keypoints) {
      const positions = window.map(frame => {
        const kp = frame.keypoints.find(k => k.name === kpName);
        return kp && kp.score > 0.3 ? { x: kp.x, y: kp.y } : null;
      }).filter(p => p !== null) as Array<{ x: number; y: number }>;

      if (positions.length > 1) {
        const xs = positions.map(p => p.x);
        const ys = positions.map(p => p.y);
        totalVariance += this.std(xs) + this.std(ys);
      }
    }

    return 1 / (1 + totalVariance);
  }

  private calculateTotalEnergy(window: PoseFrame[]): number {
    const keypoints = ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow',
                      'left_shoulder', 'right_shoulder'];
    let totalEnergy = 0;

    for (const kpName of keypoints) {
      const positions = window.map((frame, i) => {
        const kp = frame.keypoints.find(k => k.name === kpName);
        return kp && kp.score > 0.3 ? { x: kp.x, y: kp.y, t: frame.timestamp } : null;
      }).filter(p => p !== null) as Array<{ x: number; y: number; t: number }>;

      if (positions.length > 1) {
        const velocities = this.calculateVelocities(positions);
        totalEnergy += this.mean(velocities);
      }
    }

    return totalEnergy;
  }

  private mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private std(arr: number[]): number {
    if (arr.length === 0) return 0;
    const m = this.mean(arr);
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  reset(): void {
    this.windowBuffer = [];
    this.previousKeypoints.clear();
  }
}