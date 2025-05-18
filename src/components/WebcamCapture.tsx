import { forwardRef, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import './WebcamCapture.css'

interface WebcamCaptureProps {
  poses?: any[]
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

      // Draw keypoints
      const pose = poses[0]
      pose.keypoints.forEach((keypoint: any) => {
        if (keypoint.score > 0.3) {
          // Convert normalized coordinates to canvas coordinates
          const x = (1 - keypoint.x) * canvas.width  // Mirror X coordinate
          const y = keypoint.y * canvas.height
          
          // Draw keypoint
          ctx.fillStyle = 'red'
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, 2 * Math.PI)
          ctx.fill()
          
          // Draw keypoint name
          ctx.fillStyle = 'white'
          ctx.font = '12px Arial'
          ctx.fillText(keypoint.name || '', x + 5, y - 5)
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