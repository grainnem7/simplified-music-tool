export interface BodyPart {
  id: string
  label: string
  keypoint: string
}

export interface MusicSettings {
  scale: 'major' | 'minor' | 'pentatonic'
  tempo: number
  volume: number
  instrument: string
}

export interface PerformanceSettings {
  sensitivity: number
  smoothing: number
  visualizationEnabled: boolean
}