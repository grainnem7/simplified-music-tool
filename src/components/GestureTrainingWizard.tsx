import { useState, useCallback, useRef, useEffect } from 'react';
import { PoseFrame, createGestureEngine, GestureEngineConfig } from '../gesture';
import WebcamCapture from './WebcamCapture';
import * as Tone from 'tone';
import './GestureTrainingWizard.css';

interface GestureTrainingWizardProps {
  onComplete: (profileName: string) => void;
  onBack: () => void;
}

const PRESET_GESTURES = [
  'Wave',
  'Point',
  'Swipe Left',
  'Swipe Right',
  'Raise Hand',
  'Circle',
  'Push',
  'Pull',
  'Clap',
  'Peace Sign'
];

const TRAINING_STEPS = {
  SELECT_GESTURES: 'select_gestures',
  RECORD_IDLE: 'record_idle',
  RECORD_GESTURES: 'record_gestures',
  TRAINING: 'training',
  TESTING: 'testing',
  COMPLETE: 'complete'
} as const;

type TrainingStep = typeof TRAINING_STEPS[keyof typeof TRAINING_STEPS];

function GestureTrainingWizard({ onComplete, onBack }: GestureTrainingWizardProps) {
  const [currentStep, setCurrentStep] = useState<TrainingStep>(TRAINING_STEPS.SELECT_GESTURES);
  const [selectedGestures, setSelectedGestures] = useState<string[]>([]);
  const [customGestureName, setCustomGestureName] = useState('');
  const [profileName, setProfileName] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [currentGestureIndex, setCurrentGestureIndex] = useState(0);
  const [currentRepetition, setCurrentRepetition] = useState(0);
  const [recordingCountdown, setRecordingCountdown] = useState(0);

  // Training data
  const idleSamples = useRef<PoseFrame[]>([]);
  const gestureSamples = useRef<Record<string, PoseFrame[]>>({});
  const recordingStartTime = useRef<number>(0);

  // Engine reference
  const gestureEngine = useRef<ReturnType<typeof createGestureEngine> | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const mediaStream = useRef<MediaStream | null>(null);

  // Testing state
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentPoses, setCurrentPoses] = useState<any[]>([]);

  // Audio feedback
  const synthRef = useRef<Tone.Synth | null>(null);

  // Check camera state when step changes
  useEffect(() => {
    if ((currentStep === TRAINING_STEPS.RECORD_IDLE || currentStep === TRAINING_STEPS.RECORD_GESTURES) &&
        mediaStream.current && !isCameraReady) {
      console.log('Camera already initialized, marking as ready');
      setIsCameraReady(true);
    }
  }, [currentStep, isCameraReady]);

  // Initialize gesture engine and audio
  useEffect(() => {
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

    gestureEngine.current = createGestureEngine(config);

    // Initialize synth for audio feedback
    synthRef.current = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.3
      }
    }).toDestination();

    return () => {
      gestureEngine.current?.dispose();
      synthRef.current?.dispose();
    };
  }, []);

  const handleAddCustomGesture = () => {
    if (customGestureName && !selectedGestures.includes(customGestureName)) {
      setSelectedGestures([...selectedGestures, customGestureName]);
      setCustomGestureName('');
    }
  };

  const toggleGestureSelection = (gesture: string) => {
    if (selectedGestures.includes(gesture)) {
      setSelectedGestures(selectedGestures.filter(g => g !== gesture));
    } else if (selectedGestures.length < 5) {
      setSelectedGestures([...selectedGestures, gesture]);
    }
  };

  const playStartSound = () => {
    if (synthRef.current) {
      const now = Tone.now();
      synthRef.current.triggerAttackRelease('C5', '8n', now);
      synthRef.current.triggerAttackRelease('E5', '8n', now + 0.1);
    }
  };

  const playStopSound = () => {
    if (synthRef.current) {
      const now = Tone.now();
      synthRef.current.triggerAttackRelease('E5', '8n', now);
      synthRef.current.triggerAttackRelease('C5', '8n', now + 0.1);
    }
  };

  const startIdleRecording = async () => {
    console.log('Starting idle recording...');
    console.log('Media stream available:', !!mediaStream.current);

    if (!mediaStream.current) {
      console.error('No media stream available');
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }

    // Initialize audio context on user interaction
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    playStartSound();
    setIsRecording(true);
    setRecordingProgress(0);
    idleSamples.current = [];
    recordingStartTime.current = Date.now();
    console.log('Recording started');

    const recordingDuration = 20000; // 20 seconds
    const updateInterval = 100;

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - recordingStartTime.current;
      const progress = Math.min((elapsed / recordingDuration) * 100, 100);
      setRecordingProgress(progress);

      if (elapsed >= recordingDuration) {
        clearInterval(progressTimer);
        stopIdleRecording();
      }
    }, updateInterval);
  };

  const stopIdleRecording = () => {
    playStopSound();
    setIsRecording(false);

    console.log('Idle recording stopped. Collected', idleSamples.current.length, 'samples');

    // Initialize gesture samples for each selected gesture
    selectedGestures.forEach(gesture => {
      gestureSamples.current[gesture] = [];
      console.log('Initialized storage for gesture:', gesture);
    });

    setCurrentStep(TRAINING_STEPS.RECORD_GESTURES);
    setCurrentGestureIndex(0);
    setCurrentRepetition(0);
    // Don't reset camera state - it's already initialized
  };

  const startGestureRecording = async () => {
    if (!mediaStream.current || currentGestureIndex >= selectedGestures.length) return;

    // Initialize audio context on user interaction
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    playStartSound();
    setIsRecording(true);
    setRecordingCountdown(3);
    recordingStartTime.current = Date.now();

    // Update countdown
    const countdownInterval = setInterval(() => {
      setRecordingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Record for 3 seconds per repetition
    setTimeout(() => {
      clearInterval(countdownInterval);
      stopGestureRecording();
    }, 3000);
  };

  const stopGestureRecording = () => {
    playStopSound();
    setIsRecording(false);

    const currentGesture = selectedGestures[currentGestureIndex];
    const samplesForGesture = gestureSamples.current[currentGesture]?.length || 0;
    console.log(`Stopped recording ${currentGesture}. Collected ${samplesForGesture} samples for this repetition`);

    // Move to next repetition or gesture
    if (currentRepetition < 4) { // 5 repetitions per gesture
      setCurrentRepetition(currentRepetition + 1);
    } else {
      if (currentGestureIndex < selectedGestures.length - 1) {
        setCurrentGestureIndex(currentGestureIndex + 1);
        setCurrentRepetition(0);
      } else {
        // All gestures recorded, start training
        console.log('All gestures recorded. Starting training...');
        startTraining();
      }
    }
  };

  const startTraining = async () => {
    setCurrentStep(TRAINING_STEPS.TRAINING);

    console.log('Starting training with data:');
    console.log('Idle samples:', idleSamples.current.length);
    console.log('Gesture samples:', Object.keys(gestureSamples.current).map(k => `${k}: ${gestureSamples.current[k].length}`));

    try {
      if (!gestureEngine.current) {
        console.error('Gesture engine not initialized');
        return;
      }

      if (idleSamples.current.length === 0) {
        console.error('No idle samples collected');
        alert('No idle movement data was recorded. Please try again.');
        setCurrentStep(TRAINING_STEPS.RECORD_IDLE);
        return;
      }

      // Check if we have gesture samples
      const hasGestureSamples = Object.values(gestureSamples.current).some(samples => samples.length > 0);
      if (!hasGestureSamples) {
        console.error('No gesture samples collected');
        alert('No gesture data was recorded. Please try again.');
        setCurrentStep(TRAINING_STEPS.RECORD_GESTURES);
        setCurrentGestureIndex(0);
        setCurrentRepetition(0);
        return;
      }

      // Train the model
      await gestureEngine.current.train(idleSamples.current, gestureSamples.current);

      // Save the profile
      const defaultProfileName = `profile_${Date.now()}`;
      await gestureEngine.current.saveProfile(profileName || defaultProfileName);

      setCurrentStep(TRAINING_STEPS.TESTING);

      // Start live detection for testing
      if (mediaStream.current) {
        await gestureEngine.current.start(mediaStream.current, selectedGestures);

        gestureEngine.current.onDetect((event) => {
          setDetectedGesture(event.label);
          setDetectionConfidence(event.confidence);

          // Clear detection after 1 second
          setTimeout(() => {
            setDetectedGesture('');
            setDetectionConfidence(0);
          }, 1000);
        });
      }
    } catch (error) {
      console.error('Training failed:', error);
      alert('Training failed. Please try again.');
      setCurrentStep(TRAINING_STEPS.SELECT_GESTURES);
    }
  };

  const handleWebcamStream = useCallback((stream: MediaStream) => {
    console.log('Webcam stream received:', stream);
    mediaStream.current = stream;
    // Only set camera ready if we haven't already
    setIsCameraReady(prev => {
      if (!prev) {
        console.log('Camera is now ready');
        return true;
      }
      return prev;
    });
  }, []);

  const handlePoseDetection = useCallback((pose: any) => {
    // Log all pose detections to debug
    if (!pose || !pose.keypoints) {
      console.log('Invalid pose data:', pose);
      return;
    }

    if (!isRecording) {
      // Not recording yet, but pose detection is working
      return;
    }

    console.log('Pose detected during recording:', pose, 'Current step:', currentStep);

    // Convert to PoseFrame format
    // Handle different possible formats from pose detection
    const keypoints = pose.keypoints.map((kp: any) => {
      // MoveNet format has x, y in pixel coordinates
      const x = typeof kp.x === 'number' ? kp.x / 640 : 0; // Normalize to 0-1
      const y = typeof kp.y === 'number' ? kp.y / 480 : 0; // Normalize to 0-1
      const score = kp.score || kp.confidence || 0;
      const name = kp.name || kp.part || '';

      return { x, y, score, name };
    });

    const frame: PoseFrame = {
      keypoints,
      timestamp: Date.now()
    };

    console.log('Created frame with', keypoints.length, 'keypoints');

    // Store in appropriate buffer
    if (currentStep === TRAINING_STEPS.RECORD_IDLE) {
      idleSamples.current.push(frame);
      console.log('Idle samples collected:', idleSamples.current.length);
    } else if (currentStep === TRAINING_STEPS.RECORD_GESTURES) {
      const gestureName = selectedGestures[currentGestureIndex];
      if (gestureName) {
        if (!gestureSamples.current[gestureName]) {
          gestureSamples.current[gestureName] = [];
        }
        gestureSamples.current[gestureName].push(frame);
        console.log(`Gesture samples for ${gestureName}:`, gestureSamples.current[gestureName].length);
      }
    }
  }, [isRecording, currentStep, currentGestureIndex, selectedGestures]);

  const completeTraining = () => {
    if (gestureEngine.current) {
      gestureEngine.current.stop();
    }
    onComplete(profileName || `profile_${Date.now()}`);
  };

  const renderStep = () => {
    switch (currentStep) {
      case TRAINING_STEPS.SELECT_GESTURES:
        return (
          <div className="training-step select-gestures">
            <h3>Select Gestures to Train (1-5)</h3>
            <p>Choose the gestures you want to use for controlling music</p>

            <div className="gesture-grid">
              {PRESET_GESTURES.map(gesture => (
                <button
                  key={gesture}
                  className={`gesture-option ${selectedGestures.includes(gesture) ? 'selected' : ''}`}
                  onClick={() => toggleGestureSelection(gesture)}
                  disabled={!selectedGestures.includes(gesture) && selectedGestures.length >= 5}
                >
                  {gesture}
                </button>
              ))}
            </div>

            <div className="custom-gesture">
              <input
                type="text"
                placeholder="Add custom gesture..."
                value={customGestureName}
                onChange={(e) => setCustomGestureName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomGesture()}
                maxLength={20}
              />
              <button onClick={handleAddCustomGesture} disabled={!customGestureName}>
                Add
              </button>
            </div>

            <div className="profile-name">
              <label>
                Profile Name (optional):
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g., My Gestures"
                />
              </label>
            </div>

            <div className="selected-gestures">
              <h4>Selected Gestures:</h4>
              {selectedGestures.length > 0 ? (
                <ul>
                  {selectedGestures.map(gesture => (
                    <li key={gesture}>
                      {gesture}
                      <button onClick={() => toggleGestureSelection(gesture)}>Remove</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No gestures selected</p>
              )}
            </div>

            <button
              className="continue-button"
              onClick={() => {
                setCurrentStep(TRAINING_STEPS.RECORD_IDLE);
                // Camera will be initialized when the webcam component mounts
              }}
              disabled={selectedGestures.length === 0}
            >
              Continue to Training
            </button>
          </div>
        );

      case TRAINING_STEPS.RECORD_IDLE:
        return (
          <div className="training-step record-idle">
            <h3>Record Background Movement</h3>
            <p>Move naturally for 20 seconds. This helps the system learn what NOT to respond to.</p>

            <div className={`webcam-container ${isRecording ? 'recording-active' : ''}`}>
              <WebcamCapture
                onStream={handleWebcamStream}
                onPoseDetected={handlePoseDetection}
                poses={currentPoses}
              />
              {isRecording && (
                <div className="recording-overlay">
                  <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    <span>RECORDING</span>
                  </div>
                </div>
              )}
            </div>

            {isRecording ? (
              <div className="recording-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${recordingProgress}%` }} />
                </div>
                <p className="recording-status">
                  <span className="recording-dot-small"></span>
                  Recording... {Math.round(recordingProgress)}%
                </p>
                <p className="recording-time">{Math.ceil((20000 - (recordingProgress * 200)) / 1000)}s remaining</p>
              </div>
            ) : (
              <>
                {!isCameraReady && (
                  <p className="camera-loading">Initializing camera...</p>
                )}
                <button
                  className="record-button"
                  onClick={startIdleRecording}
                  disabled={!isCameraReady}
                >
                  {isCameraReady ? 'Start Recording' : 'Waiting for camera...'}
                </button>
              </>
            )}
          </div>
        );

      case TRAINING_STEPS.RECORD_GESTURES:
        const currentGesture = selectedGestures[currentGestureIndex];
        return (
          <div className="training-step record-gestures">
            <h3>Record Gesture: {currentGesture}</h3>
            <p>Repetition {currentRepetition + 1} of 5</p>

            <div className={`webcam-container ${isRecording ? 'recording-active' : ''}`}>
              <WebcamCapture
                onStream={handleWebcamStream}
                onPoseDetected={handlePoseDetection}
                poses={currentPoses}
              />
              {isRecording && (
                <div className="recording-overlay">
                  <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    <span>RECORDING GESTURE</span>
                  </div>
                  <div className="countdown-timer">
                    {recordingCountdown}s
                  </div>
                </div>
              )}
            </div>

            <div className="gesture-instructions">
              {isRecording ? (
                <>
                  <p className="recording-active-text">
                    <span className="recording-dot-small"></span>
                    Recording in progress - Perform "{currentGesture}" now!
                  </p>
                  <div className="recording-countdown">{recordingCountdown} second{recordingCountdown !== 1 ? 's' : ''} remaining</div>
                </>
              ) : (
                <p>Perform the "{currentGesture}" gesture when ready</p>
              )}
            </div>

            {!isRecording && (
              <>
                {!isCameraReady && (
                  <p className="camera-loading">Initializing camera...</p>
                )}
                <button
                  className="record-button"
                  onClick={startGestureRecording}
                  disabled={!isCameraReady}
                >
                  {isCameraReady ? `Start Recording Repetition ${currentRepetition + 1}` : 'Waiting for camera...'}
                </button>
              </>
            )}

            <div className="gesture-progress">
              <p>Progress: {currentGestureIndex + 1}/{selectedGestures.length} gestures</p>
            </div>
          </div>
        );

      case TRAINING_STEPS.TRAINING:
        return (
          <div className="training-step training">
            <h3>Training Model</h3>
            <div className="training-animation">
              <div className="spinner" />
              <p>Processing your gestures...</p>
            </div>
          </div>
        );

      case TRAINING_STEPS.TESTING:
        return (
          <div className="training-step testing">
            <h3>Test Your Gestures</h3>
            <p>Try performing your trained gestures to test detection</p>

            <div className="webcam-container">
              <WebcamCapture
                onStream={handleWebcamStream}
                onPoseDetected={() => {}}
              />
            </div>

            <div className="detection-display">
              {detectedGesture ? (
                <div className="detected-gesture">
                  <h4>Detected: {detectedGesture}</h4>
                  <p>Confidence: {(detectionConfidence * 100).toFixed(1)}%</p>
                </div>
              ) : (
                <p>No gesture detected</p>
              )}
            </div>

            <button className="complete-button" onClick={completeTraining}>
              Complete Training
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="gesture-training-wizard">
      <div className="wizard-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h2>Gesture Training</h2>
      </div>

      <div className="wizard-progress">
        <div className={`progress-step ${currentStep === TRAINING_STEPS.SELECT_GESTURES ? 'active' : ''}`}>
          1. Select Gestures
        </div>
        <div className={`progress-step ${currentStep === TRAINING_STEPS.RECORD_IDLE ? 'active' : ''}`}>
          2. Record Idle
        </div>
        <div className={`progress-step ${currentStep === TRAINING_STEPS.RECORD_GESTURES ? 'active' : ''}`}>
          3. Record Gestures
        </div>
        <div className={`progress-step ${currentStep === TRAINING_STEPS.TRAINING ? 'active' : ''}`}>
          4. Training
        </div>
        <div className={`progress-step ${currentStep === TRAINING_STEPS.TESTING ? 'active' : ''}`}>
          5. Testing
        </div>
      </div>

      <div className="wizard-content">
        {renderStep()}
      </div>
    </div>
  );
}

export default GestureTrainingWizard;