import { useState, useCallback, useEffect } from 'react'

/**
 * Lane personalization data
 * Tracks user's vertical movement range and adapts lane positions accordingly
 */
interface LanePersonalizationData {
  // Vertical range tracking
  minY: number
  maxY: number
  sampleCount: number

  // Center position (for future dead zone detection)
  centerY: number

  // Smoothing factor (adaptive based on jitter detection)
  smoothingFactor: number  // 0-1, higher = more smoothing
}

/**
 * Lane definition (must match component's Lane interface)
 */
interface Lane {
  id: string
  label: string
  centerY: number
  height: number
  notes: string[]
  color: string
}

const DEFAULT_DATA: LanePersonalizationData = {
  minY: 0.15,
  maxY: 0.85,
  sampleCount: 0,
  centerY: 0.5,
  smoothingFactor: 0.3
}

const STORAGE_KEY = 'note-lanes-personalization'

/**
 * Hook for personalizing Note Lanes based on user's vertical movement range
 *
 * AI/Personalization features:
 * - Tracks user's natural vertical movement range and scales lanes to fit
 * - Detects center position for dead zone calculation (future)
 * - Adapts smoothing based on movement jitter (future)
 * - Uses simple heuristics (no complex ML required)
 *
 * IMPORTANT: This ONLY adapts spatial layout (where lanes are positioned)
 * It NEVER changes which notes a lane plays - those mappings are fixed
 *
 * TODO: Could enhance with ML to:
 * - Online learning of movement range (faster adaptation)
 * - Detect tremor patterns and adjust smoothing automatically
 * - Learn optimal lane heights per user
 * - Detect which lanes are hardest to hit and make them larger
 * - Predict comfortable movement speed and scale hysteresis
 */
export function useLanePersonalization() {
  // Load saved data from localStorage
  const [personalizationData, setPersonalizationData] = useState<LanePersonalizationData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load lane personalization:', e)
    }
    return DEFAULT_DATA
  })

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(personalizationData))
    } catch (e) {
      console.warn('Failed to save lane personalization:', e)
    }
  }, [personalizationData])

  /**
   * Update movement data with a new Y position
   * This is called every time the cursor moves
   */
  const updateMovementData = useCallback((y: number) => {
    setPersonalizationData(prev => {
      // Skip invalid values
      if (y < 0 || y > 1 || isNaN(y)) {
        return prev
      }

      // For first few samples, directly expand range
      // After that, use smoothing for gradual adaptation
      const isLearningPhase = prev.sampleCount < 30

      let newMinY: number
      let newMaxY: number

      if (isLearningPhase) {
        // During learning: directly expand range when we see new extremes
        newMinY = Math.min(prev.minY, y)
        newMaxY = Math.max(prev.maxY, y)
      } else {
        // After learning: slow adaptation with smoothing
        const alpha = 0.02
        // Only expand range, don't contract it quickly
        if (y < prev.minY) {
          newMinY = prev.minY * (1 - alpha) + y * alpha
        } else {
          newMinY = prev.minY
        }
        if (y > prev.maxY) {
          newMaxY = prev.maxY * (1 - alpha) + y * alpha
        } else {
          newMaxY = prev.maxY
        }
      }

      // Update center position (running average)
      const newCenterY = prev.centerY * 0.95 + y * 0.05

      // Ensure minimum range to avoid collapsing
      const MIN_RANGE = 0.3
      const rangeY = newMaxY - newMinY

      let finalMinY = newMinY
      let finalMaxY = newMaxY

      if (rangeY < MIN_RANGE) {
        const center = (newMinY + newMaxY) / 2
        finalMinY = Math.max(0, center - MIN_RANGE / 2)
        finalMaxY = Math.min(1, center + MIN_RANGE / 2)
      }

      return {
        ...prev,
        minY: finalMinY,
        maxY: finalMaxY,
        centerY: newCenterY,
        sampleCount: prev.sampleCount + 1
      }
    })
  }, [])

  /**
   * Adapt lane positions to personalized vertical range
   * Maps user's natural movement range to full (0, 1) space
   */
  const adaptLanes = useCallback((defaultLanes: Lane[]): Lane[] => {
    const { minY, maxY, sampleCount } = personalizationData

    // Only apply adaptation after we have some data
    if (sampleCount < 15) {
      return defaultLanes
    }

    // Calculate range
    const rangeY = maxY - minY

    // Map each lane to personalized range
    return defaultLanes.map(lane => ({
      ...lane,
      centerY: minY + lane.centerY * rangeY,
      height: lane.height * rangeY
    }))
  }, [personalizationData])

  /**
   * Get current personalization stats for display
   */
  const getStats = useCallback(() => {
    const { minY, maxY, sampleCount, smoothingFactor } = personalizationData
    return {
      rangeY: maxY - minY,
      sampleCount,
      smoothingFactor
    }
  }, [personalizationData])

  /**
   * Reset personalization to defaults
   */
  const resetAdaptation = useCallback(() => {
    setPersonalizationData(DEFAULT_DATA)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    adaptLanes,
    updateMovementData,
    getStats,
    resetAdaptation
  }
}
