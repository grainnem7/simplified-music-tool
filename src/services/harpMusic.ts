import * as Tone from 'tone';

// Pedal positions type
export type PedalPosition = 'flat' | 'natural' | 'sharp';
export type PedalPositions = { [key: string]: PedalPosition };

// Note with octave type
export interface HarpNote {
  note: string;      // Base note (C, D, E, F, G, A, B)
  octave: number;    // Octave number (1-7)
  modifier: string;  // '', 'b', or '#'
}

// Glissando configuration
export interface GlissandoConfig {
  duration: number;  // Total duration in seconds
  direction: 'up' | 'down';
  velocity: number;  // 0-1
}

// Convert pedal position to semitone offset
const pedalToSemitone = (position: PedalPosition): number => {
  switch (position) {
    case 'flat': return -1;
    case 'natural': return 0;
    case 'sharp': return 1;
  }
};

// Parse a harp string notation (e.g., "C4") into components
export const parseHarpString = (stringNotation: string): HarpNote => {
  const note = stringNotation[0];
  const octave = parseInt(stringNotation.slice(1));
  return { note, octave, modifier: '' };
};

// Get the actual note to play based on pedal positions
export const getActualNote = (baseNote: string, pedalPositions: PedalPositions): string => {
  const { note, octave } = parseHarpString(baseNote);
  const position = pedalPositions[note] || 'natural';
  
  let modifier = '';
  if (position === 'flat') modifier = 'b';
  else if (position === 'sharp') modifier = '#';
  
  return `${note}${modifier}${octave}`;
};

// Create a harp-like synth
export const createHarpSynth = (): Tone.PolySynth => {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle'
    },
    envelope: {
      attack: 0.005,
      decay: 0.8,
      sustain: 0.1,
      release: 2.5
    },
    volume: -12
  }).toDestination();

  // Add reverb for more realistic harp sound
  const reverb = new Tone.Reverb({
    decay: 2.5,
    wet: 0.3
  }).toDestination();

  synth.connect(reverb);

  return synth;
};

// Play a single harp note
export const playHarpNote = (
  synth: Tone.PolySynth,
  note: string,
  duration: string = '8n',
  velocity: number = 0.8
): void => {
  synth.triggerAttackRelease(note, duration, undefined, velocity);
};

// Get all notes in the current scale based on pedal positions
export const getScaleNotes = (pedalPositions: PedalPositions): string[] => {
  const notes: string[] = [];
  const baseNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  for (let octave = 1; octave <= 7; octave++) {
    for (const baseNote of baseNotes) {
      // Skip notes that don't exist on the harp
      if (octave === 1 && ['A', 'B'].includes(baseNote)) continue;
      if (octave === 7 && !['C', 'D', 'E', 'F', 'G'].includes(baseNote)) continue;
      
      const actualNote = getActualNote(`${baseNote}${octave}`, pedalPositions);
      notes.push(actualNote);
    }
  }
  
  return notes;
};

// Play a glissando (sweep across strings)
export const playGlissando = async (
  synth: Tone.PolySynth,
  pedalPositions: PedalPositions,
  config: GlissandoConfig,
  startString: number = 0,
  endString: number = 46
): Promise<void> => {
  const scaleNotes = getScaleNotes(pedalPositions);
  const notesToPlay = scaleNotes.slice(startString, endString + 1);
  
  if (config.direction === 'down') {
    notesToPlay.reverse();
  }
  
  const noteDelay = config.duration / notesToPlay.length;
  
  for (let i = 0; i < notesToPlay.length; i++) {
    setTimeout(() => {
      playHarpNote(synth, notesToPlay[i], '4n', config.velocity);
    }, i * noteDelay * 1000);
  }
};

// Chord progressions for different scales
export const getChordProgression = (pedalPositions: PedalPositions, chordType: 'major' | 'minor' | 'seventh'): string[][] => {
  const scaleNotes = getScaleNotes(pedalPositions);
  const chords: string[][] = [];
  
  // Simple implementation - can be expanded
  const chordIntervals = chordType === 'major' ? [0, 2, 4] : 
                        chordType === 'minor' ? [0, 2, 4] : // Adjust for minor thirds
                        [0, 2, 4, 6]; // Seventh
  
  // Create chords based on scale degrees
  for (let i = 0; i < 7; i++) {
    const chord: string[] = [];
    for (const interval of chordIntervals) {
      const noteIndex = (i + interval) % scaleNotes.length;
      if (scaleNotes[noteIndex]) {
        chord.push(scaleNotes[noteIndex]);
      }
    }
    if (chord.length >= 3) {
      chords.push(chord);
    }
  }
  
  return chords;
};

// Common glissando patterns
export const GLISSANDO_PATTERNS = {
  'Full Ascending': { direction: 'up' as const, duration: 2, velocity: 0.7 },
  'Full Descending': { direction: 'down' as const, duration: 2, velocity: 0.7 },
  'Quick Up': { direction: 'up' as const, duration: 0.5, velocity: 0.8 },
  'Quick Down': { direction: 'down' as const, duration: 0.5, velocity: 0.8 },
  'Gentle Sweep': { direction: 'up' as const, duration: 3, velocity: 0.5 },
  'Cascade': { direction: 'down' as const, duration: 4, velocity: 0.6 }
};

// Map hand movement speed to glissando parameters
export const mapMovementToGlissando = (
  handSpeed: number, // pixels per frame
  direction: 'left' | 'right'
): GlissandoConfig => {
  // Normalize speed (0-100 pixels/frame to 0-1)
  const normalizedSpeed = Math.min(handSpeed / 100, 1);
  
  return {
    direction: direction === 'right' ? 'up' : 'down',
    duration: 0.5 + (1 - normalizedSpeed) * 2.5, // Faster movement = shorter duration
    velocity: 0.5 + normalizedSpeed * 0.4 // Faster movement = louder
  };
};

// Calculate hand speed from position history
export const calculateHandSpeed = (
  currentPos: { x: number, y: number },
  lastPos: { x: number, y: number }
): number => {
  const dx = currentPos.x - lastPos.x;
  const dy = currentPos.y - lastPos.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Detect if hand movement suggests a glissando
export const detectGlissando = (
  handPositions: { x: number, y: number }[],
  threshold: number = 30
): { isGlissando: boolean, direction: 'left' | 'right', speed: number } => {
  if (handPositions.length < 2) {
    return { isGlissando: false, direction: 'right', speed: 0 };
  }
  
  const recent = handPositions.slice(-5); // Last 5 positions
  let totalDx = 0;
  let totalSpeed = 0;
  
  for (let i = 1; i < recent.length; i++) {
    const dx = recent[i].x - recent[i-1].x;
    totalDx += dx;
    totalSpeed += Math.abs(dx);
  }
  
  const avgSpeed = totalSpeed / (recent.length - 1);
  const isGlissando = avgSpeed > threshold;
  const direction = totalDx > 0 ? 'right' : 'left';
  
  return { isGlissando, direction, speed: avgSpeed };
};