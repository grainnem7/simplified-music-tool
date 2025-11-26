# Grid Pads Mode

## Overview

The **Grid Pads** mode transforms the camera space into a large, ThumbJam-style grid of discrete musical pads. Users interact with pads by moving into them or tapping them directly, making it ideal for users with limited fine motor control.

## Key Features

- **Large, Discrete Pads**: 6 big pads (2×3 grid) with clear gaps between them
- **Dual Interaction**: Works with both movement and direct touch/tap
- **High Contrast**: Bold colors, thick borders, clear labels
- **Predictable Mapping**: Each pad always triggers the same chord
- **Adaptive Layout**: Pads adapt to user's natural movement range
- **Accessible Design**: No tiny controls, no body-specific imagery

## Key Differences from Movement Zones

| Feature | Grid Pads | Movement Zones |
|---------|-----------|----------------|
| Layout | Discrete pads with gaps | Continuous zones filling screen |
| Visual Style | Button-like with rounded corners | Zone areas with straight borders |
| Interaction | Trigger on entry (debounced) | Continuous triggering while in zone |
| Touch Support | ✅ Full touch/tap support | ❌ Movement only |
| Sound | Chords (multiple notes) | Single notes |
| Use Case | Discrete musical phrases | Continuous melodic control |

## Grid Layout

```
┌──────────────┐  ┌──────────────┐
│   Pad 1      │  │   Pad 2      │
│  C Major     │  │  G Major     │
│  (C4-E4-G4)  │  │  (G4-B4-D5)  │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│   Pad 3      │  │   Pad 4      │
│  A Minor     │  │  F Major     │
│  (A3-C4-E4)  │  │  (F4-A4-C5)  │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│   Pad 5      │  │   Pad 6      │
│  D Minor     │  │  E Minor     │
│  (D3-F3-A3)  │  │  (E4-G4-B4)  │
└──────────────┘  └──────────────┘
```

### Pad Properties

Each pad has:
- **ID**: Unique identifier (e.g., 'pad-0')
- **Label**: "Pad 1" through "Pad 6"
- **Description**: Chord name (e.g., "C Major")
- **Grid Position**: Row and column (0-indexed)
- **Center Coordinates**: Normalized (x, y) position
- **Size**: Width and height in normalized coordinates
- **Notes**: Array of MIDI note names forming a chord
- **Color**: Visual color for identification

## How It Works

### 1. Pose → Grid Position Mapping

The system uses the existing `getCursorFromPose()` function from [zoneMapping.ts](src/services/zoneMapping.ts):

**Strategy** (same as Movement Zones):
1. **Primary**: Calculate torso centroid from shoulders and hips
2. **Fallback 1**: Use nose position if torso not detected
3. **Fallback 2**: Use highest-confidence keypoint

**Position Smoothing**:
- Exponentially weighted moving average (buffer size: 5)
- Recent positions weighted higher (exponential weights: 2^index)
- Reduces jitter while maintaining responsiveness

**Coordinate System**:
- All positions are normalized to (0, 1) range
- (0, 0) = top-left
- (1, 1) = bottom-right

### 2. Pad Detection

Once we have cursor position (x, y), we check each pad:

```typescript
const detectPad = (x: number, y: number): GridPad | null => {
  for (const pad of adaptedPads) {
    const halfWidth = pad.width / 2
    const halfHeight = pad.height / 2
    const minX = pad.centerX - halfWidth
    const maxX = pad.centerX + halfWidth
    const minY = pad.centerY - halfHeight
    const maxY = pad.centerY + halfHeight

    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return pad
    }
  }
  return null
}
```

**Why This Works**:
- Simple bounding box collision detection
- Pads are discrete with gaps, so no ambiguity
- Fast O(n) check where n = 6 pads

### 3. Sound Triggering

When cursor enters a pad:

**Debouncing**:
- Minimum 400ms between triggers for the same pad
- Prevents sound flooding from rapid re-entries
- Implemented with timestamp tracking:

```typescript
const now = Date.now()
const lastTrigger = lastTriggerTimeRef.current[pad.id] || 0

if (now - lastTrigger < DEBOUNCE_TIME) {
  return // Too soon, don't retrigger
}
```

