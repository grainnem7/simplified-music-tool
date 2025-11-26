# Movement Zones Mode

## Overview

The **Movement Zones** mode is a simplified, predictable instrument interface that maps physical movements to clearly defined on-screen zones. Unlike the traditional body-part-based mode, this mode provides:

- **Predictability**: Users always know exactly what sound a zone will produce
- **Simplicity**: Large, clearly labeled zones with high-contrast borders
- **Accessibility**: No reliance on "normative body" concepts or specific body parts
- **Personalization**: Zones adapt to each user's natural movement range over time

## Key Principles

1. **Transparency**: Movement → Zone → Sound mapping is always visible and deterministic
2. **No Hidden AI**: AI is only used for smoothing jitter and adapting zone boundaries, never for changing the musical meaning
3. **Low Cognitive Load**: Similar to apps like ThumbJam - simple, immediate, and predictable

## Architecture

### Components

#### 1. MovementZonesInstrument Component
**Location**: [src/components/MovementZonesInstrument.tsx](src/components/MovementZonesInstrument.tsx)

Main component that renders the zone-based instrument interface.

**Features**:
- Renders 6 zones in a 2×3 grid layout
- Shows real-time cursor position as an abstract indicator (no body-specific imagery)
- Plays sounds when cursor enters a zone
- Displays zone labels and descriptions
- Adapts zones based on user's movement range

**Props**:
```typescript
interface MovementZonesInstrumentProps {
  poses: Pose[] | null       // Pose detection data
  isActive: boolean          // Whether the instrument is currently playing
  onBack: () => void        // Callback to exit zones mode
}
```

#### 2. Zone Mapping Service
**Location**: [src/services/zoneMapping.ts](src/services/zoneMapping.ts)

Extracts cursor position from pose data using a modular, swappable strategy.

**Key Functions**:
- `getCursorFromPose(pose)`: Extracts 2D cursor position from pose
  - Strategy 1: Use torso centroid (shoulders + hips) for stability
  - Strategy 2: Fallback to nose for head tracking
  - Strategy 3: Use highest-confidence keypoint
- `resetCursorSmoothing()`: Resets the smoothing buffer

**Position Smoothing**:
- Uses exponentially weighted moving average
- Buffer size: 5 samples
- More recent positions get higher weight
- Reduces jitter while maintaining responsiveness

#### 3. Personalization Hook
**Location**: [src/hooks/useZonePersonalization.ts](src/hooks/useZonePersonalization.ts)

Handles adaptive zone boundaries based on user's movement range.

**Features**:
- Tracks min/max X and Y coordinates observed during use
- Gradually expands zones to fit user's natural range
- Uses exponential smoothing for gradual adaptation
- Stores personalization data in localStorage
- Provides reset function to clear adaptation

**AI/ML Notes**:
Currently uses simple heuristic adaptation. Could be enhanced with:
- ML-based prediction of user's comfortable range
- Pattern detection for movement preferences
- Automatic zone sensitivity adjustment

## Zone Layout

The default layout uses 6 zones arranged in a 2×3 grid:

```
┌─────────────┬─────────────┐
│   Mid-Low   │ Bright High │  ← Top row (highest notes in each column)
│   D3-A3     │   B4-E5     │
├─────────────┼─────────────┤
│  Low Notes  │ High Notes  │  ← Middle row
│   G2-D3     │   E4-B4     │
├─────────────┼─────────────┤
│  Deep Bass  │  Mid Notes  │  ← Bottom row (lowest notes in each column)
│   C2-G2     │   A3-E4     │
└─────────────┴─────────────┘
    Left           Right
  (Lower)        (Higher)
```

### Zone Properties

Each zone has:
- **ID**: Unique identifier
- **Label**: Short name (e.g., "Deep Bass")
- **Description**: Longer explanation (e.g., "Very low, rich tones")
- **Position**: Normalized coordinates (x, y, width, height)
- **Note Range**: Musical range (e.g., ['C2', 'G2'])
- **Timbre**: Color coding (deep/warm/bright)

## Sound Mapping

### How Zones Map to Sound

1. **Pitch**: Determined by zone
   - Left column: Lower register (C2-A3)
   - Right column: Higher register (A3-E5)
   - Vertical position: Finer pitch control within zone

2. **Timbre**: Filter frequency adjusted per zone
   - Deep zones: Low-pass filter at 1200Hz
   - Warm zones: Low-pass filter at 2000Hz
   - Bright zones: Low-pass filter at 3500Hz

3. **Note Triggering**:
   - Fires when cursor enters a new zone
   - Minimum 400ms between notes to avoid flooding
   - Uses Tone.js PolySynth with triangle oscillator

4. **Envelope**:
   - Attack: 50ms (quick but smooth)
   - Decay: 300ms
   - Sustain: 0.4
   - Release: 1.5s (allows notes to blend)

## User Personalization

### Movement Range Adaptation

The system tracks the user's movement range over time and adapts zone boundaries to fit their natural range.

**How It Works**:
1. Observe every cursor position (x, y)
2. Track min/max values with exponential smoothing
3. Scale zone boundaries to fit observed range
4. Ensure minimum zone size (30% of screen)

**Adaptation Rate**:
- Fast initially (α = 0.2 for first 50 samples)
- Slower after warmup (α = 0.05)
- Prevents sudden jumps while allowing gradual improvement

