import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Types for body part configuration
export type BodyPartRole = 'melodic' | 'bass' | 'chord' | 'disabled'

export interface BodyPartConfig {
  role: BodyPartRole
  octaveRange: [number, number] // e.g., [3, 5]
  sensitivity: number // 0-1 multiplier
}

// Available scales
export const SCALES = {
  major: { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  pentatonic: { name: 'Pentatonic', intervals: [0, 2, 4, 7, 9] },
  blues: { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  dorian: { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  mixolydian: { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  wholeTone: { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10] },
} as const

export type ScaleType = keyof typeof SCALES

// Chord progression options
export const CHORD_PROGRESSIONS = {
  contemplative: {
    name: 'Contemplative',
    description: 'Gentle, introspective progression',
    chords: ['Dm7', 'Gm7', 'BbMaj7', 'FMaj7', 'Am7', 'CMaj7']
  },
  bright: {
    name: 'Bright',
    description: 'Uplifting, major progression',
    chords: ['CMaj7', 'FMaj7', 'G7', 'Am7', 'Dm7', 'G7']
  },
  modal: {
    name: 'Modal',
    description: 'Open, spacious progression',
    chords: ['Am7', 'Em7', 'FMaj7', 'G', 'Am7', 'Dm7']
  },
  jazz: {
    name: 'Jazz',
    description: 'Rich, complex harmonies',
    chords: ['Dm7', 'G7', 'CMaj7', 'FMaj7', 'Bm7b5', 'E7']
  }
} as const

export type ChordProgressionType = keyof typeof CHORD_PROGRESSIONS

// Synth oscillator types
export const SYNTH_TYPES = {
  sine: { name: 'Sine', description: 'Pure, smooth tone' },
  triangle: { name: 'Triangle', description: 'Soft, mellow tone' },
  square: { name: 'Square', description: 'Hollow, buzzy tone' },
  sawtooth: { name: 'Sawtooth', description: 'Bright, rich tone' },
  pulse: { name: 'Pulse', description: 'Sharp, retro tone' },
  pwm: { name: 'PWM', description: 'Animated, sweeping tone' },
} as const

export type SynthType = keyof typeof SYNTH_TYPES

// Filter types
export const FILTER_TYPES = {
  lowpass: { name: 'Lowpass', description: 'Removes high frequencies' },
  highpass: { name: 'Highpass', description: 'Removes low frequencies' },
  bandpass: { name: 'Bandpass', description: 'Keeps middle frequencies' },
} as const

export type FilterType = keyof typeof FILTER_TYPES

// Main settings interface
export interface MusicSettings {
  // Sensitivity controls
  movementThreshold: number      // 0.01 - 0.1, how much movement triggers notes
  confidenceThreshold: number    // 0.1 - 0.6, pose detection confidence
  noteInterval: number           // 100 - 500ms, minimum time between notes

  // Musical options
  scale: ScaleType
  rootNote: string               // C, C#, D, etc.
  chordProgression: ChordProgressionType
  tempoRange: [number, number]   // BPM range [min, max]

  // Synth/Instrument settings
  melodicSynthType: SynthType
  bassSynthType: SynthType
  chordSynthType: SynthType

  // Envelope settings (ADSR)
  attackTime: number             // 0 - 1 (maps to 0.001 - 0.5s)
  releaseTime: number            // 0 - 1 (maps to 0.1 - 2s)

  // Expression settings
  vibratoDepth: number           // 0 - 1 (0 = off, 1 = heavy vibrato)
  vibratoRate: number            // 0 - 1 (maps to 1 - 10 Hz)
  portamento: number             // 0 - 1 (0 = off, 1 = long glide)

  // Dynamics
  dynamicsRange: [number, number] // [min, max] velocity 0-1

  // Rhythm/Feel
  swingAmount: number            // 0 - 1 (0 = straight, 1 = heavy swing)

  // Harmony
  harmonicRichness: number       // 0 - 1 (adds overtones/harmonics)

  // Body part configurations
  bodyPartConfigs: Record<string, BodyPartConfig>

  // Audio settings
  reverbAmount: number           // 0 - 1
  delayAmount: number            // 0 - 1
  filterFrequency: number        // 0 - 1 (maps to 500-4000Hz)
  filterType: FilterType

  // Visual feedback
  showActiveIndicators: boolean
  showMovementIntensity: boolean
  showCurrentChord: boolean
}

// Default body part configurations
const DEFAULT_BODY_PART_CONFIGS: Record<string, BodyPartConfig> = {
  // Right side - melodic by default
  rightWrist: { role: 'melodic', octaveRange: [5, 6], sensitivity: 1 },
  rightElbow: { role: 'melodic', octaveRange: [4, 5], sensitivity: 1 },
  rightShoulder: { role: 'melodic', octaveRange: [4, 5], sensitivity: 1 },
  rightHip: { role: 'melodic', octaveRange: [3, 4], sensitivity: 1 },
  rightKnee: { role: 'melodic', octaveRange: [4, 5], sensitivity: 1 },
  rightAnkle: { role: 'melodic', octaveRange: [5, 6], sensitivity: 1 },
  // Left side - bass/chord by default
  leftWrist: { role: 'bass', octaveRange: [1, 3], sensitivity: 1 },
  leftElbow: { role: 'bass', octaveRange: [1, 3], sensitivity: 1 },
  leftShoulder: { role: 'chord', octaveRange: [2, 4], sensitivity: 1 },
  leftHip: { role: 'bass', octaveRange: [1, 2], sensitivity: 1 },
  leftKnee: { role: 'bass', octaveRange: [1, 3], sensitivity: 1 },
  leftAnkle: { role: 'bass', octaveRange: [1, 3], sensitivity: 1 },
  // Head
  nose: { role: 'disabled', octaveRange: [4, 5], sensitivity: 1 },
}

// Default settings
const DEFAULT_SETTINGS: MusicSettings = {
  movementThreshold: 0.02,
  confidenceThreshold: 0.3,
  noteInterval: 250,
  scale: 'minor',
  rootNote: 'D',
  chordProgression: 'contemplative',
  tempoRange: [60, 120],

  // Synth types
  melodicSynthType: 'triangle',
  bassSynthType: 'sine',
  chordSynthType: 'sine',

  // Envelope
  attackTime: 0.1,
  releaseTime: 0.4,

  // Expression
  vibratoDepth: 0,
  vibratoRate: 0.5,
  portamento: 0,

  // Dynamics
  dynamicsRange: [0.3, 0.8],

  // Rhythm
  swingAmount: 0,

  // Harmony
  harmonicRichness: 0.3,

  bodyPartConfigs: DEFAULT_BODY_PART_CONFIGS,
  reverbAmount: 0.6,
  delayAmount: 0.3,
  filterFrequency: 0.5,
  filterType: 'lowpass',
  showActiveIndicators: true,
  showMovementIntensity: true,
  showCurrentChord: true,
}

// Preset definitions
export interface Preset {
  name: string
  description: string
  settings: Partial<MusicSettings>
}

export const DEFAULT_PRESETS: Record<string, Preset> = {
  default: {
    name: 'Default',
    description: 'Balanced settings for general use',
    settings: DEFAULT_SETTINGS
  },
  subtleMovements: {
    name: 'Subtle Movements',
    description: 'High sensitivity for small gestures',
    settings: {
      movementThreshold: 0.008,
      confidenceThreshold: 0.25,
      noteInterval: 300,
    }
  },
  singleHand: {
    name: 'Single Hand',
    description: 'Optimized for one-handed use (right hand melodic + chord)',
    settings: {
      bodyPartConfigs: {
        ...DEFAULT_BODY_PART_CONFIGS,
        rightWrist: { role: 'melodic', octaveRange: [4, 6], sensitivity: 1.2 },
        rightElbow: { role: 'chord', octaveRange: [3, 5], sensitivity: 1 },
        rightShoulder: { role: 'bass', octaveRange: [2, 3], sensitivity: 0.8 },
        // Disable left side
        leftWrist: { role: 'disabled', octaveRange: [1, 3], sensitivity: 1 },
        leftElbow: { role: 'disabled', octaveRange: [1, 3], sensitivity: 1 },
        leftShoulder: { role: 'disabled', octaveRange: [2, 4], sensitivity: 1 },
      }
    }
  },
  ambient: {
    name: 'Ambient',
    description: 'Slow, spacious sounds with lots of reverb',
    settings: {
      noteInterval: 400,
      reverbAmount: 0.8,
      delayAmount: 0.5,
      filterFrequency: 0.3,
      tempoRange: [40, 80],
      melodicSynthType: 'sine',
      attackTime: 0.6,
      releaseTime: 0.8,
      vibratoDepth: 0.2,
      portamento: 0.3,
      harmonicRichness: 0.5,
    }
  },
  expressive: {
    name: 'Expressive',
    description: 'Fast response for dynamic performances',
    settings: {
      movementThreshold: 0.015,
      noteInterval: 150,
      reverbAmount: 0.4,
      tempoRange: [80, 160],
      attackTime: 0.05,
      releaseTime: 0.3,
      dynamicsRange: [0.2, 1.0],
      swingAmount: 0.2,
    }
  },
  pentatonic: {
    name: 'Pentatonic',
    description: 'Easy-to-use pentatonic scale, always sounds good',
    settings: {
      scale: 'pentatonic',
      rootNote: 'C',
    }
  }
}

// Context interface
interface MusicSettingsContextType {
  settings: MusicSettings
  updateSettings: (updates: Partial<MusicSettings>) => void
  updateBodyPartConfig: (bodyPart: string, config: Partial<BodyPartConfig>) => void
  loadPreset: (presetId: string) => void
  savePreset: (name: string, description: string) => void
  getSavedPresets: () => Record<string, Preset>
  deleteSavedPreset: (presetId: string) => void
  resetToDefault: () => void
}

const MusicSettingsContext = createContext<MusicSettingsContextType | null>(null)

// Local storage keys
const STORAGE_KEY = 'music-tool-settings'
const PRESETS_STORAGE_KEY = 'music-tool-presets'

export function MusicSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MusicSettings>(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e)
    }
    return DEFAULT_SETTINGS
  })

  // Save to localStorage when settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e)
    }
  }, [settings])

  const updateSettings = (updates: Partial<MusicSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const updateBodyPartConfig = (bodyPart: string, config: Partial<BodyPartConfig>) => {
    setSettings(prev => ({
      ...prev,
      bodyPartConfigs: {
        ...prev.bodyPartConfigs,
        [bodyPart]: {
          ...prev.bodyPartConfigs[bodyPart],
          ...config
        }
      }
    }))
  }

  const loadPreset = (presetId: string) => {
    // Check built-in presets first
    if (DEFAULT_PRESETS[presetId]) {
      setSettings(prev => ({
        ...prev,
        ...DEFAULT_PRESETS[presetId].settings
      }))
      return
    }

    // Check saved presets
    const savedPresets = getSavedPresets()
    if (savedPresets[presetId]) {
      setSettings(prev => ({
        ...prev,
        ...savedPresets[presetId].settings
      }))
    }
  }

  const savePreset = (name: string, description: string) => {
    try {
      const savedPresets = getSavedPresets()
      const presetId = `custom-${Date.now()}`
      savedPresets[presetId] = {
        name,
        description,
        settings: { ...settings }
      }
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(savedPresets))
    } catch (e) {
      console.warn('Failed to save preset:', e)
    }
  }

  const getSavedPresets = (): Record<string, Preset> => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load presets:', e)
    }
    return {}
  }

  const deleteSavedPreset = (presetId: string) => {
    try {
      const savedPresets = getSavedPresets()
      delete savedPresets[presetId]
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(savedPresets))
    } catch (e) {
      console.warn('Failed to delete preset:', e)
    }
  }

  const resetToDefault = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <MusicSettingsContext.Provider value={{
      settings,
      updateSettings,
      updateBodyPartConfig,
      loadPreset,
      savePreset,
      getSavedPresets,
      deleteSavedPreset,
      resetToDefault
    }}>
      {children}
    </MusicSettingsContext.Provider>
  )
}

export function useMusicSettings() {
  const context = useContext(MusicSettingsContext)
  if (!context) {
    throw new Error('useMusicSettings must be used within a MusicSettingsProvider')
  }
  return context
}
