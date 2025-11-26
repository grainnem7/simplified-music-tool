# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a movement-to-music AI generation web application that transforms human movements into music using machine learning. Users can select specific body parts to track for musical generation while ignoring others.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Run linter (when dependencies are installed)
npm run lint

# Preview production build
npm run preview
```

**Note**: If you encounter permission issues in WSL, see INSTALLATION.md for alternative installation methods.

## Architecture & Key Components

### Core Technologies
- **React 18** with TypeScript for UI
- **Vite** for development and building
- **TensorFlow.js** for pose detection
- **Tone.js** for audio synthesis
- **@tensorflow-models/pose-detection** with MoveNet model
- **react-webcam** for camera access

### Component Structure

```
src/
├── components/
│   ├── WelcomeScreen.tsx             # Initial welcome interface
│   ├── SetupScreen.tsx               # Body part selection setup
│   ├── BodyPartSelector.tsx          # UI for selecting tracked body parts
│   ├── WebcamCapture.tsx             # Handles webcam feed
│   ├── PerformanceView.tsx           # Main performance interface (supports mode switching)
│   ├── MusicGenerator.tsx            # Music visualization component
│   ├── MovementZonesInstrument.tsx   # NEW: Simplified zones-based instrument
│   ├── GridPadsInstrument.tsx        # NEW: ThumbJam-style grid pads instrument
│   ├── XYControllerInstrument.tsx    # NEW: Kaoss Pad-style XY controller
│   └── NoteLanesInstrument.tsx       # NEW: ThumbJam-inspired lane-based instrument
├── services/
│   ├── poseDetection.ts        # Pose detection service utilities
│   ├── musicMapping.ts         # Movement to music parameter mapping
│   └── zoneMapping.ts          # NEW: Cursor extraction from pose (shared by all modes)
├── hooks/
│   ├── usePoseDetection.ts           # Custom hook for pose detection
│   ├── useMusicGeneration.ts         # Custom hook for music generation
│   ├── useZonePersonalization.ts     # NEW: Zone boundary adaptation hook
│   ├── useGridPersonalization.ts     # NEW: Grid pad layout adaptation hook
│   ├── useXYPersonalization.ts       # NEW: XY controller range adaptation hook
│   └── useLanePersonalization.ts     # NEW: Note lanes vertical range adaptation hook
└── types/
    └── index.ts                # TypeScript type definitions
