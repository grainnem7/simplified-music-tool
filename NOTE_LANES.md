# Note Lanes Mode

## Overview

The **Note Lanes** mode transforms the camera space into clear, horizontal lanes inspired by ThumbJam's iconic lane-based interface. Users interact by moving vertically to cross lanes or by directly tapping them, making it ideal for melodic control with predictable note placement.

## Key Features

- **Clear Lane Separation**: 6 horizontal lanes stacked vertically with high-contrast borders
- **Dual Interaction**: Works with both vertical movement and direct touch/tap
- **Hysteresis**: Prevents flickering when cursor is near lane boundaries
- **Predictable Mapping**: Each lane always plays the same note (pentatonic scale)
- **Adaptive Layout**: Lanes adapt to user's natural vertical movement range
- **Accessible Design**: Large touch areas, high contrast, clear labels

## Key Differences from Other Modes

| Feature | Note Lanes | Movement Zones | Grid Pads | XY Controller |
|---------|-----------|----------------|-----------|---------------|
| Layout | Horizontal lanes (1D) | 2D continuous zones | 2D discrete pads | Continuous 2D surface |
| Movement Axis | Vertical (Y-axis) | X and Y | X and Y | X and Y |
| Interaction | Cross lane → trigger | Enter zone → continuous | Enter pad → trigger | Continuous mapping |
| Touch Support | ✅ Full touch/tap | ❌ Movement only | ✅ Full touch/tap | ❌ Movement only |
| Sound | Single notes | Single notes | Chords | Configurable parameters |
| Hysteresis | ✅ Yes (25% threshold) | ❌ No | ❌ No | ❌ No |
| Use Case | Melodic playing | Zone-based melodies | Harmonic phrases | Expressive control |

## Lane Layout

```
┌─────────────────────────────────────────────────────────┐
│                    Lane 1: C5 (red)                     │
├─────────────────────────────────────────────────────────┤
│                    Lane 2: A4 (cyan)                    │
├─────────────────────────────────────────────────────────┤
│                    Lane 3: G4 (blue)                    │
├─────────────────────────────────────────────────────────┤
│                    Lane 4: E4 (green)                   │
├─────────────────────────────────────────────────────────┤
│                    Lane 5: D4 (yellow)                  │
├─────────────────────────────────────────────────────────┤
│                    Lane 6: C4 (light gray)              │
└─────────────────────────────────────────────────────────┘
```

### Lane Properties

Each lane has:
- **ID**: Unique identifier (e.g., 'lane-0')
- **Label**: Note name (e.g., "C5", "A4")
- **Center Y**: Normalized vertical position (0-1)
- **Height**: Normalized height (0-1)
- **Notes**: Array of MIDI note names (single note per lane)
- **Color**: Visual color for identification

**Default Configuration**:
- 6 lanes using C major pentatonic scale: C5, A4, G4, E4, D4, C4
- Each lane occupies ~16.67% of screen height
- Equal spacing with no gaps
- Stacked top-to-bottom (high to low pitch)

## How It Works

### 1. Pose → Lane Position Mapping

The system uses the existing `getCursorFromPose()` function from [zoneMapping.ts](src/services/zoneMapping.ts):

**Strategy** (same as other modes):
1. **Primary**: Calculate torso centroid from shoulders and hips
2. **Fallback 1**: Use nose position if torso not detected
3. **Fallback 2**: Use highest-confidence keypoint

**Position Smoothing**:
- Exponentially weighted moving average (buffer size: 5)
- Recent positions weighted higher (exponential weights: 2^index)
- Reduces jitter while maintaining responsiveness

**Coordinate System**:
- Only Y-axis position is used for lane detection
- Y = 0 (top) → Y = 1 (bottom)
- Maps naturally to vertical movement

### 2. Lane Detection with Hysteresis

Once we have cursor Y position, we check which lane it's in:

