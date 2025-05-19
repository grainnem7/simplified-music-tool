import './AxisVisualizer.css'

interface AxisVisualizerProps {
  xLabel: string
  yLabel: string
  xInvert: boolean
  yInvert: boolean
}

function AxisVisualizer({ xLabel, yLabel, xInvert, yInvert }: AxisVisualizerProps) {
  return (
    <div className="axis-visualizer">
      <div className="axis-diagram">
        {/* Y-axis label */}
        <div className={`y-axis-label ${yInvert ? 'inverted' : ''}`}>
          <span className="axis-arrow">↑</span>
          <span>{yLabel}</span>
          <span className="axis-value">{yInvert ? 'High' : 'Low'}</span>
        </div>
        
        {/* Main grid */}
        <div className="axis-grid">
          <div className="grid-content">
            <div className="center-dot" />
            <div className="axis-line vertical" />
            <div className="axis-line horizontal" />
          </div>
          <div className="bottom-label">
            <span className="axis-value">{xInvert ? 'High' : 'Low'}</span>
          </div>
        </div>
        
        {/* X-axis label */}
        <div className={`x-axis-label ${xInvert ? 'inverted' : ''}`}>
          <span className="axis-arrow">→</span>
          <span>{xLabel}</span>
          <span className="axis-value">{xInvert ? 'Low' : 'High'}</span>
        </div>
      </div>
      
      <div className="axis-legend">
        <div className="legend-item">
          <span className="indicator up">↑</span>
          <span>{yInvert ? 'Up = Higher values' : 'Up = Lower values'}</span>
        </div>
        <div className="legend-item">
          <span className="indicator right">→</span>
          <span>{xInvert ? 'Right = Lower values' : 'Right = Higher values'}</span>
        </div>
      </div>
    </div>
  )
}

export default AxisVisualizer