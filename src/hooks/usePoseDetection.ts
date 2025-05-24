import { useCallback, useEffect, useRef, useState } from 'react'
import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs'

// Detect if running on mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768)
}

export function usePoseDetection(webcamRef: React.RefObject<any>) {
  const [poses, setPoses] = useState<poseDetection.Pose[] | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null)
  const animationFrameRef = useRef<number>()
  const loggedKeypointsRef = useRef(false)
  const lastDetectionTimeRef = useRef<number>(0)
  const detectionIntervalRef = useRef<number>(isMobile() ? 150 : 0) // Throttle on mobile

  const initializeDetector = async () => {
    console.log('Initializing pose detector...')
    try {
      const mobile = isMobile()
      console.log('Detected platform:', mobile ? 'mobile' : 'desktop')
      
      // Make sure TensorFlow is ready
      await tf.ready()
      
      // Choose appropriate backend based on device
      if (mobile) {
        // WebGL is still best for mobile, but with lower resolution
        await tf.setBackend('webgl')
      } else {
        // Use WebGL for desktop for best performance
        await tf.setBackend('webgl')
      }
      
      console.log('TensorFlow ready, using backend:', tf.getBackend())
      
      const model = poseDetection.SupportedModels.MoveNet
      const modelType = mobile 
        ? poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING  // Lighter model for mobile
        : poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING  // Could use THUNDER for desktop, but LIGHTNING is faster
        
      const detector = await poseDetection.createDetector(model, {
        modelType: modelType,
        enableSmoothing: true,           // Enable smoothing for better tracking
        minPoseScore: mobile ? 0.15 : 0.2, // Lower threshold for mobile
        multiPoseMaxDimension: mobile ? 256 : 512, // Smaller size for mobile processing
      })
      
      detectorRef.current = detector
      setModelLoaded(true)
      console.log('Pose detector initialized successfully')
    } catch (error) {
      console.error('Failed to initialize detector:', error)
      throw error
    }
  }

  const detectPoses = async () => {
    if (!webcamRef.current || !detectorRef.current || !modelLoaded) {
      return
    }
    
    const video = webcamRef.current.video
    if (!video || video.readyState !== 4) {
      return
    }
    
    // Throttle detection on mobile devices
    const now = performance.now()
    if (detectionIntervalRef.current > 0 && 
        now - lastDetectionTimeRef.current < detectionIntervalRef.current) {
      // Not enough time has passed, schedule next frame and return
      if (isDetecting) {
        animationFrameRef.current = requestAnimationFrame(detectPoses)
      }
      return
    }
    
    lastDetectionTimeRef.current = now

    try {
      const startTime = performance.now()
      
      // Apply different estimation options based on device
      const mobile = isMobile()
      const estimationConfig = {
        flipHorizontal: false, // Don't flip, we'll handle it in display
        maxPoses: 1,           // Only detect a single pose for better performance
      }
      
      const poses = await detectorRef.current.estimatePoses(video, estimationConfig)
      
      const detectionTime = performance.now() - startTime
      
      // Emit performance metric
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('performanceUpdate', {
          detail: { type: 'detectionLatency', value: detectionTime }
        }))
      }
      
      // Adaptive throttling based on detection time
      if (mobile && detectionTime > 100) {
        // If detection is slow on mobile, increase throttling interval
        detectionIntervalRef.current = Math.min(300, detectionTime * 1.5)
        console.log(`Detection time: ${detectionTime.toFixed(0)}ms, adjusted interval to ${detectionIntervalRef.current.toFixed(0)}ms`)
      }
      
      if (poses.length > 0) {
        // Only log keypoint names once for debugging
        if (!loggedKeypointsRef.current) {
          console.log('Detected keypoint names:', poses[0].keypoints.map(kp => kp.name))
          loggedKeypointsRef.current = true
        }
        
        // Normalize coordinates while preserving all keypoint properties
        const normalizedPoses = poses.map(pose => ({
          ...pose,
          keypoints: pose.keypoints.map(kp => ({
            ...kp,
            name: kp.name, // Explicitly preserve the name
            // Normalize coordinates to 0-1 range
            x: kp.x / video.videoWidth,
            y: kp.y / video.videoHeight,
            // Apply additional filtering for low-confidence keypoints
            score: kp.score || 0
          }))
          // Filter out very low confidence keypoints on mobile
          .filter(kp => !mobile || kp.score > 0.2)
        }))
        
        setPoses(normalizedPoses)
      }
    } catch (error) {
      console.error('Pose detection error:', error)
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(detectPoses)
    }
  }

  const startDetection = useCallback(async () => {
    console.log('Starting pose detection...')
    try {
      if (!detectorRef.current) {
        await initializeDetector()
      }
      setIsDetecting(true)
      detectPoses() // Start the detection loop
    } catch (error) {
      console.error('Failed to start detection:', error)
      throw error
    }
  }, [])

  const stopDetection = useCallback(() => {
    console.log('Stopping pose detection...')
    setIsDetecting(false)
    setPoses(null)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  useEffect(() => {
    if (isDetecting) {
      detectPoses()
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isDetecting])

  return { poses, startDetection, stopDetection, modelLoaded }
}