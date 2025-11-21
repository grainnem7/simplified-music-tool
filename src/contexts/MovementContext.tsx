import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/**
 * Movement Context - Generic, Non-Prescriptive Movement System
 *
 * This context manages user-defined movements for music generation.
 * It intentionally avoids any assumptions about body parts, limbs,
 * or "normal" anatomy. Users define their own movements through
 * demonstration, not selection from a body map.
 *
 * Design principles:
 * - No normative body assumptions
 * - Users demonstrate movements rather than selecting from lists
 * - Supports any movement pattern: limbs, mobility devices, small gestures
 * - Abstract movement concepts, not anatomical references
 */

// Unique identifier for each movement
export type MovementId = string

/**
 * Represents a motion sample captured during movement recording.
 * This is intentionally abstract - it captures motion patterns
 * without assuming what body parts created them.
 */
export interface MotionSample {
  // Timestamp when the sample was recorded
  timestamp: number
  // Duration of the recording in milliseconds
  duration: number
  // Array of motion vectors detected during recording
  // Each vector represents detected motion (direction + magnitude)
  motionVectors: Array<{
    x: number
    y: number
    magnitude: number
  }>
  // Optional: raw pose data for advanced matching (internal use only)
  // This may contain keypoint data but is never exposed in UI
  rawPoseData?: any
}

/**
 * A user-defined movement input.
 * Represents any motion pattern the user wants to use for music control.
 * Could be a hand wave, head tilt, full body movement, or subtle gesture.
 */
export interface Movement {
  id: MovementId
  // User-provided name (e.g., "Movement A", "Big sweep", "Nod")
  name: string
  // When this movement was created
  createdAt: string
  // The recorded sample that defines this movement pattern
  sample: MotionSample | null
  // Whether this movement is currently being detected
  isActive?: boolean
  // Musical role this movement controls (can be assigned later)
  musicalRole?: 'melodic' | 'bass' | 'chord' | 'control'
  // Optional configuration for music generation
  config?: {
    octaveRange: [number, number]
    sensitivity: number
  }
}

/**
 * Default movement used for "Play now" mode.
 * This provides a simple, generic mapping so users can
 * start making sound immediately without setup.
 */
export const DEFAULT_MOVEMENT: Movement = {
  id: 'default-any-motion',
  name: 'Any Movement',
  createdAt: new Date().toISOString(),
  sample: null, // Uses general motion detection
  musicalRole: 'melodic'
}

// Context state interface
interface MovementContextType {
  // List of user-defined movements
  movements: Movement[]
  // Whether user has completed the movement wizard
  hasCustomMovements: boolean
  // Whether using default "Play now" mode
  isDefaultMode: boolean

  // Actions
  addMovement: (movement: Omit<Movement, 'id' | 'createdAt'>) => Movement
  updateMovement: (id: MovementId, updates: Partial<Movement>) => void
  removeMovement: (id: MovementId) => void
  clearAllMovements: () => void
  setDefaultMode: (useDefault: boolean) => void

  // Get movements for the music engine
  getActiveMovements: () => Movement[]
}

const MovementContext = createContext<MovementContextType | null>(null)

// Local storage key
const STORAGE_KEY = 'music-tool-movements'

export function MovementProvider({ children }: { children: ReactNode }) {
  const [movements, setMovements] = useState<Movement[]>(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load movements from localStorage:', e)
    }
    return []
  })

  const [isDefaultMode, setIsDefaultMode] = useState<boolean>(() => {
    // If no custom movements exist, start in default mode
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.length === 0
      }
    } catch (e) {
      // Ignore
    }
    return true
  })

  // Save to localStorage when movements change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movements))
    } catch (e) {
      console.warn('Failed to save movements to localStorage:', e)
    }
  }, [movements])

  const hasCustomMovements = movements.length > 0

  const addMovement = (movementData: Omit<Movement, 'id' | 'createdAt'>): Movement => {
    const newMovement: Movement = {
      ...movementData,
      id: `movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }
    setMovements(prev => [...prev, newMovement])
    setIsDefaultMode(false)
    return newMovement
  }

  const updateMovement = (id: MovementId, updates: Partial<Movement>) => {
    setMovements(prev => prev.map(m =>
      m.id === id ? { ...m, ...updates } : m
    ))
  }

  const removeMovement = (id: MovementId) => {
    setMovements(prev => prev.filter(m => m.id !== id))
  }

  const clearAllMovements = () => {
    setMovements([])
    setIsDefaultMode(true)
  }

  const setDefaultMode = (useDefault: boolean) => {
    setIsDefaultMode(useDefault)
  }

  const getActiveMovements = (): Movement[] => {
    if (isDefaultMode || movements.length === 0) {
      return [DEFAULT_MOVEMENT]
    }
    return movements
  }

  return (
    <MovementContext.Provider value={{
      movements,
      hasCustomMovements,
      isDefaultMode,
      addMovement,
      updateMovement,
      removeMovement,
      clearAllMovements,
      setDefaultMode,
      getActiveMovements
    }}>
      {children}
    </MovementContext.Provider>
  )
}

export function useMovements() {
  const context = useContext(MovementContext)
  if (!context) {
    throw new Error('useMovements must be used within a MovementProvider')
  }
  return context
}

/**
 * Helper to generate default movement names.
 * Uses letters (Movement A, Movement B, etc.) rather than numbers
 * to feel more personal and less technical.
 */
export function generateMovementName(index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (index < 26) {
    return `Movement ${letters[index]}`
  }
  return `Movement ${index + 1}`
}