```typescript
const detectLane = (y: number): Lane | null => {
  for (const lane of adaptedLanes) {
    const halfHeight = lane.height / 2
    let minY = lane.centerY - halfHeight
    let maxY = lane.centerY + halfHeight

    // Apply hysteresis if switching from different lane
    if (lastLaneId && lastLaneId !== lane.id) {
      const hysteresisAmount = lane.height * HYSTERESIS_THRESHOLD
      minY += hysteresisAmount
      maxY -= hysteresisAmount
    }

    if (y >= minY && y <= maxY) {
      return lane
    }
  }
  return null
}
```

**Hysteresis Explained**:
- **Threshold**: 25% of lane height
- **Purpose**: Prevents rapid switching when cursor is near boundary
- **How It Works**: When you're in Lane A and moving toward Lane B:
  - You must move 25% *into* Lane B before it switches
  - This creates "stickiness" that prevents flickering
  - Only applies when switching between different lanes

**Example**:
```
Lane A: Y = 0.0 to 0.167 (normally)
Lane B: Y = 0.167 to 0.333 (normally)

If cursor is in Lane A at Y = 0.16:
- To switch to Lane B, must reach Y = 0.167 + (0.167 * 0.25) = Y = 0.209
- This prevents flickering when cursor hovers at Y = 0.167
```

### 3. Sound Triggering

When cursor enters a lane:

**Triggering Logic**:
- Cursor crosses into new lane → trigger note
- Note plays until cursor leaves lane
- If cursor moves between lanes, note changes immediately
- If cursor is in no lane (impossible with current layout), silence

**Sound Playback**:
- Uses Tone.js Synth (not PolySynth - single note at a time)
- Triangle wave oscillator for smooth, pleasant sound
- Envelope:
  - Attack: 10ms (instant response)
  - Decay: 200ms
  - Sustain: 0.7
  - Release: 800ms (smooth note transitions)
- Reverb: 2s decay, 25% wet (adds space)
- Volume: -10dB for balanced mix

**Visual Feedback**:
- Active lane becomes more opaque
- Border thickens (6px → 8px)
- Pulse animation (scale 1.0 → 1.08 → 1.0)
- Glowing shadow in lane's color
- Active state lasts 200ms

### 4. Touch/Tap Interaction

For accessibility, lanes can also be activated by direct touch/click:

**How It Works**:
- Each lane is a `<button>` element
- onClick handler triggers the same sound as movement
- Touch mode can be toggled with a button

**Dual Mode Operation**:
- **Movement Mode** (default): Cursor tracks pose, lanes trigger on entry
- **Touch Mode**: Cursor hidden, lanes respond to tap/click

**Why Dual Mode?**:
- Some users prefer direct interaction
- Useful when camera isn't available
- Good for testing and demonstrations
- Accommodates different accessibility needs

## Personalization & Adaptation

The [useLanePersonalization](src/hooks/useLanePersonalization.ts) hook manages adaptive features.

### Vertical Range Tracking

**What It Does**:
Observes user's cursor Y positions and tracks:
- Minimum Y coordinate
- Maximum Y coordinate
- Sample count

**How It Adapts**:
Scales lane positions to fit observed range:

```typescript
const adaptLanes = (defaultLanes: Lane[]): Lane[] => {
  const rangeY = maxY - minY

  return defaultLanes.map(lane => ({
    ...lane,
    centerY: minY + lane.centerY * rangeY,
    height: lane.height * rangeY
  }))
}
```

**Example**:
- User only moves in the middle 50% of screen vertically
- System detects: minY=0.25, maxY=0.75
- Lanes compress to 50% height and cluster in middle
- User can now hit all lanes within their comfortable range

**Adaptation Rate**:
- Fast initially (α=0.12 for first 40 samples)
- Slower after warmup (α=0.02 for stability)
- Ensures minimum range of 40% to prevent collapse

**Storage**:
- Saved to localStorage under key `note-lanes-personalization`
- Persists across sessions
- Can be reset with "Reset" button

### AI Constraints

**What AI CAN Do**:
- ✅ Adapt lane vertical positions to fit user's range
- ✅ Adapt lane heights proportionally
- ✅ Smooth jitter in cursor tracking
- ✅ (Future) Adjust hysteresis threshold per user

