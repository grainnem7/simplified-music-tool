import { useCallback, useEffect, useRef, useState } from 'react'
import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs'

export function usePoseDetection(webcamRef: React.RefObject<any>) {
  const [poses, setPoses] = useState<poseDetection.Pose[] | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null)
  const animationFrameRef = useRef<number>()

  const initializeDetector = async () => {
    console.log('Initializing pose detector...')
    try {
      // Make sure TensorFlow is ready
      await tf.ready()
      console.log('TensorFlow ready, backend:', tf.getBackend())
      
      const model = poseDetection.SupportedModels.MoveNet
      const detector = await poseDetection.createDetector(model, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
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

    try {
      const poses = await detectorRef.current.estimatePoses(video, {
        flipHorizontal: false // Don't flip, we'll handle it in display
      })
      
      if (poses.length > 0) {
        // Normalize coordinates
        const normalizedPoses = poses.map(pose => ({
          ...pose,
          keypoints: pose.keypoints.map(kp => ({
            ...kp,
            x: kp.x / video.videoWidth,
            y: kp.y / video.videoHeight
          }))
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