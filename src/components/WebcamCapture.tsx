import { forwardRef, useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import HarpOverlay from './HarpOverlay'
import './WebcamCapture.css'

interface WebcamCaptureProps {
  poses?: any[]
  selectedBodyParts?: string[]
  showHarpOverlay?: boolean
  harpPedalPositions?: { [key: string]: 'flat' | 'natural' | 'sharp' }
  onHarpStringPlucked?: (stringIndex: number, note: string) => void
  fingertipPositions?: Array<{ x: number; y: number; finger: string; hand: 'left' | 'right' }>
  harpRange?: { name: string; startString: number; endString: number; description: string }
}

// Convert TensorFlow keypoint name to our body part ID
const mapKeypointToBodyPartId = (keypointName: string): string => {
  keypointName = keypointName.toLowerCase();
  
  if (keypointName === 'nose') {
    return 'nose';
  } else if (keypointName === 'left_eye') {
    return 'leftEye';
  } else if (keypointName === 'right_eye') {
    return 'rightEye';
  } else if (keypointName === 'left_shoulder') {
    return 'leftShoulder';
  } else if (keypointName === 'right_shoulder') {
    return 'rightShoulder';
  } else if (keypointName === 'left_elbow') {
    return 'leftElbow';
  } else if (keypointName === 'right_elbow') {
    return 'rightElbow';
  } else if (keypointName === 'left_wrist') {
    return 'leftWrist';
  } else if (keypointName === 'right_wrist') {
    return 'rightWrist';
  } else if (keypointName === 'left_hip') {
    return 'leftHip';
  } else if (keypointName === 'right_hip') {
    return 'rightHip';
  } else if (keypointName === 'left_knee') {
    return 'leftKnee';
  } else if (keypointName === 'right_knee') {
    return 'rightKnee';
  } else if (keypointName === 'left_ankle') {
    return 'leftAnkle';
  } else if (keypointName === 'right_ankle') {
    return 'rightAnkle';
  }
  
  return '';
}

const WebcamCapture = forwardRef<Webcam, WebcamCaptureProps>(({ 
  poses, 
  selectedBodyParts = [],
  showHarpOverlay = false,
  harpPedalPositions = {},
  onHarpStringPlucked,
  fingertipPositions,
  harpRange
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showLabels, setShowLabels] = useState(true)
  
  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768)
    
  // Adjust video constraints based on device
  const videoConstraints = {
    width: isMobile ? 480 : 640,
    height: isMobile ? 360 : 480,
    facingMode: "user",
    frameRate: isMobile ? { ideal: 15, max: 30 } : { ideal: 30, max: 60 }
  }

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // If no poses or empty poses array, just leave canvas clear and return
      if (!poses || poses.length === 0) {
        return
      }
      
      // Skip drawing dots and labels in harp mode
      if (showHarpOverlay) {
        return
      }
      
      // Define skeleton connections
      const connections = [
        ['left_shoulder', 'right_shoulder'],
        ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'],
        ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'],
        ['left_hip', 'right_hip'],
        ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle'],
        ['right_hip', 'right_knee'],
        ['right_knee', 'right_ankle']
      ]
      
      const pose = poses[0]
      // Get colors from theme
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color')
      
      // Mobile optimization flag
      const simplifiedRendering = isMobile
      
      // Draw connections for skeleton - sleeker style
      ctx.strokeStyle = accentColor
      ctx.globalAlpha = 0.4
      ctx.lineWidth = simplifiedRendering ? 1.5 : 2
      ctx.lineCap = 'round'

      connections.forEach(([start, end]) => {

        // Helper function to check if a keypoint is selected
        const isKeypointSelected = (name: string) => {
          const bodyPartId = mapKeypointToBodyPartId(name);
          return bodyPartId && selectedBodyParts.includes(bodyPartId);
        };

        // Skip connections if either keypoint is not selected
        if (!isKeypointSelected(start) || !isKeypointSelected(end)) {
          return;
        }

        const startKeypoint = pose.keypoints.find((kp: any) => kp.name === start)
        const endKeypoint = pose.keypoints.find((kp: any) => kp.name === end)

        // Only draw connections with sufficient confidence
        const minScore = simplifiedRendering ? 0.2 : 0.3
        if (startKeypoint?.score > minScore && endKeypoint?.score > minScore) {
          const startX = (1 - startKeypoint.x) * canvas.width
          const startY = startKeypoint.y * canvas.height
          const endX = (1 - endKeypoint.x) * canvas.width
          const endY = endKeypoint.y * canvas.height

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        }
      })

      ctx.globalAlpha = 1.0

      // Draw keypoints
      pose.keypoints.forEach((keypoint: any) => {
        const minScore = simplifiedRendering ? 0.2 : 0.3
        if (keypoint.score > minScore) {
          // Check if this keypoint is in the selected body parts
          // Map TensorFlow model keypoint names to our application's body part IDs
          const keypointName = keypoint.name || '';
          const bodyPartId = mapKeypointToBodyPartId(keypointName);
          const isSelected = bodyPartId && selectedBodyParts.includes(bodyPartId);
          
          // Skip if not selected
          if (!isSelected) {
            return;
          }
          
          // Convert normalized coordinates to canvas coordinates
          const x = (1 - keypoint.x) * canvas.width  // Mirror X coordinate
          const y = keypoint.y * canvas.height

          // Draw sleeker keypoint dot with glow effect
          // Outer glow
          ctx.fillStyle = accentColor
          ctx.globalAlpha = 0.2
          ctx.beginPath()
          ctx.arc(x, y, simplifiedRendering ? 8 : 10, 0, 2 * Math.PI)
          ctx.fill()

          // Inner dot
          ctx.globalAlpha = 1.0
          ctx.fillStyle = accentColor
          ctx.beginPath()
          ctx.arc(x, y, simplifiedRendering ? 4 : 5, 0, 2 * Math.PI)
          ctx.fill()

          // Subtle border
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.5
          ctx.stroke()
          
          // Only show labels if the toggle is on
          if (!showLabels) {
            return; // Skip drawing labels if toggle is off
          }
          
          // Draw labels for all valid selected keypoints
          if (keypoint.name) {
            const fontSize = simplifiedRendering ? 8 : 9
            ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`
            ctx.letterSpacing = '0.05em'

            // Format names to uppercase abbreviated style
            let displayName;

            const keypointLower = keypoint.name.toLowerCase();
            if (keypointLower === 'nose') {
              displayName = 'HEAD';
            } else if (keypointLower === 'left_eye') {
              displayName = 'L EYE';
            } else if (keypointLower === 'right_eye') {
              displayName = 'R EYE';
            } else if (keypointLower.includes('left_')) {
              displayName = 'L ' + keypoint.name.replace('left_', '').replace(/_/g, ' ').toUpperCase();
            } else if (keypointLower.includes('right_')) {
              displayName = 'R ' + keypoint.name.replace('right_', '').replace(/_/g, ' ').toUpperCase();
            } else {
              displayName = keypoint.name.replace(/_/g, ' ').toUpperCase();
            }

            const textMetrics = ctx.measureText(displayName)
            const textWidth = textMetrics.width
            const textHeight = fontSize

            // Position text closer to the dot, offset to the side
            const textX = x + 14
            const textY = y + 4
            const padding = 5

            // Draw solid background for maximum readability
            ctx.globalAlpha = 0.95
            ctx.fillStyle = '#000000'
            ctx.beginPath()
            ctx.roundRect(
              textX - padding,
              textY - textHeight,
              textWidth + padding * 2,
              textHeight + padding,
              3
            )
            ctx.fill()

            // Draw white text for maximum contrast
            ctx.globalAlpha = 1.0
            ctx.fillStyle = '#ffffff'
            ctx.fillText(displayName, textX, textY)

            // Draw accent color border on the background
            ctx.strokeStyle = accentColor
            ctx.lineWidth = 1.5
            ctx.globalAlpha = 0.9
            ctx.beginPath()
            ctx.roundRect(
              textX - padding,
              textY - textHeight,
              textWidth + padding * 2,
              textHeight + padding,
              3
            )
            ctx.stroke()

            ctx.globalAlpha = 1.0
          }
        }
      })
    }
    
  }, [poses, isMobile, showLabels, selectedBodyParts]) // Will re-run when poses or selectedBodyParts change


  return (
    <div className="webcam-container">
      <Webcam
        ref={ref}
        audio={false}
        videoConstraints={videoConstraints}
        mirrored={true}
        className="webcam-video"
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="webcam-canvas"
      />
      {showHarpOverlay && (
        <HarpOverlay
          width={640}
          height={480}
          fingertipPositions={fingertipPositions}
          onStringPlucked={onHarpStringPlucked}
          pedalPositions={harpPedalPositions}
          isMobile={isMobile}
          harpRange={harpRange}
        />
      )}
      {!showHarpOverlay && (
        <button 
          className="labels-toggle"
          onClick={() => setShowLabels(!showLabels)}
          aria-label={showLabels ? "Hide labels" : "Show labels"}
          title={showLabels ? "Hide labels" : "Show labels"}
        >
          {showLabels ? "Hide Labels" : "Show Labels"}
        </button>
      )}
    </div>
  )
})

WebcamCapture.displayName = 'WebcamCapture'

export default WebcamCapture