**What AI CANNOT Do**:
- ❌ Change which note a lane plays
- ❌ Change the order of lanes
- ❌ Add or remove lanes
- ❌ Change the musical relationships between lanes

**Why These Constraints?**:
The user must always know: "If I move to this lane → I get this note"
Changing note mappings would violate this core principle.

### Future ML Enhancements (Stubbed)

The code includes TODOs for potential ML improvements:

1. **Tremor Detection**:
   - Track velocity variance to detect tremor
   - Increase smoothing factor for users with high jitter
   - Adjust hysteresis threshold to compensate

2. **Optimal Lane Heights**:
   - ML model to predict optimal lane heights based on:
     - User's vertical control precision
     - Movement speed patterns
     - Hit accuracy per lane

3. **Adaptive Hysteresis**:
   - Learn optimal hysteresis threshold per user
   - Adjust based on boundary-crossing patterns
   - Prevent flickering without reducing responsiveness

4. **Difficulty Detection**:
   - Identify lanes that are hardest to hit
   - Make difficult lanes taller to improve accessibility
   - Track which lanes user plays most often

## Integration with Existing System

### Mode Switching

Note Lanes is integrated into [PerformanceView.tsx](src/components/PerformanceView.tsx) as a fifth mode option:

```typescript
type InstrumentMode = 'traditional' | 'zones' | 'grid' | 'xy' | 'lanes'
```

**User Flow**:
1. User enters Performance View (traditional mode)
2. Clicks "Note Lanes" button
3. Interface switches to lane layout
4. Can toggle to other modes or back to Traditional

**Switching Behavior**:
- Stops current performance when switching
- Preserves pose detection (same webcam feed)
- Uses separate audio synthesis (no interference)
- Mode state persists until explicitly changed

### Audio Engine

Uses Tone.js infrastructure with separate synth instance:

**Synth Configuration**:
- **Type**: Synth (monophonic) with Triangle oscillator
- **Purpose**: Smooth, melodic note playback
- **Polyphony**: 1 note at a time (monophonic)
- **Volume**: -10dB for balanced mix

**Effects Chain**:
```
Synth → Reverb → Destination
```

**Why This Setup**:
- Simple, predictable sound
- Works well with single-note melodies
- Smooth transitions between notes
- Clean separation from traditional mode's audio

## Accessibility Features

### Visual Accessibility

✅ **High Contrast**:
- Bold colors for each lane
- Thick borders (6-8px)
- Clear lane labels with large text (2.5rem)

✅ **Color + Text**:
- Never relies on color alone
- All lanes have text labels (note names)
- Labels always visible

✅ **Large Targets**:
- Each lane is ~16.67% of screen height
- Minimum ~67px tall on mobile
- Easy to hit with imprecise movements

✅ **Clear Cursor**:
- Horizontal white line indicator
- High contrast against all lane colors
- Glowing dot at center for visibility

### Motor Accessibility

✅ **Large Touch Areas**:
- Full-width lanes
- Minimum 67px height on mobile screens
- Generous touch targets

✅ **Touch and Movement**:
- Both interaction methods supported
- User can choose what works best

✅ **Smoothing**:
- Reduces jitter for users with tremors
- Exponential moving average
- Configurable smoothing factor

✅ **Hysteresis**:
- 25% threshold prevents accidental lane switches
- Forgiving of boundary crossings
- Reduces cognitive load

✅ **Adaptation**:
- Lanes scale to user's comfortable vertical range
- No need for precise movements
- Personalization happens automatically

### Cognitive Accessibility

✅ **Predictable**:
- Same lane always plays same note
- No hidden AI changing meanings
- Visual labels match sound output

✅ **Visible Mapping**:
- All lane labels visible at all times
- Legend at bottom shows all mappings
- Clear vertical layout (high notes on top)

✅ **Simple Instructions**:
- "Move up and down to play different notes" (movement mode)
- "Tap lanes to play notes" (touch mode)

✅ **Clear State**:
- Movement vs. Touch mode clearly indicated
- Active lane visually distinct
- Cursor position always visible (movement mode)