```

### Key Implementation Details

1. **Pose Detection**: 
   - Uses MoveNet SINGLEPOSE_LIGHTNING model for performance
   - Implements frame-by-frame detection using requestAnimationFrame
   - Confidence threshold of 0.3 for keypoint detection

2. **Music Generation**:
   - Maps body positions to musical notes using pentatonic scale
   - Y-axis position determines pitch (higher = higher note)
   - X-axis position determines note duration (left = 16th, right = 8th)
   - Movement speed affects tempo (60-180 BPM range)
   - Uses Tone.js PolySynth for multi-note playback

3. **Body Part Mapping**:
   - Maps UI body part names to TensorFlow keypoint names
   - Supports 13 trackable body parts
   - Includes presets: Conductor Mode, Dancer Mode, Full Body

### Component-Specific Notes

**App.tsx**: Main application state machine with three states:
- `welcome`: Initial screen
- `setup`: Body part selection
- `performance`: Active music generation

**BodyPartSelector.tsx**: 
- Grid layout for body part checkboxes
- Preset configurations for quick setup
- All styles in separate CSS file

**WebcamCapture.tsx**:
- Uses react-webcam with mirrored video (scaleX(-1))
- 640x480 resolution for consistency
- ForwardRef implementation for parent access

**PerformanceView.tsx**:
- Orchestrates pose detection and music generation
- Manages start/stop of performance
- Handles cleanup on unmount

**usePoseDetection.ts**:
- Lazy initialization of detector
- Cleanup of animation frames
- Error handling for detection failures

**musicMapping.ts**:
- Pentatonic scale for musical output
- Dynamic tempo calculation
- Position-based note selection

### Movement Zones Mode (NEW)

The application now includes a **Movement Zones** mode - a simplified, predictable instrument interface designed for accessibility and ease of use.

**Key Features**:
- **Visual Zones**: 6 large, clearly labeled zones (2×3 grid)
- **Predictable Mapping**: Each zone always produces the same type of sound
- **Abstract Cursor**: Non-body-specific movement indicator
- **Adaptive Boundaries**: Zones adapt to user's natural movement range
- **High Accessibility**: High contrast, large touch targets, no reliance on color alone

**Component**: [MovementZonesInstrument.tsx](src/components/MovementZonesInstrument.tsx)
- Renders zone grid with labels and borders
- Tracks cursor position from pose data
- Plays sounds using Tone.js when cursor enters a zone
- Uses personalization hook for adaptive boundaries

**Service**: [zoneMapping.ts](src/services/zoneMapping.ts)
- Extracts cursor position from pose (torso centroid or fallback strategies)
- Applies exponential smoothing to reduce jitter
- Modular design allows easy swapping of tracking strategies

**Hook**: [useZonePersonalization.ts](src/hooks/useZonePersonalization.ts)
- Tracks user's movement range (min/max X and Y)
- Gradually adapts zone boundaries to fit user's range
- Stores adaptation in localStorage
- Uses simple heuristics (could be enhanced with ML)

**Mode Switching**: Users can toggle between Traditional, Zones, and Grid Pads modes via [PerformanceView.tsx](src/components/PerformanceView.tsx)

**Documentation**: See [MOVEMENT_ZONES.md](MOVEMENT_ZONES.md) for detailed documentation.

### Grid Pads Mode (NEW)

The application now includes a **Grid Pads** mode - a ThumbJam-style grid of large, discrete musical pads that can be triggered by movement or direct touch.

**Key Features**:
- **Discrete Pads**: 6 large pads (2×3 grid) with clear gaps between them
- **Dual Interaction**: Works with both movement tracking and direct touch/tap
- **Musical Chords**: Each pad plays a distinct chord (e.g., C Major, G Major)
- **High Contrast**: Bold colors, thick borders (6-8px), clear visual feedback
- **Touch/Movement Toggle**: Users can switch between interaction modes
- **Debouncing**: 400ms delay prevents rapid re-triggering

**Component**: [GridPadsInstrument.tsx](src/components/GridPadsInstrument.tsx)
- Renders button-like pads with rounded corners
- Supports both pose-based and touch-based interaction
- Plays chords using Tone.js PolySynth
- Uses personalization hook for adaptive pad layout

**Hook**: [useGridPersonalization.ts](src/hooks/useGridPersonalization.ts)
- Tracks user's movement range (min/max X and Y)
- Adapts pad positions and sizes to fit user's range
- Stores personalization in localStorage
- Includes stubs for future ML enhancements (miss detection, optimal sizing)

**Shared Service**: Uses existing [zoneMapping.ts](src/services/zoneMapping.ts) for cursor extraction

**Key Differences from Movement Zones**:
- Grid Pads: Discrete buttons with gaps, chord-based, touch support
- Movement Zones: Continuous zones, note-based, movement only

**Documentation**: See [GRID_PADS.md](GRID_PADS.md) for detailed documentation.

### XY Controller Mode (NEW)

The application now includes an **XY Controller** mode - a Kaoss Pad-style 2D control surface for expressive, continuous parameter control.

**Key Features**:
- **2D Control Surface**: Large XY area with labeled axes and crosshair
- **Continuous Parameters**: X and Y each control a specific musical parameter
- **Configurable Mappings**: Choose what each axis controls (pitch, filter, volume, reverb, delay, vibrato)
- **Real-time Control**: Parameters update smoothly as you move
- **Adaptive Range**: Scales to your natural movement range
- **Settings Panel**: Optional panel to customize X/Y parameter assignments

**Component**: [XYControllerInstrument.tsx](src/components/XYControllerInstrument.tsx)
- Renders large 2D surface with crosshair following user position
- Maps XY coordinates to audio parameters in real-time
- Configurable parameter assignments via settings panel
- Continuous sound generation (not triggered like pads)

**Hook**: [useXYPersonalization.ts](src/hooks/useXYPersonalization.ts)
- Tracks user's movement range (min/max X and Y)
- Adapts XY mapping to scale user's range to full (0,1) space
- Stores personalization in localStorage
- Includes stubs for future enhancements (adaptive smoothing, dead zones)

**Shared Service**: Uses existing [zoneMapping.ts](src/services/zoneMapping.ts) for cursor extraction

**Default Mapping**:
- X Axis (Horizontal): Pitch (C3 to B5, 21-note scale)
- Y Axis (Vertical): Filter Brightness (200Hz to 8000Hz lowpass)

**Audio Engine**:
```
Synth → Filter → Delay → Reverb → Vibrato → Speakers
```

**Mode Switching**: Users can toggle between Traditional, Zones, Grid Pads, XY Controller, and Note Lanes modes via [PerformanceView.tsx](src/components/PerformanceView.tsx)

**Documentation**: See [XY_CONTROLLER.md](XY_CONTROLLER.md) for detailed documentation.

### Note Lanes Mode (NEW)

The application now includes a **Note Lanes** mode - a ThumbJam-inspired lane-based instrument with clear horizontal lanes for melodic control.

**Key Features**:
- **Horizontal Lanes**: 6 stacked lanes (vertical layout) for vertical movement control
- **Clear Note Mapping**: Each lane labeled with its note name (C major pentatonic: C5, A4, G4, E4, D4, C4)
- **Hysteresis**: 25% threshold prevents flickering when crossing lane boundaries
- **Dual Interaction**: Works with both vertical movement and direct touch/tap
- **Single-Axis Control**: Only Y-axis (vertical) position matters, simplifying interaction
- **Adaptive Range**: Lanes scale to user's natural vertical movement range

**Component**: [NoteLanesInstrument.tsx](src/components/NoteLanesInstrument.tsx)
- Renders horizontal lanes stacked vertically
- Detects lane crossing with hysteresis to prevent flickering
- Plays single notes (monophonic) using Tone.js Synth
- Supports both movement-based and touch-based interaction
- Movement/Touch mode toggle for accessibility

**Hook**: [useLanePersonalization.ts](src/hooks/useLanePersonalization.ts)
- Tracks user's vertical (Y-axis) movement range
- Adapts lane positions and heights to fit user's range
- Stores personalization in localStorage
- Includes stubs for future ML enhancements (tremor detection, adaptive hysteresis)

**Shared Service**: Uses existing [zoneMapping.ts](src/services/zoneMapping.ts) for cursor extraction, focusing on Y-axis position

**Key Differences from Other Modes**:
- Note Lanes: 1D vertical control, lane crossing with hysteresis, monophonic
- Movement Zones: 2D continuous zones, no hysteresis, polyphonic
- Grid Pads: 2D discrete pads, chord-based, debouncing instead of hysteresis
- XY Controller: 2D continuous, parameter control instead of notes

**Audio Engine**:
```
Synth (Triangle Wave) → Reverb → Speakers
```

**Hysteresis System**: Must move 25% into next lane before switching, preventing accidental lane changes and reducing cognitive load.

**Mode Switching**: Users can toggle between Traditional, Zones, Grid Pads, XY Controller, and Note Lanes modes via [PerformanceView.tsx](src/components/PerformanceView.tsx)

**Documentation**: See [NOTE_LANES.md](NOTE_LANES.md) for detailed documentation.

### Development Guidelines

- All components use functional components with hooks
- CSS modules separated from components (no CSS-in-JS)
- TypeScript strict mode enabled
- Error boundaries should be added for production
- Performance optimization critical for real-time interaction

### Common Tasks

```bash
# Add a new body part
# 1. Update BODY_PARTS in BodyPartSelector.tsx
# 2. Add mapping in BODY_PART_TO_KEYPOINT in musicMapping.ts
# 3. Test keypoint detection accuracy

