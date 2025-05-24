import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeHandDetector, detectHands, disposeHandDetector, Hand } from '../services/handDetection';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

interface UseHandDetectionResult {
  hands: Hand[] | null;
  isLoading: boolean;
  error: string | null;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
}

export const useHandDetection = (webcamRef: React.RefObject<any>): UseHandDetectionResult => {
  const [hands, setHands] = useState<Hand[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);

  const detect = useCallback(async () => {
    if (!webcamRef.current || !detectorRef.current || !isDetectingRef.current) {
      console.log('Detection skip:', { 
        hasWebcam: !!webcamRef.current, 
        hasDetector: !!detectorRef.current, 
        isDetecting: isDetectingRef.current 
      });
      return;
    }

    try {
      const video = webcamRef.current.video || webcamRef.current as HTMLVideoElement;
      
      // Make sure video is ready and has valid dimensions
      if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
        animationIdRef.current = requestAnimationFrame(detect);
        return;
      }

      const detectedHands = await detectHands(video, true);
      if (detectedHands && detectedHands.length > 0) {
        console.log('Hand detection success:', detectedHands.length, 'hands');
      }
      setHands(detectedHands);
    } catch (err) {
      console.error('Hand detection error:', err);
    }

    // Continue detection loop
    animationIdRef.current = requestAnimationFrame(detect);
  }, [webcamRef]);

  const startDetection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Initializing hand detector...');
      if (!detectorRef.current) {
        detectorRef.current = await initializeHandDetector();
        console.log('Hand detector initialized successfully');
      }

      setIsDetecting(true);
      isDetectingRef.current = true;
      
      console.log('Starting detection loop, isDetecting:', true);
      // Start detection loop with minimal delay
      setTimeout(() => {
        detect();
      }, 100); // Reduced from 500ms
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start hand detection');
      console.error('Failed to start hand detection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [detect]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    isDetectingRef.current = false;
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    setHands(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      if (detectorRef.current) {
        disposeHandDetector();
        detectorRef.current = null;
      }
    };
  }, [stopDetection]);

  return {
    hands,
    isLoading,
    error,
    startDetection,
    stopDetection
  };
};