### Reduced Motion Support

Respects `prefers-reduced-motion` media query:
- Disables cursor glow animation
- Disables lane pulse animation
- Disables hover effects
- Removes all transitions

## Usage Example

### Basic Setup

```typescript
import { NoteLanesInstrument } from './components/NoteLanesInstrument'
import { usePoseDetection } from './hooks/usePoseDetection'

function MyApp() {
  const webcamRef = useRef(null)
  const { poses } = usePoseDetection(webcamRef)
  const [isActive, setIsActive] = useState(false)

  return (
    <div>
      <NoteLanesInstrument
        poses={poses}
        isActive={isActive}
        onBack={() => console.log('Exiting lanes mode')}
      />
      <WebcamCapture ref={webcamRef} />
    </div>
  )
}
```

### Customizing Lanes

To add or modify lanes, edit the `DEFAULT_LANES` array in [NoteLanesInstrument.tsx](src/components/NoteLanesInstrument.tsx):

```typescript
const CUSTOM_LANES: Lane[] = [
  {
    id: 'lane-0',
    label: 'G5',
    centerY: 0.0833,
    height: 0.1667,
    notes: ['G5'],
    color: '#FF6B6B'
  },
  {
    id: 'lane-1',
    label: 'E5',
    centerY: 0.25,
    height: 0.1667,
    notes: ['E5'],
    color: '#4ECDC4'
  },
  // ... more lanes
]
```

**Important Guidelines**:
- Keep lanes stacked vertically (no gaps in default config)
- Use centerY values that cover 0 to 1 range
- Heights should sum to ~1.0 for full coverage
- Colors should be distinct for visual clarity
- Consider using pentatonic or other scale for pleasant sound

## Files Created

- **Component**: [src/components/NoteLanesInstrument.tsx](src/components/NoteLanesInstrument.tsx)
- **Styles**: [src/components/NoteLanesInstrument.css](src/components/NoteLanesInstrument.css)
- **Hook**: [src/hooks/useLanePersonalization.ts](src/hooks/useLanePersonalization.ts)
- **Integration**: Modified [src/components/PerformanceView.tsx](src/components/PerformanceView.tsx)
- **Shared Service**: Uses existing [src/services/zoneMapping.ts](src/services/zoneMapping.ts)
- **Docs**: `NOTE_LANES.md` (this file)

## Testing Checklist

- [ ] Lanes render correctly on different screen sizes
- [ ] Cursor tracks vertical movement smoothly
- [ ] Sound plays when crossing into a lane (movement mode)
- [ ] Sound changes when crossing to different lane
- [ ] Sound plays when clicking a lane (touch mode)
- [ ] Hysteresis prevents flickering near boundaries
- [ ] Lane layout adapts to user's vertical range over time
- [ ] Reset button clears personalization
- [ ] Mode switching works without errors
- [ ] Touch/Movement mode toggle works correctly
- [ ] Webcam permissions are handled correctly
- [ ] Audio initializes without errors
- [ ] Visual feedback (active state) works
- [ ] Legend displays correct note names
- [ ] Works on mobile devices (tablet-sized and up)
- [ ] High contrast mode displays correctly
- [ ] Reduced motion mode disables animations
- [ ] No audio artifacts during lane transitions
- [ ] Cursor visibility in movement mode

## Known Limitations

1. **Fixed Lane Count**: 6 lanes hardcoded (not customizable in UI yet)
2. **Monophonic**: Only one note at a time (no chords)
3. **Single Axis**: Only tracks vertical position (Y-axis)
4. **No MIDI**: Doesn't support external MIDI devices
5. **Desktop/Tablet Focus**: Optimized for larger screens
6. **Fixed Hysteresis**: 25% threshold not user-adjustable
7. **No Velocity Sensitivity**: All notes play at same volume
8. **No Horizontal Lanes**: Currently only vertical layout supported

## Future Enhancements

### Short Term

