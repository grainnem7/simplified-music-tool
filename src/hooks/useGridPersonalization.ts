import { useState, useCallback, useEffect } from 'react'
import { GridPad } from '../components/GridPadsInstrument'

/**
 * Grid personalization data
 * Tracks user's movement patterns and adapts pad layout accordingly
 */
interface PersonalizationData {
  // Movement range tracking
  minX: number
  maxX: number
  minY: number
  maxY: number
  sampleCount: number

  // Per-pad statistics for adaptive sizing
  padHits: Record<string, number>     // How many times each pad was hit
  padMisses: Record<string, number>   // Estimated misses (rapid position changes near pad)
}

const DEFAULT_DATA: PersonalizationData = {
  minX: 0.15,
  maxX: 0.85,
  minY: 0.15,
  maxY: 0.85,
  sampleCount: 0,
  padHits: {},
  padMisses: {}
}

const STORAGE_KEY = 'grid-pads-personalization'

/**
 * Hook for personalizing grid pad layout based on user's movement patterns
 *
 * AI/Personalization features:
 * - Tracks user's movement range and adapts pad positions to fit
 * - Monitors which pads are hit vs missed
 * - Can enlarge pads that are frequently missed (optional)
 * - Uses simple heuristics (no complex ML required)
 *
 * IMPORTANT: This ONLY adapts spatial properties (position, size)
 * It NEVER changes which sound a pad produces - that mapping is fixed
 *
 * TODO: Could enhance with ML to:
 * - Predict optimal pad sizes based on user's motor control
 * - Detect movement patterns and adjust grid layout
 * - Learn user's preferred pad arrangements
 */
export function useGridPersonalization(defaultPads: GridPad[]) {
  // Load saved data from localStorage
  const [personalizationData, setPersonalizationData] = useState<PersonalizationData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load grid personalization:', e)
    }
    return DEFAULT_DATA
  })

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(personalizationData))
    } catch (e) {
      console.warn('Failed to save grid personalization:', e)
    }
  }, [personalizationData])

  /**
   * Update movement data with a new cursor position
   * This is called every time the cursor moves
   */
  const updateMovementData = useCallback((x: number, y: number) => {
    setPersonalizationData(prev => {
      // Exponential smoothing for gradual adaptation
      const alpha = prev.sampleCount < 30 ? 0.15 : 0.03 // Fast initial learning, then slow

      const newMinX = Math.min(prev.minX, prev.minX * (1 - alpha) + x * alpha)
      const newMaxX = Math.max(prev.maxX, prev.maxX * (1 - alpha) + x * alpha)
      const newMinY = Math.min(prev.minY, prev.minY * (1 - alpha) + y * alpha)
      const newMaxY = Math.max(prev.maxY, prev.maxY * (1 - alpha) + y * alpha)

      // Ensure minimum range to avoid collapsing
      const MIN_RANGE = 0.4
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
        ...prev,
        minX: finalMinX,
        maxX: finalMaxX,
        minY: finalMinY,
        maxY: finalMaxY,
        sampleCount: prev.sampleCount + 1
      }
    })
  }, [])

  /**
   * Record a successful pad hit
   * Used to track which pads are frequently used
   */
  const recordPadHit = useCallback((padId: string) => {
    setPersonalizationData(prev => ({
      ...prev,
      padHits: {
        ...prev.padHits,
        [padId]: (prev.padHits[padId] || 0) + 1
      }
    }))
  }, [])

  /**
   * Record a potential miss near a pad
   * This can be used to identify pads that need to be larger
   *
   * TODO: Implement miss detection heuristic
   * - Detect rapid direction changes near pad boundaries
   * - Track "near misses" where cursor came close but didn't enter
   */
  const recordPadMiss = useCallback((padId: string) => {
    setPersonalizationData(prev => ({
      ...prev,
      padMisses: {
        ...prev.padMisses,
        [padId]: (prev.padMisses[padId] || 0) + 1
      }
    }))
  }, [])

  /**
   * Enlarge a specific pad
   * Can be called manually or automatically based on miss statistics
   */
  const enlargePad = useCallback((padId: string, amount: number = 0.05) => {
    // This would be implemented by adjusting pad size in adapted pads
    // For now, this is a placeholder for future enhancement
    console.log(`Enlarging pad ${padId} by ${amount * 100}%`)
  }, [])

  /**
   * Adapt pad positions and sizes based on personalization data
   */
  const adaptedPads: GridPad[] = defaultPads.map(pad => {
    // Only apply adaptation after we have some data
    if (personalizationData.sampleCount < 20) {
      return pad
    }

    const { minX, maxX, minY, maxY } = personalizationData

    // Map pad center to user's observed coordinate space
    // This effectively translates and scales the grid to fit user's range

    // Calculate how much of the screen the user actually uses
    const userRangeX = maxX - minX
    const userRangeY = maxY - minY

    // Map the pad's normalized center position to user's range
    const adaptedCenterX = minX + pad.centerX * userRangeX
    const adaptedCenterY = minY + pad.centerY * userRangeY

    // Scale pad size proportionally to user's range
    // If user moves in a smaller area, pads should be smaller
    const adaptedWidth = pad.width * userRangeX
    const adaptedHeight = pad.height * userRangeY

    // Optional: Enlarge pads with high miss rates
    // TODO: Implement this based on padMisses data
    // const missRate = (personalizationData.padMisses[pad.id] || 0) /
    //                  Math.max(1, personalizationData.padHits[pad.id] || 1)
    // const sizeMultiplier = missRate > 0.5 ? 1.1 : 1.0

    return {
      ...pad,
      centerX: adaptedCenterX,
      centerY: adaptedCenterY,
      width: adaptedWidth,
      height: adaptedHeight
    }
  })

  /**
   * Reset personalization to defaults
   */
  const resetAdaptation = useCallback(() => {
    setPersonalizationData(DEFAULT_DATA)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    adaptedPads,
    personalizationData,
    updateMovementData,
    recordPadHit,
    recordPadMiss,
    enlargePad,
    resetAdaptation
  }
}