**Storage**:
- Saved to localStorage under key `movement-zones-personalization`
- Persists across sessions
- Can be reset via "Reset Zones" button

**Important**: This adaptation only changes the _spatial boundaries_ of zones, never their musical meaning. The zone that produces "Deep Bass" will always produce deep bass notes - it just might move to better fit where the user naturally moves.

## Integration with Existing System

### Mode Switching

The Movement Zones mode is integrated into [PerformanceView.tsx](src/components/PerformanceView.tsx) alongside the traditional mode.

**User Flow**:
1. User enters Performance View (traditional mode)
2. Clicks "Movement Zones Mode" button
3. Interface switches to zones layout
4. Can toggle back to traditional mode anytime

**Mode State**:
```typescript
type InstrumentMode = 'traditional' | 'zones'
```

**Switching Behavior**:
- Stops current performance when switching
- Preserves pose detection (same webcam feed)
- Uses separate audio synthesis (no interference)

### Audio Engine

Uses the existing Tone.js infrastructure but with a separate synth instance:
- **PolySynth**: Triangle oscillator for smooth tones
- **Reverb**: 2.5s decay, 30% wet for space
- **Filter**: Dynamic lowpass (1200-3500Hz) based on zone timbre
- **Volume**: -8dB to blend with traditional mode

## Accessibility Features

### Visual Accessibility
- **High Contrast**: Thick borders (4-6px) on all zones
- **Color + Text**: Never relies on color alone - all zones have text labels
- **Large Touch Targets**: Zones are large (minimum 16.67% of screen each)
- **Abstract Cursor**: No body-specific imagery - just a pulsing dot

### Motion Accessibility
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Smoothing**: Reduces jitter for users with tremors
- **Adaptation**: Accommodates different movement ranges

### Cognitive Accessibility
- **Predictable**: Same zone always produces same type of sound
- **Visible Mapping**: All zone labels visible at all times
- **Simple Instructions**: "Move to a zone to play its sound"

## Usage Example

```typescript
import { MovementZonesInstrument } from './components/MovementZonesInstrument'
import { usePoseDetection } from './hooks/usePoseDetection'

function MyApp() {
  const webcamRef = useRef(null)
  const { poses } = usePoseDetection(webcamRef)
  const [isActive, setIsActive] = useState(false)

  return (
    <div>
      <MovementZonesInstrument
        poses={poses}
        isActive={isActive}
        onBack={() => console.log('Exiting zones mode')}
      />
      <WebcamCapture ref={webcamRef} />
    </div>
  )
}
```

## Future Enhancements

### Potential ML Improvements

1. **Faster Adaptation**:
   - Use ML to predict user's comfortable range from first few movements
   - Reduce warmup time from 50 samples to ~10

2. **Pattern Recognition**:
   - Detect if user prefers larger/smaller movements
   - Automatically adjust zone sensitivity

3. **Preference Learning**:
   - Learn which zones user visits most often
   - Adjust zone sizes to make favorites easier to hit

4. **Movement Style Detection**:
   - Identify if user moves smoothly or in discrete jumps
   - Adjust smoothing parameters accordingly

### Additional Features

1. **Custom Zone Layouts**:
   - Allow users to configure number of zones (4, 6, 8, 9)
   - Different arrangements (horizontal strips, circular, etc.)

2. **Zone Customization**:
   - Let users assign different sounds to zones
   - Custom labels and colors

3. **Multiple Cursor Tracking**:
   - Track both hands independently
   - Assign different roles (melody vs. harmony)

4. **Visual Feedback**:
   - Particle effects when entering zones
   - Color pulses on sound triggers
   - Waveform visualization

## Files Created

- **Component**: `src/components/MovementZonesInstrument.tsx`
- **Styles**: `src/components/MovementZonesInstrument.css`
- **Service**: `src/services/zoneMapping.ts`
- **Hook**: `src/hooks/useZonePersonalization.ts`
- **Integration**: Modified `src/components/PerformanceView.tsx`
- **Docs**: `MOVEMENT_ZONES.md` (this file)

## Testing Checklist

- [ ] Zones render correctly on different screen sizes
- [ ] Cursor tracks user movement smoothly
- [ ] Sound plays when entering a zone
- [ ] No sound when cursor is between zones
- [ ] Zone boundaries adapt to user's range over time
- [ ] Reset button clears personalization
- [ ] Mode switching works without errors
- [ ] Webcam permissions are handled correctly
- [ ] Audio initializes without errors
- [ ] Works on mobile devices (tablet-sized and up)
- [ ] High contrast mode displays correctly
- [ ] Reduced motion mode disables animations
- [ ] Keyboard navigation works (for future enhancement)

## Known Limitations

1. **Single Cursor**: Currently tracks only one point (torso centroid)
2. **Fixed Zone Layout**: 2×3 grid is hardcoded (not customizable yet)
3. **Simple Note Selection**: Plays single notes, not chords or complex patterns
4. **No MIDI**: Doesn't support external MIDI devices
5. **Desktop/Tablet Focus**: Optimized for larger screens (may not work well on phones)

## Support

For questions or issues with Movement Zones mode:
1. Check the main [README.md](README.md) for setup instructions
2. Review this document for feature details
3. Check the browser console for error messages
4. Ensure camera permissions are granted
5. Try the "Reset Zones" button if adaptation seems off