# Change musical scale
# 1. Modify SCALES object in musicMapping.ts
# 2. Update scale selection logic in mapMovementToMusic

# Add new preset
# 1. Update PRESETS array in BodyPartSelector.tsx
# 2. Ensure all referenced body parts exist in BODY_PARTS
```

### Performance Considerations

- MoveNet LIGHTNING model chosen for speed over accuracy
- Single pose detection (not multi-pose) for performance
- 60fps target for smooth interaction on desktop, 15-30fps on mobile
- Minimize state updates during performance
- Use React.memo for expensive components
- Adaptive throttling for mobile devices
- Reduced audio complexity on mobile

### Mobile Optimizations

The application includes specific optimizations for mobile devices:

1. **Detection Throttling**:
   - Adaptive pose detection interval (150-300ms) based on device performance
   - Reduced resolution and frame rate for webcam capture
   - Higher confidence thresholds for keypoints (0.4 vs 0.3 on desktop)
   - Limited number of keypoints processed

2. **Audio Optimizations**:
   - Reduced polyphony (2-4 voices vs 8 on desktop)
   - Shorter note durations (16n vs 8n on desktop)
   - Simpler waveforms (sine/triangle vs more complex waveforms)
   - Lower latency settings with interactive mode
   - Faster envelopes with shorter attack/release times
   - Reduced chord frequency (every 3s vs 2s on desktop)
   - Dedicated 'mobile-optimized' preset with minimal audio requirements

3. **UI Adaptations**:
   - Mobile-specific layout and styling
   - Mobile detection indicator
   - Simplified visualizations
   - Auto-selection of mobile-optimized preset

### Known Issues & Limitations

1. WebRTC camera access varies by browser
2. Audio context initialization requires user interaction
3. Pose detection accuracy drops with poor lighting
4. Some browsers limit Web Audio API features
5. Performance varies significantly on mobile devices
6. Older/lower-end mobile devices may experience lag even with optimizations

### Current Development State

The project is fully structured with all components in place. However, due to WSL permission issues, dependencies may need to be installed using alternative methods:

1. The application is currently using simplified versions of hooks and services
2. TensorFlow.js and Tone.js integration is stubbed out for easier installation
3. Webcam component shows a placeholder until react-webcam is properly installed
4. Full functionality will be restored once all dependencies are successfully installed

To work with the project:
1. Try installation methods in INSTALLATION.md
2. Components are functional but display placeholder content
3. All architectural patterns and structures are in place
4. Once dependencies are installed, uncomment the import statements in components