**Sound Playback**:
- Uses Tone.js PolySynth for chord playback
- Plays all notes in the pad's `notes` array simultaneously
- Envelope:
  - Attack: 10ms (instant response)
  - Decay: 200ms
  - Sustain: 0.3
  - Release: 1.2s (allows notes to blend)
- Reverb: 2s decay, 25% wet (adds space without muddiness)

**Visual Feedback**:
- Pad becomes fully opaque (active state)
- Border thickens (6px → 8px)
- Pulse animation (scale 1.0 → 1.08 → 1.0)
- Glowing shadow in pad's color
- Active state lasts 300ms

### 4. Touch/Tap Interaction

For accessibility, pads can also be activated by direct touch/click:

**How It Works**:
- Each pad is a `<button>` element
- onClick handler triggers the same `triggerPad()` function
- Touch mode can be toggled with a button

**Dual Mode Operation**:
- **Movement Mode** (default): Cursor tracks pose, pads trigger on entry
- **Touch Mode**: Cursor hidden, pads respond to tap/click

**Why Dual Mode?**:
- Some users prefer direct interaction
- Useful when camera isn't available
- Good for testing and demonstrations
- Accommodates different accessibility needs

## Personalization & Adaptation

The [useGridPersonalization](src/hooks/useGridPersonalization.ts) hook manages adaptive features.

### Movement Range Tracking

**What It Does**:
Observes user's cursor positions and tracks:
- Minimum X and Y coordinates
- Maximum X and Y coordinates
- Sample count

**How It Adapts**:
Scales pad positions and sizes to fit observed range:

```typescript
const userRangeX = maxX - minX
const userRangeY = maxY - minY

const adaptedCenterX = minX + pad.centerX * userRangeX
const adaptedCenterY = minY + pad.centerY * userRangeY

const adaptedWidth = pad.width * userRangeX
const adaptedHeight = pad.height * userRangeY
```

**Example**:
- User only moves in the center 50% of screen
- System detects: minX=0.25, maxX=0.75, minY=0.25, maxY=0.75
- Pads scale down to 50% size and cluster in the center
- User can now hit all pads within their comfortable range

**Adaptation Rate**:
- Fast initially (α=0.15 for first 30 samples)
- Slower after warmup (α=0.03 for stability)
- Ensures minimum range of 40% to prevent collapse

**Storage**:
- Saved to localStorage under key `grid-pads-personalization`
- Persists across sessions
- Can be reset with "Reset" button

### AI Constraints

**What AI CAN Do**:
- ✅ Adapt pad positions to fit user's movement range
- ✅ Adapt pad sizes proportionally
- ✅ Smooth jitter in cursor tracking
- ✅ (Future) Enlarge pads with high miss rates

**What AI CANNOT Do**:
- ❌ Change which notes a pad plays
- ❌ Change the order of pads
- ❌ Add or remove pads
- ❌ Change the musical relationships between pads

**Why These Constraints?**:
The user must always know: "If I move here → I get this sound"
Changing sound mappings would violate this core principle.

### Future ML Enhancements (Stubbed)

The code includes TODOs for potential ML improvements:

1. **Miss Detection**:
   - Track "near misses" where cursor came close to pad but didn't enter
   - Detect rapid direction changes near pad boundaries
   - Use to identify pads that need enlarging

2. **Optimal Pad Sizing**:
   - ML model to predict optimal pad sizes based on:
     - User's motor control variability
     - Movement speed patterns
     - Success rate per pad

3. **Movement Pattern Learning**:
   - Detect if user prefers large sweeping motions vs. small precise movements
   - Adjust grid layout accordingly (e.g., spread out vs. cluster)

4. **Preference Learning**:
   - Track which pads user plays most often
   - Make favorite pads easier to hit (slightly larger)

## Integration with Existing System

### Mode Switching

Grid Pads is integrated into [PerformanceView.tsx](src/components/PerformanceView.tsx) as a third mode option:

```typescript
type InstrumentMode = 'traditional' | 'zones' | 'grid'
```

**User Flow**:
1. User enters Performance View (traditional mode)
2. Clicks "Grid Pads" button
3. Interface switches to grid layout
4. Can toggle to Movement Zones or back to Traditional

**Switching Behavior**:
- Stops current performance when switching
- Preserves pose detection (same webcam feed)
- Uses separate audio synthesis (no interference)
- Mode state persists until explicitly changed