1. **Horizontal Lane Option**:
   - Allow lanes to run vertically (left-right movement)
   - UI toggle to switch between horizontal/vertical
   - X-axis tracking for horizontal lanes

2. **Customizable Lane Count**:
   - Allow 5-8 lanes
   - UI control to change lane count
   - Maintain minimum lane height

3. **Scale Selection**:
   - Let users choose from predefined scales
   - Major, minor, pentatonic, chromatic, etc.
   - Custom scale definition

4. **Velocity Sensitivity**:
   - Map movement speed to note velocity
   - Faster crossing = louder sound
   - Configurable sensitivity curve

### Long Term

1. **Polyphonic Mode**:
   - Support multiple simultaneous notes
   - Multi-cursor tracking (both hands)
   - Chord building across lanes

2. **ML-Powered Adaptation**:
   - Implement tremor detection
   - Automatic optimal lane sizing
   - Adaptive hysteresis per user
   - Movement pattern recognition

3. **Custom Lane Sounds**:
   - User can assign any sound to any lane
   - Import audio samples
   - Synth parameter control per lane

4. **Recording & Playback**:
   - Record lane trigger sequences
   - Loop playback
   - Export to MIDI

5. **Visual Customization**:
   - Different color schemes
   - Custom lane colors
   - Background themes

## Comparison Table: Note Lanes vs Other Modes

| Aspect | Note Lanes | Movement Zones | Grid Pads | XY Controller |
|--------|-----------|----------------|-----------|---------------|
| **Visual Layout** | Horizontal lanes | Continuous 2D zones | Discrete 2D pads | Continuous 2D surface |
| **Interaction** | Cross lane → trigger | Inside zone → continuous | Enter pad → trigger | Continuous control |
| **Axes Used** | Y-axis (vertical) | X and Y | X and Y | X and Y |
| **Touch Support** | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Sound Type** | Single notes (melody) | Single notes | Chords (harmony) | Parameters (effects) |
| **Hysteresis** | ✅ Yes (25%) | ❌ No | ❌ No | ❌ No |
| **Adaptation** | Vertical range | 2D boundaries | Position & size | Movement range |
| **Use Case** | Melodic playing | Zone-based control | Rhythmic phrases | Expressive parameters |
| **Cognitive Load** | Low (1D movement) | Medium (2D zones) | Low (discrete pads) | Medium-High (2D continuous) |
| **Best For** | Melody, limited vertical control | Zone-based composition | Chord progressions | Live effects control |

## Summary

### Pose → Lane Position

1. Extract cursor Y position from pose using torso centroid (or fallback)
2. Apply exponential smoothing to reduce jitter
3. Normalize to (0, 1) coordinate space (Y-axis only)
4. Check if Y position is inside any lane's vertical bounds

### Lane Triggering with Hysteresis

1. Cursor crosses into lane's vertical bounds
2. Apply hysteresis threshold if switching from different lane
   - Must move 25% into new lane before switching
   - Prevents flickering at boundaries
3. Play lane's note using Tone.js Synth
4. Set active visual state for 200ms
5. Track current lane for hysteresis calculation

### Personalization

1. Track all cursor Y positions over time
2. Calculate min/max Y coordinates
3. After 15+ samples, begin adaptation:
   - Scale lane positions to fit observed vertical range
   - Scale lane heights proportionally
4. Store in localStorage, persist across sessions
5. User can reset to defaults anytime

**Key Principle**: AI only adapts spatial properties (where/how tall), never musical properties (what note).

## Support

For questions or issues with Note Lanes mode:
1. Check main [README.md](README.md) for setup instructions
2. Review this document for feature details
3. Check browser console for error messages
4. Ensure camera permissions are granted
5. Try the "Reset" button if adaptation seems off
6. Toggle between Touch and Movement modes to isolate issues
7. Test with different vertical movement ranges

---

**Note Lanes Mode** brings ThumbJam-inspired clarity to gesture control, making melodic playing predictable, accessible, and musically expressive. The combination of clear visual lanes, hysteresis-based detection, and adaptive personalization creates an instrument that's easy to learn but capable of nuanced musical expression.
