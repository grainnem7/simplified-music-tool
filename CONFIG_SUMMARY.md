# Music Mapping Configuration System

## Overview

The movement-to-music AI now features a comprehensive and customizable mapping system that allows users to configure how their movements translate to musical parameters. The system is built on three key axes:

1. **X-Axis (Horizontal Movement)**
2. **Y-Axis (Vertical Movement)**
3. **Velocity Axis (Movement Speed)**

## Features

### 1. Flexible Axis Mapping

Each body part can be configured to map its movement to different musical parameters:

- **Pitch**: Control the musical note being played
- **Volume**: Control the loudness of the sound
- **Timbre**: Control the tone quality/brightness
- **Filter**: Control frequency filtering
- **Tempo**: Control the speed of playback
- **None**: Disable the axis

### 2. Axis Inversion

Users can invert any axis to match their intuitive expectations:
- Y-axis inverted: Moving up produces higher values (e.g., higher pitch)
- X-axis inverted: Moving right produces lower values

### 3. Multiple Instrument Types

Each body part can use different instruments:
- Piano: Classic piano sounds
- Synth: Electronic synthesizer
- Strings: String instruments
- Drums: Percussion sounds
- Bass: Bass instruments
- Pad: Ambient pad sounds

### 4. Musical Roles

Body parts can be assigned different roles in the music:
- **Melody**: Primary melodic lines
- **Harmony**: Supporting harmonic elements
- **Rhythm**: Rhythmic patterns
- **Bass**: Bass lines
- **Effects**: Special effects and ambience

### 5. Scale Selection

Choose from various musical scales:
- Pentatonic (default - always sounds good)
- Major
- Minor
- Blues
- Chromatic
- Japanese
- Arabian

### 6. Presets

Pre-configured setups for quick start:

#### Intuitive Preset
- Right hand: Y-axis controls pitch (up = higher)
- Left hand: Provides harmony with filter control
- Natural and easy to understand

#### Experimental Preset
- X-axis controls pitch
- Y-axis controls volume
- Movement speed controls timbre

#### Drummer Preset
- Different heights trigger different drum sounds
- Both hands configured for drumming

## Visual Aids

### Axis Visualizer
A diagram showing how each axis maps to parameters:
- Shows axis direction
- Indicates if inverted
- Displays current mapping

### Active Mappings Display
Shows which body parts are active and their assigned instruments/roles

## Usage Examples

### Creating a Virtual Theremin
1. Select right hand
2. Set Y-axis to control pitch (inverted)
3. Set X-axis to control volume
4. Choose "synth" instrument

### Building a Drum Kit
1. Select both hands
2. Set Y-axis to control pitch (different drum sounds)
3. Set velocity to control volume
4. Choose "drums" instrument

### Ambient Soundscape
1. Select multiple body parts
2. Assign different roles (melody, harmony, effects)
3. Use "pad" and "strings" instruments
4. Set slow attack/release times

## Technical Implementation

The system uses:
- React hooks for state management
- Tone.js for audio synthesis
- TypeScript for type safety
- Modular component architecture

## Future Enhancements

Potential additions:
- MIDI export
- Recording capabilities
- More instrument types
- Custom scale creation
- Multi-user collaboration
- Gesture recognition patterns