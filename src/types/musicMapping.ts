// Types for customizable music mapping configuration

export interface AxisMapping {
  parameter: 'pitch' | 'volume' | 'timbre' | 'tempo' | 'filter' | 'none'
  range: [number, number] // min, max values
  invert: boolean // e.g., invert Y axis so up = higher pitch
}

export interface BodyPartMapping {
  bodyPart: string
  enabled: boolean
  instrument: 'piano' | 'synth' | 'strings' | 'drums' | 'bass' | 'pad'
  role: 'melody' | 'harmony' | 'rhythm' | 'bass' | 'effects'
  xAxis: AxisMapping
  yAxis: AxisMapping
  velocityAxis: AxisMapping // movement speed
  scale: string[] // notes in the scale to use
  octaveRange: [number, number] // min and max octave
}

export interface MusicMappingConfig {
  name: string
  description: string
  globalScale: string[] // default scale for all parts
  mappings: Record<string, BodyPartMapping>
}

// Preset configurations
export const PRESET_CONFIGS: Record<string, MusicMappingConfig> = {
  intuitive: {
    name: 'Intuitive',
    description: 'Natural mapping with hands up = higher pitch',
    globalScale: ['C', 'D', 'E', 'G', 'A'], // Pentatonic
    mappings: {
      rightWrist: {
        bodyPart: 'rightWrist',
        enabled: true,
        instrument: 'piano',
        role: 'melody',
        xAxis: {
          parameter: 'none',
          range: [0, 1],
          invert: false
        },
        yAxis: {
          parameter: 'pitch',
          range: [0, 1],
          invert: true // Higher position = higher pitch
        },
        velocityAxis: {
          parameter: 'volume',
          range: [0.1, 0.8],
          invert: false
        },
        scale: ['C', 'D', 'E', 'G', 'A'],
        octaveRange: [3, 6]
      },
      leftWrist: {
        bodyPart: 'leftWrist',
        enabled: true,
        instrument: 'synth',
        role: 'harmony',
        xAxis: {
          parameter: 'filter',
          range: [200, 2000],
          invert: false
        },
        yAxis: {
          parameter: 'pitch',
          range: [0, 1],
          invert: true
        },
        velocityAxis: {
          parameter: 'volume',
          range: [0.1, 0.6],
          invert: false
        },
        scale: ['C', 'E', 'G'],
        octaveRange: [2, 4]
      }
    }
  },
  experimental: {
    name: 'Experimental',
    description: 'X controls pitch, Y controls volume',
    globalScale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    mappings: {
      rightWrist: {
        bodyPart: 'rightWrist',
        enabled: true,
        instrument: 'synth',
        role: 'melody',
        xAxis: {
          parameter: 'pitch',
          range: [0, 1],
          invert: false
        },
        yAxis: {
          parameter: 'volume',
          range: [0.1, 0.9],
          invert: true // Up = louder
        },
        velocityAxis: {
          parameter: 'timbre',
          range: [0, 1],
          invert: false
        },
        scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        octaveRange: [4, 6]
      }
    }
  },
  drummer: {
    name: 'Drummer',
    description: 'Different heights trigger different drums',
    globalScale: ['C'],
    mappings: {
      rightWrist: {
        bodyPart: 'rightWrist',
        enabled: true,
        instrument: 'drums',
        role: 'rhythm',
        xAxis: {
          parameter: 'none',
          range: [0, 1],
          invert: false
        },
        yAxis: {
          parameter: 'pitch', // Different drum sounds at different heights
          range: [0, 4],
          invert: true
        },
        velocityAxis: {
          parameter: 'volume',
          range: [0.3, 0.9],
          invert: false
        },
        scale: ['C'], // Drums typically use single note
        octaveRange: [2, 4]
      },
      leftWrist: {
        bodyPart: 'leftWrist',
        enabled: true,
        instrument: 'drums',
        role: 'rhythm',
        xAxis: {
          parameter: 'none',
          range: [0, 1],
          invert: false
        },
        yAxis: {
          parameter: 'pitch',
          range: [0, 4],
          invert: true
        },
        velocityAxis: {
          parameter: 'volume',
          range: [0.3, 0.9],
          invert: false
        },
        scale: ['C'],
        octaveRange: [2, 4]
      }
    }
  }
}

export const AVAILABLE_SCALES = {
  pentatonic: ['C', 'D', 'E', 'G', 'A'],
  major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  minor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  blues: ['C', 'Eb', 'F', 'Gb', 'G', 'Bb'],
  chromatic: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  japanese: ['C', 'D', 'Eb', 'G', 'Ab'],
  arabian: ['C', 'D', 'E', 'F', 'G', 'Ab', 'B']
}