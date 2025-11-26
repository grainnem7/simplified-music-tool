import React, { memo } from 'react'
import './NoteLanesOverlay.css'

interface Lane {
  id: string
  label: string
  centerY: number
  height: number
  color: string
}

interface NoteLanesOverlayProps {
  width: number
  height: number
  lanes: Lane[]
  activeLaneId: string | null
  cursorY: number | null
  cursorSource?: string
  showCursor?: boolean
}

const NoteLanesOverlay: React.FC<NoteLanesOverlayProps> = memo(({
  width,
  height,
  lanes,
  activeLaneId,
  cursorY,
  cursorSource,
  showCursor = true
}) => {
  return (
    <div className="lanes-overlay" style={{ width, height }}>
      <svg width={width} height={height} className="lanes-overlay-svg">
        {/* Render lanes as horizontal bands */}
        {lanes.map((lane) => {
          const halfHeight = lane.height / 2
          const topY = (lane.centerY - halfHeight) * height
          const laneHeight = lane.height * height
          const isActive = activeLaneId === lane.id

          return (
            <g key={lane.id}>
              {/* Lane background */}
              <rect
                x={0}
                y={topY}
                width={width}
                height={laneHeight}
                fill={lane.color}
                opacity={isActive ? 0.4 : 0.15}
                className={isActive ? 'lane-rect-active' : ''}
              />
              {/* Lane border - top */}
              <line
                x1={0}
                y1={topY}
                x2={width}
                y2={topY}
                stroke={lane.color}
                strokeWidth={isActive ? 4 : 2}
                opacity={0.8}
              />
              {/* Lane border - bottom */}
              <line
                x1={0}
                y1={topY + laneHeight}
                x2={width}
                y2={topY + laneHeight}
                stroke={lane.color}
                strokeWidth={isActive ? 4 : 2}
                opacity={0.8}
              />
              {/* Note label - left side */}
              <text
                x={15}
                y={topY + laneHeight / 2}
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={Math.min(24, laneHeight * 0.5)}
                fontWeight="bold"
                className="lane-label-text"
              >
                {lane.label}
              </text>
              {/* Note label - right side */}
              <text
                x={width - 15}
                y={topY + laneHeight / 2}
                dominantBaseline="middle"
                textAnchor="end"
                fill="#ffffff"
                fontSize={Math.min(24, laneHeight * 0.5)}
                fontWeight="bold"
                className="lane-label-text"
              >
                {lane.label}
              </text>
            </g>
          )
        })}

        {/* Cursor indicator */}
        {showCursor && cursorY !== null && (
          <g className="cursor-group">
            {/* Horizontal line across screen */}
            <line
              x1={0}
              y1={cursorY * height}
              x2={width}
              y2={cursorY * height}
              stroke="#FFD700"
              strokeWidth={4}
              opacity={0.9}
              className="cursor-line"
            />
            {/* Center dot */}
            <circle
              cx={width / 2}
              cy={cursorY * height}
              r={12}
              fill="#FFD700"
              stroke="#FFFFFF"
              strokeWidth={3}
              className="cursor-dot"
            />
            {/* Source label */}
            {cursorSource && (
              <text
                x={width / 2}
                y={cursorY * height - 25}
                textAnchor="middle"
                fill="#FFD700"
                fontSize="14"
                fontWeight="bold"
                className="cursor-source-label"
              >
                {cursorSource}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  )
})

NoteLanesOverlay.displayName = 'NoteLanesOverlay'

export default NoteLanesOverlay
