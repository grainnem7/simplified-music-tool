import React, { useState, useEffect } from 'react'
import './PerformanceMonitor.css'

interface PerformanceMetrics {
  detectionLatency: number
  audioLatency: number
  fps: number
  totalLatency: number
}

interface PerformanceMonitorProps {
  isActive: boolean
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isActive }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    detectionLatency: 0,
    audioLatency: 0,
    fps: 0,
    totalLatency: 0
  })
  
  const [frameCount, setFrameCount] = useState(0)
  const [lastFrameTime, setLastFrameTime] = useState(Date.now())
  
  useEffect(() => {
    if (!isActive) return
    
    const intervalId = setInterval(() => {
      const now = Date.now()
      const deltaTime = now - lastFrameTime
      const currentFps = Math.round(1000 / (deltaTime / frameCount))
      
      setMetrics(prev => ({
        ...prev,
        fps: currentFps,
        totalLatency: prev.detectionLatency + prev.audioLatency
      }))
      
      setFrameCount(0)
      setLastFrameTime(now)
    }, 1000)
    
    return () => clearInterval(intervalId)
  }, [isActive, frameCount, lastFrameTime])
  
  // Update metrics from global performance tracking
  useEffect(() => {
    const handlePerformanceUpdate = (event: CustomEvent) => {
      const { type, value } = event.detail
      setMetrics(prev => ({
        ...prev,
        [type]: value
      }))
    }
    
    window.addEventListener('performanceUpdate', handlePerformanceUpdate as any)
    return () => window.removeEventListener('performanceUpdate', handlePerformanceUpdate as any)
  }, [])
  
  // Count frames
  useEffect(() => {
    if (isActive) {
      setFrameCount(prev => prev + 1)
    }
  }, [isActive])
  
  const getLatencyColor = (latency: number): string => {
    if (latency < 20) return '#4caf50'    // Green - excellent
    if (latency < 50) return '#ff9800'    // Orange - good
    return '#f44336'                      // Red - needs improvement
  }
  
  return (
    <div className="performance-monitor">
      <h4>Performance</h4>
      <div className="metric">
        <span className="metric-label">FPS:</span>
        <span className="metric-value">{metrics.fps}</span>
      </div>
      <div className="metric">
        <span className="metric-label">Detection Latency:</span>
        <span 
          className="metric-value"
          style={{ color: getLatencyColor(metrics.detectionLatency) }}
        >
          {metrics.detectionLatency.toFixed(1)}ms
        </span>
      </div>
      <div className="metric">
        <span className="metric-label">Audio Latency:</span>
        <span 
          className="metric-value"
          style={{ color: getLatencyColor(metrics.audioLatency) }}
        >
          {metrics.audioLatency.toFixed(1)}ms
        </span>
      </div>
      <div className="metric total">
        <span className="metric-label">Total Latency:</span>
        <span 
          className="metric-value"
          style={{ color: getLatencyColor(metrics.totalLatency) }}
        >
          {metrics.totalLatency.toFixed(1)}ms
        </span>
      </div>
      <div className="latency-target">
        Target: &lt;20ms
      </div>
    </div>
  )
}

export default PerformanceMonitor

// Helper function to emit performance metrics
export function emitPerformanceMetric(type: string, value: number) {
  window.dispatchEvent(new CustomEvent('performanceUpdate', {
    detail: { type, value }
  }))
}