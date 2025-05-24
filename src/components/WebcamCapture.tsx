import { forwardRef, useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import './WebcamCapture.css'

interface WebcamCaptureProps {
  poses?: any[]
  selectedBodyParts?: string[]
}

// Format keypoint names to be more user-friendly
const formatKeypointName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
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

const WebcamCapture = forwardRef<Webcam, WebcamCaptureProps>(({ poses, selectedBodyParts = [] }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showLabels, setShowLabels] = useState(false)
  
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
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary')
      
      // Mobile optimization flag
      const simplifiedRendering = isMobile
      
      // Draw connections for skeleton
      ctx.strokeStyle = accentColor
      ctx.globalAlpha = 0.6
      ctx.lineWidth = simplifiedRendering ? 2 : 3
      
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
          
          // Draw keypoint dot
          ctx.fillStyle = accentColor
          ctx.beginPath()
          ctx.arc(x, y, simplifiedRendering ? 6 : 8, 0, 2 * Math.PI)
          ctx.fill()
          
          // Add a border for better visibility
          ctx.strokeStyle = textColor
          ctx.lineWidth = simplifiedRendering ? 1 : 2
          ctx.stroke()
          
          // Only show labels if the toggle is on
          if (!showLabels) {
            return; // Skip drawing labels if toggle is off
          }
          
          // Draw labels for all valid selected keypoints
          if (keypoint.name) {
            const fontSize = simplifiedRendering ? 12 : 14
            ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
            
            // Create a background for the text
            // Format names to match body part selector
            let displayName;
            
            const keypointLower = keypoint.name.toLowerCase();
            if (keypointLower === 'nose') {
              displayName = 'Head';
            } else if (keypointLower === 'left_eye') {
              displayName = 'Left Eye';
            } else if (keypointLower === 'right_eye') {
              displayName = 'Right Eye';
            } else {
              // Format other keypoints like shoulders, wrists, etc.
              displayName = formatKeypointName(keypoint.name);
            }
            
            const textMetrics = ctx.measureText(displayName)
            const textWidth = textMetrics.width
            const textHeight = fontSize + 2
            const padding = simplifiedRendering ? 4 : 6
            const borderRadius = 4
            
            // Position text to avoid overlapping with the dot
            const textX = x + (simplifiedRendering ? 10 : 15)
            const textY = y - (simplifiedRendering ? 8 : 10)
            
            // Draw background for text
            ctx.fillStyle = bgColor
            ctx.globalAlpha = 0.9
            ctx.beginPath()
            
            // Use roundRect if available, otherwise fallback to regular rect
            if (ctx.roundRect) {
              ctx.roundRect(
                textX - padding,
                textY - textHeight + 2,
                textWidth + padding * 2,
                textHeight + padding,
                borderRadius
              )
            } else {
              ctx.rect(
                textX - padding,
                textY - textHeight + 2,
                textWidth + padding * 2,
                textHeight + padding
              )
            }
            
            ctx.fill()
            ctx.globalAlpha = 1.0
            
            // Draw text
            ctx.fillStyle = textColor
            ctx.fillText(displayName, textX, textY)
          }
        }
      })
    }
    
    // For debugging - log when selectedBodyParts change
    console.log(`Selected body parts (${selectedBodyParts.length}):`, selectedBodyParts);
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
      <button 
        className="labels-toggle"
        onClick={() => setShowLabels(!showLabels)}
        aria-label={showLabels ? "Hide labels" : "Show labels"}
        title={showLabels ? "Hide labels" : "Show labels"}
      >
        {showLabels ? "Hide Labels" : "Show Labels"}
      </button>
    </div>
  )
})

WebcamCapture.displayName = 'WebcamCapture'

export default WebcamCapture