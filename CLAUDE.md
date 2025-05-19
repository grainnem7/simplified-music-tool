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
│   ├── WelcomeScreen.tsx       # Initial welcome interface
│   ├── SetupScreen.tsx         # Body part selection setup
│   ├── BodyPartSelector.tsx    # UI for selecting tracked body parts
│   ├── WebcamCapture.tsx       # Handles webcam feed
│   ├── PerformanceView.tsx     # Main performance interface
│   └── MusicGenerator.tsx      # Music visualization component
├── services/
│   ├── poseDetection.ts        # Pose detection service utilities
│   └── musicMapping.ts         # Movement to music parameter mapping
├── hooks/
│   ├── usePoseDetection.ts     # Custom hook for pose detection
│   └── useMusicGeneration.ts   # Custom hook for music generation
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

### Development Guidelines

- All components use functional components with hooks
- CSS modules separated from components (no CSS-in-JS)
- TypeScript strict mode enabled
- Error boundaries should be added for production
- Performance optimization critical for real-time interaction

### Customizable Music Mapping System

The application now features a comprehensive music mapping configuration system:

1. **Flexible Axis Mapping**: Each body part can map X/Y/velocity to different parameters
2. **Multiple Instruments**: Piano, synth, strings, drums, bass, pad
3. **Musical Roles**: Melody, harmony, rhythm, bass, effects
4. **Scale Selection**: Pentatonic, major, minor, blues, chromatic, etc.
5. **Presets**: Intuitive, experimental, drummer configurations
6. **Visual Feedback**: Axis visualizer showing mapping relationships

Key components:
- `MusicMappingConfig.tsx`: UI for configuring mappings
- `types/musicMapping.ts`: Type definitions and presets
- `AxisVisualizer.tsx`: Visual representation of axis mappings
- `useMusicGeneration.ts`: Hook handling flexible music generation

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
- 60fps target for smooth interaction
- Minimize state updates during performance
- Use React.memo for expensive components

### Known Issues & Limitations

1. WebRTC camera access varies by browser
2. Audio context initialization requires user interaction
3. Pose detection accuracy drops with poor lighting
4. Some browsers limit Web Audio API features
5. Performance varies significantly on mobile devices

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