### Audio Engine

Uses Tone.js infrastructure with separate synth instance:

**Synth Configuration**:
- **Type**: PolySynth with Sine oscillator
- **Purpose**: Clean, pleasant chord playback
- **Polyphony**: 3 notes per pad (triads)
- **Volume**: -6dB for balanced mix

**Effects Chain**:
```
PolySynth → Reverb → Destination
```

**Why This Setup**:
- Simple, predictable sound
- Works well with chords
- No complex effects that might confuse users
- Clean separation from traditional mode's audio

## Accessibility Features

### Visual Accessibility

✅ **High Contrast**:
- Bold colors for each pad
- Thick borders (6-8px)
- Clear gaps between pads

✅ **Color + Text**:
- Never relies on color alone
- All pads have text labels
- Chord names clearly visible

✅ **Large Targets**:
- Each pad is ~42% × 28% of screen
- Far exceeds WCAG minimum (44×44px)
- Easy to hit with imprecise movements

✅ **Abstract Cursor**:
- Simple white dot with glow
- No body-specific imagery
- High contrast against all pad colors

### Motor Accessibility

✅ **Large Touch Areas**:
- Minimum 120×100px even on small screens
- Generous padding around labels

✅ **Touch and Movement**:
- Both interaction methods supported
- User can choose what works best

✅ **Smoothing**:
- Reduces jitter for users with tremors
- Exponential moving average

✅ **Adaptation**:
- Pads scale to user's comfortable range
- No need for precise movements

✅ **Debouncing**:
- 400ms delay prevents accidental re-triggers
- Forgiving of erratic movements

### Cognitive Accessibility

✅ **Predictable**:
- Same pad always plays same chord
- No hidden AI changing meanings

✅ **Visible Mapping**:
- All pad labels visible at all times
- Legend at bottom shows all mappings

✅ **Simple Instructions**:
- "Tap pads to play sounds" (touch mode)
- "Move into a pad to play its sound" (movement mode)

✅ **Clear State**:
- Movement vs. Touch mode clearly indicated
- Active pad visually distinct

### Reduced Motion Support

Respects `prefers-reduced-motion` media query:
- Disables cursor glow animation
- Disables pad pulse animation
- Disables hover scale transform
- Removes all transitions

## Usage Example

### Basic Setup

```typescript
import { GridPadsInstrument } from './components/GridPadsInstrument'
import { usePoseDetection } from './hooks/usePoseDetection'

function MyApp() {
  const webcamRef = useRef(null)
  const { poses } = usePoseDetection(webcamRef)
  const [isActive, setIsActive] = useState(false)

  return (
    <div>
      <GridPadsInstrument
        poses={poses}
        isActive={isActive}
        onBack={() => console.log('Exiting grid mode')}
      />
      <WebcamCapture ref={webcamRef} />
    </div>
  )
}
```

### Customizing Pads

To add or modify pads, edit the `DEFAULT_PADS` array in [GridPadsInstrument.tsx](src/components/GridPadsInstrument.tsx):

```typescript
const CUSTOM_PADS: GridPad[] = [
  {
    id: 'pad-0',
    label: 'Pad 1',
    description: 'Happy Chord',
    row: 0,
    col: 0,
    centerX: 0.25,
    centerY: 0.25,
    width: 0.4,
    height: 0.3,
    notes: ['C4', 'E4', 'G4', 'B4'], // CM7
    color: '#FF6B6B'
  },
  // ... more pads
]
```

**Important**: Keep number of pads reasonable (4-8) to maintain large sizes.

## Files Created

- **Component**: [src/components/GridPadsInstrument.tsx](src/components/GridPadsInstrument.tsx)
- **Styles**: [src/components/GridPadsInstrument.css](src/components/GridPadsInstrument.css)
- **Hook**: [src/hooks/useGridPersonalization.ts](src/hooks/useGridPersonalization.ts)
- **Integration**: Modified [src/components/PerformanceView.tsx](src/components/PerformanceView.tsx)
- **Shared Service**: Uses existing [src/services/zoneMapping.ts](src/services/zoneMapping.ts)
- **Docs**: `GRID_PADS.md` (this file)

## Testing Checklist

