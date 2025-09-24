import { useState, useEffect, useRef, useCallback } from 'react';
import { createGestureEngine, GestureEngine, GestureEngineConfig, GestureEvent } from '../gesture';
import * as Tone from 'tone';

interface UseGestureDetectionOptions {
  profileName?: string;
  onGestureDetected?: (event: GestureEvent) => void;
}

export function useGestureDetection(
  webcamRef: React.RefObject<any>,
  options: UseGestureDetectionOptions = {}
) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const engineRef = useRef<GestureEngine | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);

  // Musical notes for gesture-to-sound mapping
  const gestureNotes = useRef<Record<string, string[]>>({
    'Wave': ['C4', 'E4', 'G4', 'C5'],
    'Point': ['D4', 'F#4', 'A4'],
    'Swipe Left': ['E4', 'G4', 'B4', 'E5'],
    'Swipe Right': ['F4', 'A4', 'C5', 'F5'],
    'Raise Hand': ['G4', 'B4', 'D5', 'G5'],
    'Circle': ['A4', 'C#5', 'E5'],
    'Push': ['B4', 'D5', 'F#5'],
    'Pull': ['C5', 'E5', 'G5'],
    'Clap': ['C4', 'C5', 'G4', 'G5'],
    'Peace Sign': ['D4', 'A4', 'D5']
  });

  // Initialize gesture engine
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

    engineRef.current = createGestureEngine(config);

    // Initialize synth for gesture sounds
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.4,
        release: 0.8
      }
    }).toDestination();

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  // Load profile if specified
  useEffect(() => {
    if (options.profileName && engineRef.current) {
      engineRef.current.loadProfile(options.profileName)
        .catch(err => {
          console.error('Failed to load gesture profile:', err);
          setError('Failed to load gesture profile');
        });
    }
  }, [options.profileName]);

  const playGestureSound = useCallback((gestureName: string) => {
    if (!synthRef.current) return;

    const notes = gestureNotes.current[gestureName];
    if (notes && notes.length > 0) {
      // Play an arpeggiated chord for the gesture
      const now = Tone.now();
      notes.forEach((note, i) => {
        synthRef.current!.triggerAttackRelease(note, '8n', now + i * 0.1);
      });
    } else {
      // Default sound for unknown gestures
      synthRef.current.triggerAttackRelease('C4', '8n');
    }
  }, []);

  const handleGestureDetection = useCallback((event: GestureEvent) => {
    setDetectedGesture(event.label);
    setConfidence(event.confidence);

    // Play sound for the gesture
    playGestureSound(event.label);

    // Call external handler if provided
    if (options.onGestureDetected) {
      options.onGestureDetected(event);
    }

    // Clear detection after a short delay
    setTimeout(() => {
      setDetectedGesture('');
      setConfidence(0);
    }, 1500);
  }, [playGestureSound, options]);

  const startDetection = useCallback(async () => {
    if (!engineRef.current || !webcamRef.current) {
      setError('Gesture engine or webcam not available');
      return;
    }

    try {
      setError('');
      setIsDetecting(true);

      // Get media stream from webcam
      const video = webcamRef.current.video;
      if (video && video.srcObject) {
        streamRef.current = video.srcObject as MediaStream;

        // Get available gestures from profile
        const profiles = await engineRef.current.listProfiles();
        if (profiles.length > 0 && options.profileName) {
          // Load the specified profile
          await engineRef.current.loadProfile(options.profileName);
        }

        // Start gesture detection
        const gestures = ['Wave', 'Point', 'Swipe Left', 'Swipe Right', 'Raise Hand']; // Default gestures
        await engineRef.current.start(streamRef.current, gestures);

        // Subscribe to detection events
        engineRef.current.onDetect(handleGestureDetection);
      }
    } catch (err) {
      console.error('Failed to start gesture detection:', err);
      setError('Failed to start gesture detection');
      setIsDetecting(false);
    }
  }, [webcamRef, options.profileName, handleGestureDetection]);

  const stopDetection = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setIsDetecting(false);
    setDetectedGesture('');
    setConfidence(0);
  }, []);

  const setGestureNoteMapping = useCallback((mapping: Record<string, string[]>) => {
    gestureNotes.current = { ...gestureNotes.current, ...mapping };
  }, []);

  return {
    isDetecting,
    detectedGesture,
    confidence,
    error,
    startDetection,
    stopDetection,
    setGestureNoteMapping
  };
}