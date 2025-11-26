import { useState, useCallback, useEffect } from 'react'

/**
 * XY Controller personalization data
 * Tracks user's movement patterns and adapts XY mapping accordingly
 */
interface XYPersonalizationData {
  // Movement range tracking
  minX: number
  maxX: number
  minY: number
  maxY: number
  sampleCount: number

  // Dead zone detection (future enhancement)
  centerX: number  // Average resting position
  centerY: number
  deadZoneRadius: number  // Size of dead zone around center

  // Smoothing factor (adaptive based on jitter detection)
  smoothingFactor: number  // 0-1, higher = more smoothing
}

const DEFAULT_DATA: XYPersonalizationData = {
  minX: 0.15,
  maxX: 0.85,
  minY: 0.15,
  maxY: 0.85,
  sampleCount: 0,
  centerX: 0.5,
  centerY: 0.5,
  deadZoneRadius: 0.05,
  smoothingFactor: 0.3
}

const STORAGE_KEY = 'xy-controller-personalization'

/**
 * Hook for personalizing XY controller mapping based on user's movement patterns
 *
 * AI/Personalization features:
 * - Tracks user's natural movement range and scales XY space to fit
 * - Detects center position for dead zone calculation
 * - Adapts smoothing based on movement jitter
 * - Uses simple heuristics (no complex ML required)
 *
 * IMPORTANT: This ONLY adapts spatial mapping (how movement maps to XY coordinates)
 * It NEVER changes what X or Y control musically - those mappings are fixed
 *
 * TODO: Could enhance with ML to:
 * - Online learning of movement range (faster adaptation)
 * - Detect tremor patterns and adjust smoothing automatically
 * - Learn optimal dead zone size per user
 * - Predict comfortable movement speed and scale sensitivity
 */
export function useXYPersonalization() {
  // Load saved data from localStorage
  const [personalizationData, setPersonalizationData] = useState<XYPersonalizationData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load XY personalization:', e)
    }
    return DEFAULT_DATA
  })

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(personalizationData))
    } catch (e) {
      console.warn('Failed to save XY personalization:', e)
    }
  }, [personalizationData])

  /**
   * Update movement data with a new position
   * This is called every time the cursor moves
   */
  const updateMovementData = useCallback((x: number, y: number) => {
    setPersonalizationData(prev => {
      // Exponential smoothing for gradual adaptation
      const alpha = prev.sampleCount < 40 ? 0.12 : 0.02 // Fast initial learning, then slow

      // Update range
      const newMinX = Math.min(prev.minX, prev.minX * (1 - alpha) + x * alpha)
      const newMaxX = Math.max(prev.maxX, prev.maxX * (1 - alpha) + x * alpha)
      const newMinY = Math.min(prev.minY, prev.minY * (1 - alpha) + y * alpha)
      const newMaxY = Math.max(prev.maxY, prev.maxY * (1 - alpha) + y * alpha)

      // Update center position (running average)
      const newCenterX = prev.centerX * 0.95 + x * 0.05
      const newCenterY = prev.centerY * 0.95 + y * 0.05

      // Ensure minimum range to avoid collapsing
      const MIN_RANGE = 0.35
      const rangeX = newMaxX - newMinX
      const rangeY = newMaxY - newMinY

      let finalMinX = newMinX
      let finalMaxX = newMaxX
      let finalMinY = newMinY
      let finalMaxY = newMaxY

      if (rangeX < MIN_RANGE) {
        const center = (newMinX + newMaxX) / 2
        finalMinX = Math.max(0, center - MIN_RANGE / 2)
        finalMaxX = Math.min(1, center + MIN_RANGE / 2)
      }

      if (rangeY < MIN_RANGE) {
        const center = (newMinY + newMaxY) / 2
        finalMinY = Math.max(0, center - MIN_RANGE / 2)
        finalMaxY = Math.min(1, center + MIN_RANGE / 2)
      }

      // TODO: Detect jitter and adjust smoothing
      // Calculate velocity variance to detect tremor
      // If high variance, increase smoothing factor

      return {
        ...prev,
        minX: finalMinX,
        maxX: finalMaxX,
        minY: finalMinY,
        maxY: finalMaxY,
        centerX: newCenterX,
        centerY: newCenterY,
        sampleCount: prev.sampleCount + 1
      }
    })
  }, [])

  /**
   * Adapt raw XY coordinates to personalized range
   * Maps user's natural movement range to full (0, 1) space
   */
  const adaptXY = useCallback((rawX: number, rawY: number): { x: number; y: number } => {
    const { minX, maxX, minY, maxY, sampleCount, centerX, centerY, deadZoneRadius, smoothingFactor } = personalizationData

    // Only apply adaptation after we have some data
    if (sampleCount < 15) {
      return { x: rawX, y: rawY }
    }

    // Calculate ranges
    const rangeX = maxX - minX
    const rangeY = maxY - minY

    // Map raw coordinates to personalized range
    // This effectively scales up small movements to fill the XY space
    let adaptedX = (rawX - minX) / rangeX
    let adaptedY = (rawY - minY) / rangeY

    // Clamp to [0, 1]
    adaptedX = Math.max(0, Math.min(1, adaptedX))
    adaptedY = Math.max(0, Math.min(1, adaptedY))

    // TODO: Apply dead zone
    // If position is near center and movement is small, snap to previous position
    // This helps users with baseline tremor maintain stable control
    // const distanceFromCenter = Math.sqrt(
    //   Math.pow(rawX - centerX, 2) + Math.pow(rawY - centerY, 2)
    // )
    // if (distanceFromCenter < deadZoneRadius) {
    //   // Apply dead zone logic
    // }

    return { x: adaptedX, y: adaptedY }
  }, [personalizationData])

  /**
   * Get current personalization stats for display
   */
  const getStats = useCallback(() => {
    const { minX, maxX, minY, maxY, sampleCount, smoothingFactor } = personalizationData
    return {
      rangeX: maxX - minX,
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
    adaptXY,
    updateMovementData,
    getStats,
    resetAdaptation
  }
}