- [ ] Pads render correctly on different screen sizes
- [ ] Cursor tracks user movement smoothly
- [ ] Sound plays when entering a pad (movement mode)
- [ ] Sound plays when clicking a pad (touch mode)
- [ ] Debouncing prevents rapid re-triggering
- [ ] No sound when cursor is between pads
- [ ] Pad layout adapts to user's range over time
- [ ] Reset button clears personalization
- [ ] Mode switching works without errors
- [ ] Touch/Movement mode toggle works correctly
- [ ] Webcam permissions are handled correctly
- [ ] Audio initializes without errors
- [ ] Visual feedback (active state) works
- [ ] Works on mobile devices (tablet-sized and up)
- [ ] High contrast mode displays correctly
- [ ] Reduced motion mode disables animations
- [ ] Legend shows correct chord names
- [ ] Pads maintain minimum size constraints

## Known Limitations

1. **Fixed Grid**: 2×3 grid is hardcoded (not customizable yet)
2. **Simple Chords**: Uses basic triads, no seventh chords or extensions
3. **Single Cursor**: Only tracks one point (can't use both hands independently)
4. **No MIDI**: Doesn't support external MIDI devices
5. **Desktop/Tablet Focus**: Optimized for larger screens
6. **Debounce Time Fixed**: 400ms is not user-adjustable
7. **No Velocity Sensitivity**: All notes play at same volume

## Future Enhancements

### Short Term

1. **Customizable Grid Size**:
   - Allow 2×2, 2×3, 3×3 layouts
   - UI control to change grid size

2. **Chord Selection**:
   - Let users choose from predefined chord sets
   - Jazz, Classical, Rock, etc.

3. **Velocity Sensitivity**:
   - Map movement speed to note velocity
   - Faster entry = louder sound

4. **Visual Themes**:
   - Different color schemes
   - Customizable pad colors

### Long Term

1. **Multi-Cursor Support**:
   - Track both hands independently
   - One hand for melody, one for chords

2. **ML-Powered Adaptation**:
   - Implement miss detection
   - Automatic optimal pad sizing
   - Movement pattern recognition

3. **Custom Pad Sounds**:
   - User can assign any sound to any pad
   - Import audio samples
   - Synth parameter control

4. **Recording & Playback**:
   - Record pad trigger sequences
   - Loop playback
   - Export to MIDI

5. **Multi-Player**:
   - Multiple users on same grid
   - Collaborative music making

## Comparison Table: Grid Pads vs Movement Zones

| Aspect | Grid Pads | Movement Zones |
|--------|-----------|----------------|
| **Visual Layout** | Discrete pads with gaps | Continuous zones |
| **Interaction** | Enter → trigger once | Inside → continuous |
| **Touch Support** | ✅ Yes | ❌ No |
| **Sound Type** | Chords (3 notes) | Single notes |
| **Debouncing** | 400ms per pad | Per-zone timing |
| **Adaptation** | Scale position & size | Scale boundaries |
| **Use Case** | Rhythmic phrases | Melodic control |
| **Cognitive Load** | Lower (fewer decisions) | Slightly higher |
| **Best For** | Limited motor control | Expressive playing |

## Summary

### Pose → Grid Position

1. Extract cursor from pose using torso centroid (or fallback)
2. Apply exponential smoothing to reduce jitter
3. Normalize to (0, 1) coordinate space
4. Check if position is inside any pad's bounding box

### Pad Triggering

1. Cursor enters pad's bounding box
2. Check debounce timer (must be >400ms since last trigger)
3. Play pad's chord using Tone.js PolySynth
4. Set active visual state for 300ms
5. Record timestamp for debouncing

### Personalization

1. Track all cursor positions over time
2. Calculate min/max X and Y coordinates
3. After 20+ samples, begin adaptation:
   - Scale pad positions to fit observed range
   - Scale pad sizes proportionally
4. Store in localStorage, persist across sessions
5. User can reset to defaults anytime

**Key Principle**: AI only adapts spatial properties (where/how big), never musical properties (what sound).

## Support

For questions or issues with Grid Pads mode:
1. Check main [README.md](README.md) for setup instructions
2. Review this document for feature details
3. Check browser console for error messages
4. Ensure camera permissions are granted
5. Try the "Reset" button if adaptation seems off
6. Toggle between Touch and Movement modes to isolate issues
