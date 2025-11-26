import { useState, useCallback, useEffect } from 'react'
import { Zone } from '../components/MovementZonesInstrument'

/**
 * Movement range tracking for personalization
 * Stores the min/max x and y coordinates observed during user's movements
 */
interface MovementRange {
  minX: number
  maxX: number
  minY: number
  maxY: number
  sampleCount: number
}

const DEFAULT_RANGE: MovementRange = {
  minX: 0.2,
  maxX: 0.8,
  minY: 0.2,
  maxY: 0.8,
  sampleCount: 0
}

const STORAGE_KEY = 'movement-zones-personalization'

/**
 * Hook for personalizing zone boundaries based on user's movement range
 *
 * AI/Personalization hooks:
 * - Tracks user's movement range over time
 * - Gradually adapts zone boundaries to fit the user's natural movement range
 * - Does NOT change the musical meaning of zones - only adjusts spatial boundaries
 * - Uses simple heuristics (could be enhanced with ML for better adaptation)
 *
 * TODO: Could enhance with ML to:
 * - Predict user's comfortable movement range faster
 * - Detect movement patterns and adapt zone sensitivity
 * - Learn user preferences for zone sizes
 */
export function useZonePersonalization(defaultZones: Zone[]) {
  // Load saved range from localStorage
  const [movementRange, setMovementRange] = useState<MovementRange>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load movement range:', e)
    }
    return DEFAULT_RANGE
  })

  // Save to localStorage when range changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movementRange))
    } catch (e) {
      console.warn('Failed to save movement range:', e)
    }
  }, [movementRange])

  /**
   * Update the observed movement range with a new position
   */
  const updateMovementRange = useCallback((x: number, y: number) => {
    setMovementRange(prev => {
      // Gradually expand the range to include new positions
      // Use exponential smoothing to avoid sudden jumps

      const alpha = 0.05  // Smoothing factor (lower = slower adaptation)

      // Only update if we have enough samples, otherwise grow range faster
      const adaptRate = prev.sampleCount < 50 ? 0.2 : alpha

      const newMinX = Math.min(prev.minX, prev.minX * (1 - adaptRate) + x * adaptRate)
      const newMaxX = Math.max(prev.maxX, prev.maxX * (1 - adaptRate) + x * adaptRate)
      const newMinY = Math.min(prev.minY, prev.minY * (1 - adaptRate) + y * adaptRate)
      const newMaxY = Math.max(prev.maxY, prev.maxY * (1 - adaptRate) + y * adaptRate)

      // Ensure minimum range to avoid zones collapsing
      const MIN_RANGE = 0.3
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

      return {
        minX: finalMinX,
        maxX: finalMaxX,
        minY: finalMinY,
        maxY: finalMaxY,
        sampleCount: prev.sampleCount + 1
      }
    })
  }, [])

  /**
   * Map normalized coordinates (0-1) to user's movement range
   */
  const mapToUserRange = useCallback((normalizedX: number, normalizedY: number): { x: number; y: number } => {
    // Only apply adaptation after we have enough samples
    if (movementRange.sampleCount < 10) {
      return { x: normalizedX, y: normalizedY }
    }

    const { minX, maxX, minY, maxY } = movementRange

    // Map from [0,1] to user's observed range
    const x = minX + normalizedX * (maxX - minX)
    const y = minY + normalizedY * (maxY - minY)

    return { x, y }
  }, [movementRange])

  /**
   * Adapt zone boundaries to fit user's movement range
   */
  const adaptedZones: Zone[] = defaultZones.map(zone => {
    // Only adapt zones after we have sufficient data
    if (movementRange.sampleCount < 10) {
      return zone
    }

    const { minX, maxX, minY, maxY } = movementRange

    // Calculate the zone's position in the user's coordinate space
    // This effectively scales and translates the zones to fit the user's range

    const adaptedX = minX + zone.x * (maxX - minX)
    const adaptedY = minY + zone.y * (maxY - minY)
    const adaptedWidth = zone.width * (maxX - minX)
    const adaptedHeight = zone.height * (maxY - minY)

    return {
      ...zone,
      x: adaptedX,
      y: adaptedY,
      width: adaptedWidth,
      height: adaptedHeight
    }
  })

  /**
   * Reset personalization to default
   */
  const resetAdaptation = useCallback(() => {
    setMovementRange(DEFAULT_RANGE)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    adaptedZones,
    movementRange,
    updateMovementRange,
    resetAdaptation,
    mapToUserRange
  }
}
