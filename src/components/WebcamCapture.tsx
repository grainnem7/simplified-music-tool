import { forwardRef, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import './WebcamCapture.css'

interface WebcamCaptureProps {
  poses?: any[]
}

// Format keypoint names to be more user-friendly
const formatKeypointName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const WebcamCapture = forwardRef<Webcam, WebcamCaptureProps>(({ poses }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  }

  useEffect(() => {
    if (poses && poses.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
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
      
      // Draw connections
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color')
      ctx.globalAlpha = 0.6
      ctx.lineWidth = 3
      
      connections.forEach(([start, end]) => {
        const startKeypoint = pose.keypoints.find((kp: any) => kp.name === start)
        const endKeypoint = pose.keypoints.find((kp: any) => kp.name === end)
        
        if (startKeypoint?.score > 0.3 && endKeypoint?.score > 0.3) {
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
        if (keypoint.score > 0.3) {
          // Convert normalized coordinates to canvas coordinates
          const x = (1 - keypoint.x) * canvas.width  // Mirror X coordinate
          const y = keypoint.y * canvas.height
          
          // Draw keypoint - use accent color from theme
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color')
          ctx.beginPath()
          ctx.arc(x, y, 8, 0, 2 * Math.PI)
          ctx.fill()
          
          // Add a white border for better visibility
          ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
          ctx.lineWidth = 2
          ctx.stroke()
          
          // Draw keypoint name with better formatting
          if (keypoint.name) {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
            ctx.font = 'bold 14px Inter, system-ui, sans-serif'
            
            // Create a background for the text
            const formattedName = formatKeypointName(keypoint.name)
            const textMetrics = ctx.measureText(formattedName)
            const textWidth = textMetrics.width
            const textHeight = 16
            const padding = 6
            const borderRadius = 4
            
            // Position text to avoid overlapping with the dot
            const textX = x + 15
            const textY = y - 10
            
            // Draw rounded rectangle background
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary')
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
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
            ctx.fillText(formattedName, textX, textY)
          }
        }
      })
    }
  }, [poses])

  return (
    <div className="webcam-container" style={{ position: 'relative' }}>
      <Webcam
        ref={ref}
        audio={false}
        videoConstraints={videoConstraints}
        mirrored={true}
        style={{
          width: '100%',
          maxWidth: '640px',
          height: 'auto'
        }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          maxWidth: '640px',
          height: 'auto',
          pointerEvents: 'none'
        }}
      />
    </div>
  )
})

WebcamCapture.displayName = 'WebcamCapture'

export default WebcamCapture