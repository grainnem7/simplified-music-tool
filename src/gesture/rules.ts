import { PoseFrame, RuleFilterResult, GestureEngineConfig } from './types';

export class RuleFilter {
  private config: GestureEngineConfig;
  private lastMovementTime: number = 0;
  private armingActive: boolean = false;
  private armingStartTime: number = 0;
  private recentFrames: PoseFrame[] = [];

  constructor(config: GestureEngineConfig) {
    this.config = config;
  }

  filter(frame: PoseFrame): RuleFilterResult {
    // Add frame to recent buffer
    this.recentFrames.push(frame);
    const cutoffTime = frame.timestamp - 1000; // Keep last second
    this.recentFrames = this.recentFrames.filter(f => f.timestamp > cutoffTime);

    if (this.recentFrames.length < 2) {
      return { pass: false, reason: 'Insufficient frames' };
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(this.recentFrames);

    // Check arming gesture if enabled
    if (this.config.arming) {
      const armingResult = this.checkArmingGesture(frame, metrics);
      if (!armingResult.armed) {
        return {
          pass: false,
          reason: 'Arming gesture not detected',
          metrics
        };
      }
    }

    // Check velocity threshold
    if (metrics.velocity < this.config.velocityMin) {
      return {
        pass: false,
        reason: 'Velocity below threshold',
        metrics
      };
    }

    // Check displacement threshold
    if (metrics.displacement < this.config.displacementMin) {
      return {
        pass: false,
        reason: 'Displacement below threshold',
        metrics
      };
    }

    // Check hold duration (dwell time)
    if (metrics.holdDuration < this.config.holdMs) {
      return {
        pass: false,
        reason: 'Hold duration too short',
        metrics
      };
    }

    // Check for jitter/noise
    if (this.isJittery(this.recentFrames)) {
      return {
        pass: false,
        reason: 'Movement too jittery',
        metrics
      };
    }

    // All checks passed
    this.lastMovementTime = frame.timestamp;
    return {
      pass: true,
      metrics
    };
  }

  private calculateMetrics(frames: PoseFrame[]): {
    velocity: number;
    displacement: number;
    holdDuration: number;
  } {
    if (frames.length < 2) {
      return { velocity: 0, displacement: 0, holdDuration: 0 };
    }

    // Focus on wrists for primary movement detection
    const wristNames = ['left_wrist', 'right_wrist'];
    let maxVelocity = 0;
    let maxDisplacement = 0;

    for (const wristName of wristNames) {
      const positions = frames.map(f => {
        const kp = f.keypoints.find(k => k.name === wristName);
        return kp && kp.score > 0.3 ? { x: kp.x, y: kp.y, t: f.timestamp } : null;
      }).filter(p => p !== null) as Array<{ x: number; y: number; t: number }>;

      if (positions.length >= 2) {
        // Calculate velocity
        for (let i = 1; i < positions.length; i++) {
          const dt = (positions[i].t - positions[i - 1].t) / 1000;
          if (dt > 0) {
            const dx = positions[i].x - positions[i - 1].x;
            const dy = positions[i].y - positions[i - 1].y;
            const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
            maxVelocity = Math.max(maxVelocity, velocity);
          }
        }

        // Calculate displacement from start to end
        const first = positions[0];
        const last = positions[positions.length - 1];
        const displacement = Math.sqrt(
          Math.pow(last.x - first.x, 2) +
          Math.pow(last.y - first.y, 2)
        );
        maxDisplacement = Math.max(maxDisplacement, displacement);
      }
    }

    // Calculate hold duration (time since significant movement started)
    const holdDuration = this.calculateHoldDuration(frames);

    return {
      velocity: maxVelocity,
      displacement: maxDisplacement,
      holdDuration
    };
  }

  private calculateHoldDuration(frames: PoseFrame[]): number {
    if (frames.length < 2) return 0;

    // Find when significant movement started
    let movementStartIdx = 0;
    const threshold = 0.02; // Minimum displacement to consider as movement

    for (let i = 1; i < frames.length; i++) {
      const wrist = frames[i].keypoints.find(k => k.name === 'right_wrist' || k.name === 'left_wrist');
      const prevWrist = frames[i - 1].keypoints.find(k => k.name === 'right_wrist' || k.name === 'left_wrist');

      if (wrist && prevWrist && wrist.score > 0.3 && prevWrist.score > 0.3) {
        const displacement = Math.sqrt(
          Math.pow(wrist.x - prevWrist.x, 2) +
          Math.pow(wrist.y - prevWrist.y, 2)
        );

        if (displacement > threshold) {
          movementStartIdx = i;
          break;
        }
      }
    }

    const startTime = frames[movementStartIdx].timestamp;
    const endTime = frames[frames.length - 1].timestamp;

    return endTime - startTime;
  }

  private checkArmingGesture(frame: PoseFrame, metrics: any): { armed: boolean } {
    // Simple arming: both hands raised above shoulders
    const leftWrist = frame.keypoints.find(k => k.name === 'left_wrist');
    const rightWrist = frame.keypoints.find(k => k.name === 'right_wrist');
    const leftShoulder = frame.keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = frame.keypoints.find(k => k.name === 'right_shoulder');

    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) {
      this.armingActive = false;
      return { armed: false };
    }

    const handsRaised =
      leftWrist.y < leftShoulder.y &&
      rightWrist.y < rightShoulder.y &&
      leftWrist.score > 0.5 &&
      rightWrist.score > 0.5;

    if (handsRaised) {
      if (!this.armingActive) {
        this.armingActive = true;
        this.armingStartTime = frame.timestamp;
      }

      // Require arming pose to be held for 500ms
      if (frame.timestamp - this.armingStartTime > 500) {
        return { armed: true };
      }
    } else {
      this.armingActive = false;
    }

    return { armed: false };
  }

  private isJittery(frames: PoseFrame[]): boolean {
    if (frames.length < 3) return false;

    // Check for excessive direction changes in short time
    const wristNames = ['left_wrist', 'right_wrist'];

    for (const wristName of wristNames) {
      const positions = frames.map(f => {
        const kp = f.keypoints.find(k => k.name === wristName);
        return kp && kp.score > 0.3 ? { x: kp.x, y: kp.y } : null;
      }).filter(p => p !== null) as Array<{ x: number; y: number }>;

      if (positions.length < 3) continue;

      let directionChanges = 0;
      let prevDx = positions[1].x - positions[0].x;
      let prevDy = positions[1].y - positions[0].y;

      for (let i = 2; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x;
        const dy = positions[i].y - positions[i - 1].y;

        // Check for significant direction change
        const dotProduct = prevDx * dx + prevDy * dy;
        if (dotProduct < -0.01) { // Nearly opposite direction
          directionChanges++;
        }

        prevDx = dx;
        prevDy = dy;
      }

      // If too many direction changes, consider it jittery
      if (directionChanges > positions.length / 3) {
        return true;
      }
    }

    return false;
  }

  reset(): void {
    this.recentFrames = [];
    this.lastMovementTime = 0;
    this.armingActive = false;
    this.armingStartTime = 0;
  }
}