# XY Controller Mode

## Overview

The **XY Controller** mode transforms your camera into a Kaoss Pad-style 2D control surface. Move in front of the camera to control two continuous musical parameters simultaneously - providing expressive, real-time sound shaping.

## Key Features

- **2D Control Surface**: Large rectangular area with labeled X and Y axes
- **Crosshair Visualization**: Clear indicator showing your current position
- **Continuous Control**: X and Y each control a specific musical parameter
- **Configurable Mappings**: Choose what each axis controls via settings panel
- **Adaptive Range**: System scales to your natural movement range
- **Transparent Mapping**: Always know what your movement does

## Comparison with Other Modes

| Feature | XY Controller | Movement Zones | Grid Pads |
|---------|--------------|----------------|-----------|
| **Control Type** | Continuous 2D | Zone-based | Discrete pads |
| **Parameters** | 2 simultaneous | 1 (pitch) | Fixed chords |
| **Interaction** | Fluid movement | Enter zone | Enter/tap pad |
| **Best For** | Expressive playing | Melodic control | Rhythmic phrases |
| **Complexity** | Medium | Low | Low |
| **Precision Required** | Medium | Low | Low |

## How It Works

### 1. Pose → XY Position Mapping

The system extracts your position and maps it to XY coordinates:

**Step 1: Extract Cursor from Pose**

Uses the existing `getCursorFromPose()` function from [zoneMapping.ts](src/services/zoneMapping.ts):

```typescript
Strategy (Multi-Layered Fallback):
1. Primary: Torso Centroid
   - Average of shoulders + hips
   - Most stable for full-body tracking
   - Requires ≥2 detected torso points

2. Fallback 1: Nose
   - Good for head/upper body tracking
   - Single point, reliable

3. Fallback 2: Highest Confidence Keypoint
   - Any keypoint with confidence >0.3
   - Ensures tracking always works
```

**Step 2: Smooth the Position**

Applies exponentially weighted moving average (EWMA):
- Buffer size: 5 recent positions
- Weights: [1, 2, 4, 8, 16] (more recent = higher weight)
- Reduces jitter while maintaining responsiveness

**Step 3: Normalize Coordinates**

- All positions mapped to (0, 1) range
- (0, 0) = top-left corner
- (1, 1) = bottom-right corner

**Step 4: Apply Personalization**

```typescript
function adaptXY(rawX, rawY):
  // Get user's observed movement range
  rangeX = maxX - minX
  rangeY = maxY - minY

  // Scale raw position to fill (0,1) space
  adaptedX = (rawX - minX) / rangeX
  adaptedY = (rawY - minY) / rangeY

  // Clamp to valid range
  adaptedX = clamp(adaptedX, 0, 1)
  adaptedY = clamp(adaptedY, 0, 1)

  return {x: adaptedX, y: adaptedY}
```

**Example**:
```
User naturally moves in center 50% of screen:
- Raw range: X ∈ [0.25, 0.75], Y ∈ [0.25, 0.75]
- System detects this after ~40 samples
- Adapts so user's range fills full (0,1) space
- Small movements now traverse entire XY area
- User gets full parameter control within comfortable range
```

### 2. XY → Audio Parameter Mapping

Each axis controls a specific musical parameter. Default mapping:

**X Axis (Horizontal)**: Pitch
- Left = Low notes (C3)
- Right = High notes (B5)
- Maps to 21-note pentatonic scale

**Y Axis (Vertical)**: Filter Brightness
- Down = Dark (200 Hz lowpass)
- Up = Bright (8000 Hz lowpass)
- Continuous sweep across spectrum

**Available Parameters**:

| Parameter | Range | Unit | Description |
|-----------|-------|------|-------------|
| **Pitch** | C3 - B5 | note | Musical pitch from scale |
| **Filter** | 200 - 8000 | Hz | Lowpass filter cutoff |
| **Volume** | -20 - 0 | dB | Output volume level |
| **Reverb** | 0 - 100 | % | Reverb wet amount |
| **Delay** | 0 - 100 | % | Delay wet amount |
| **Vibrato** | 0 - 10 | Hz | Vibrato frequency |

**Continuous Control**:
- Parameters update in real-time as you move
- Smooth ramping (50ms) prevents clicks
- For pitch: note changes only when crossing scale boundaries

**Audio Engine**:
```
Synth (Triangle oscillator)
  ↓
Filter (Lowpass, 200-8000Hz)
  ↓
Delay (8th note, 30% feedback)
  ↓
Reverb (2s decay, 20% wet)
  ↓
Vibrato (adjustable depth)
  ↓
Destination (speakers)
```

### 3. Personalization & Adaptation

The `useXYPersonalization` hook tracks and adapts your movement patterns.

**What It Tracks**:

```typescript
personalizationData = {
  // Movement range (updated continuously)
  minX: 0.23,      // Leftmost position observed
  maxX: 0.87,      // Rightmost position observed
  minY: 0.19,      // Highest position observed
  maxY: 0.81,      // Lowest position observed
  sampleCount: 147,

  // Center position (for future dead zone)
  centerX: 0.55,   // Average resting position
  centerY: 0.50,

  // Adaptive smoothing (future enhancement)
  smoothingFactor: 0.3  // 0-1, higher = more smoothing
}
```

**How It Adapts**:

1. **Movement Range Scaling**:
   ```typescript
   // Track every cursor position
   For each new position (x, y):
     // Exponential smoothing
     α = sampleCount < 40 ? 0.12 : 0.02  // Fast then slow

     minX = min(minX, minX*(1-α) + x*α)
     maxX = max(maxX, maxX*(1-α) + x*α)
     minY = min(minY, minY*(1-α) + y*α)
     maxY = max(maxY, maxY*(1-α) + y*α)

     // Ensure minimum range (35% of screen)
     if rangeX < 0.35:
       expand range to minimum
   ```

2. **Adaptation Timeline**:
   - **Samples 0-15**: No adaptation (gathering data)
   - **Samples 15-40**: Fast learning (α=0.12)
   - **Samples 40+**: Slow adaptation (α=0.02)

3. **Example Scenario**:
   ```
   Initial State:
   - No adaptation active
   - User moves in center 40% of screen
   - XY surface only uses 40% of parameter ranges

   After 40 Samples:
   - System detects: range is 40% × 40%
   - Begins scaling movement to fill full XY space
   - User's 40% movement now controls 100% of parameters
   - Full expressive range within comfortable movement
   ```

**What AI Does NOT Adapt**:
- ❌ **Parameter mappings**: X always controls what user chose
- ❌ **Audio ranges**: Filter always sweeps 200-8000Hz
- ❌ **Musical relationships**: Scale structure never changes
- ❌ **Control directionality**: Left is always low, right is always high

**Why These Constraints?**:
> User must always know: "Moving right makes it brighter"

Changing parameter meanings would violate predictability.

### 4. Settings Panel (Optional)

Users can customize parameter mappings via the settings panel:

**X Axis Options**:
- Pitch (default)
- Filter
- Volume
- Reverb
- Delay
- Vibrato

**Y Axis Options**:
- Filter (default)
- Pitch
- Volume
- Reverb
- Delay
- Vibrato

**Adaptation Stats**:
- Shows current adapted range (e.g., "68% × 72%")
- Visible after 10+ samples

**Design Philosophy**:
- Settings are **hidden by default** to keep UI simple
- Main experience is "just move and play"
- Power users can customize if desired
- Changes take effect immediately

## Visual Design

### XY Control Surface

```
┌─────────────────────────────────────────┐
│                                         │ ↑
│                                         │ Bright
│              Grid Lines                 │ (Y Axis)
│         ╬════════╬════════╬             │
│         ║        ║        ║             │
│    ╬════╬════════╬════════╬════╬        │
│    ║    ║        ║        ║    ║        │
│ ─────── ║   ⊕ ← Center    ║ ───────    │
│    ║    ║        ║        ║    ║        │
│    ╬════╬════════╬════════╬════╬        │
│         ║    ✛ ← Crosshair║             │
│         ╬════════╬════════╬             │
│                                         │ ↓
│                                         │ Dark
└─────────────────────────────────────────┘
  Low Pitch ←→ High Pitch (X Axis)
```

**Visual Elements**:
1. **Surface**: Large rectangle with gradient background
2. **Grid**: 25/50/75% reference lines
3. **Center**: Small dot marking center
4. **Crosshair**: Blue lines + glowing dot showing position
5. **Axes Labels**: Clear text showing parameter names
6. **Value Display**: Real-time readout of current X/Y values

**Accessibility**:
- High contrast (4px blue border on dark background)
- Large fonts for axis labels
- Crosshair with glow effect (easy to see)
- Grid lines at 25% opacity for reference
- Respects `prefers-reduced-motion` (disables pulse animation)
- Respects `prefers-contrast-high` (thicker borders)

## Usage Instructions

### Basic Use

1. **Start the app**: `npm run dev`
2. **Enter Performance View**
3. **Click "XY Pad"** button
4. **Click "Start"** to begin pose detection
5. **Move in front of camera**:
   - Left/Right: Change pitch (or selected X parameter)
   - Up/Down: Change brightness (or selected Y parameter)
6. **Watch the crosshair** follow your movement
7. **Hear continuous sound** as you move

### Customizing Parameters

1. **Click "Settings"** button (top-right)
2. **Choose X Axis parameter** from dropdown
3. **Choose Y Axis parameter** from dropdown
4. **Settings apply immediately**
5. **Click "Hide"** to close settings panel

### Resetting Adaptation

1. **Click "Reset"** button (top-right)
2. **Clears all personalization data**
3. **Restarts adaptation from scratch**
4. **Useful if movement style changes**

## Technical Implementation

### Files Created

- **Component**: [src/components/XYControllerInstrument.tsx](src/components/XYControllerInstrument.tsx) (450 lines)
- **Styles**: [src/components/XYControllerInstrument.css](src/components/XYControllerInstrument.css) (580 lines)
- **Hook**: [src/hooks/useXYPersonalization.ts](src/hooks/useXYPersonalization.ts) (220 lines)
- **Integration**: Modified [src/components/PerformanceView.tsx](src/components/PerformanceView.tsx)
- **Shared Service**: Uses [src/services/zoneMapping.ts](src/services/zoneMapping.ts) (cursor extraction)
- **Docs**: `XY_CONTROLLER.md` (this file)

### Key Components

1. **XY Surface**:
   ```tsx
   <div className="xy-surface">
     <div className="xy-grid">...</div>  {/* Reference lines */}
     <div className="xy-center-marker" />  {/* Center dot */}
     <div className="xy-cursor">  {/* Crosshair */}
       <div className="xy-cursor-crosshair">
         <div className="xy-cursor-line-h" />  {/* Horizontal line */}
         <div className="xy-cursor-line-v" />  {/* Vertical line */}
         <div className="xy-cursor-dot" />     {/* Center dot */}
       </div>
     </div>
   </div>
   ```

2. **Parameter Mapping**:
   ```tsx
   const mapXToValue = (x: number): number => {
     const [min, max] = PARAMETER_CONFIGS[xParameter].range
     return min + x * (max - min)
   }

   const mapYToValue = (y: number): number => {
     const [min, max] = PARAMETER_CONFIGS[yParameter].range
     return min + (1 - y) * (max - min)  // Invert Y
   }
   ```

3. **Audio Application**:
   ```tsx
   useEffect(() => {
     if (poses && isActive) {
       const cursor = getCursorFromPose(poses[0])
       const adapted = adaptXY(cursor.x, cursor.y)
       applyAudioParameters(adapted.x, adapted.y)
     }
   }, [poses, isActive])
   ```

### State Management

```typescript
// Component state
const [xyPosition, setXYPosition] = useState<{x, y} | null>(null)
const [xParameter, setXParameter] = useState<XYParameter>('pitch')
const [yParameter, setYParameter] = useState<XYParameter>('filter')
const [settingsOpen, setSettingsOpen] = useState(false)

// Audio references (persist across renders)
const synthRef = useRef<Tone.Synth | null>(null)
const filterRef = useRef<Tone.Filter | null>(null)
const reverbRef = useRef<Tone.Reverb | null>(null)
const delayRef = useRef<Tone.FeedbackDelay | null>(null)
const vibratoRef = useRef<Tone.Vibrato | null>(null)

// Personalization hook
const { adaptXY, updateMovementData, resetAdaptation, getStats } = useXYPersonalization()
```

### Storage

Personalization data is saved to localStorage:

```json
{
  "minX": 0.23,
  "maxX": 0.87,
  "minY": 0.19,
  "maxY": 0.81,
  "sampleCount": 147,
  "centerX": 0.55,
  "centerY": 0.50,
  "deadZoneRadius": 0.05,
  "smoothingFactor": 0.3
}
```

Key: `xy-controller-personalization`

Persists across sessions. Can be cleared with "Reset" button.

## Future Enhancements (Stubbed)

The code includes TODOs for potential ML improvements:

### 1. Adaptive Smoothing

```typescript
// TODO: Detect jitter and adjust smoothing
// Calculate velocity variance to detect tremor
// If high variance, increase smoothingFactor automatically
```

**How It Would Work**:
- Track position changes between frames
- Calculate variance in movement speed
- High variance = tremor detected
- Increase smoothing factor (0.3 → 0.6)
- Reduces jitter without user intervention

### 2. Dead Zone Implementation

```typescript
// TODO: Apply dead zone
// If position is near center and movement is small,
// snap to previous position
// Helps users with baseline tremor
```

**How It Would Work**:
- Define dead zone radius around center (e.g., 5%)
- If cursor is in dead zone AND moving slowly:
  - Hold previous XY values
  - Prevents unwanted parameter changes
- Once movement exceeds threshold, resume tracking

### 3. Online Learning of Movement Range

```typescript
// TODO: Faster range prediction
// Use ML to predict final range from first few samples
// Reduces warmup time from 40 to ~10 samples
```

**How It Would Work**:
- Train model on user movement patterns
- Input: first 10 cursor positions
- Output: predicted final min/max X/Y
- Apply prediction immediately
- Faster personalization

### 4. Context-Aware Parameter Suggestions

```typescript
// TODO: Suggest optimal parameter mappings
// Based on user's movement patterns
// E.g., if user moves more horizontally, suggest pitch on X
```

## Known Limitations

1. **Single Cursor**: Only tracks one position (can't use both hands independently)
2. **Fixed Parameter Ranges**: Ranges (e.g., 200-8000Hz) are hardcoded
3. **No Recording**: Can't record and loop XY movements
4. **No MIDI**: Doesn't send MIDI CC messages
5. **Desktop/Tablet Focus**: Optimized for larger screens
6. **Continuous Sound**: Always playing (no gate/trigger)

## Troubleshooting

### Crosshair Not Moving
- Check camera permissions
- Ensure pose detection is active (green indicator)
- Try "Reset" button to clear adaptation

### Sound Not Changing
- Check parameter selections in Settings
- Verify volume is turned up
- Try different parameter combinations

### Erratic Movement
- Improve lighting conditions
- Reduce background movement
- Try "Reset" button
- Move slower for more stability

### Adaptation Too Aggressive
- Reset and move in wider range initially
- System adapts to observed range
- Show it your full movement range early

## Testing Checklist

- [ ] XY surface renders correctly on different screen sizes
- [ ] Crosshair tracks user movement smoothly
- [ ] Sound parameters change in real-time
- [ ] X and Y parameters are independent
- [ ] Settings panel opens and closes correctly
- [ ] Parameter selection works (all 6 options)
- [ ] Adaptation scales movement range over time
- [ ] Reset button clears personalization
- [ ] Mode switching works without errors
- [ ] Webcam permissions handled correctly
- [ ] Audio initializes without errors
- [ ] Grid lines and center marker visible
- [ ] Value display shows correct numbers
- [ ] Works on mobile devices (tablet-sized)
- [ ] High contrast mode works
- [ ] Reduced motion mode disables animations

## Summary

### Pose → XY Computation

1. **Extract cursor** from pose (torso centroid or fallback)
2. **Smooth position** with exponentially weighted moving average
3. **Normalize** to (0, 1) coordinates
4. **Update personalization** data (track min/max X/Y)
5. **Adapt coordinates** to scale user's range to full (0,1) space
6. **Display crosshair** at adapted position

### X and Y Control

**Default Mapping**:
- **X (Horizontal)**: Pitch (C3 to B5, 21-note scale)
- **Y (Vertical)**: Filter Brightness (200Hz to 8000Hz lowpass)

**Configurable Options** (via Settings):
- Pitch, Filter, Volume, Reverb, Delay, Vibrato
- User can assign any parameter to X or Y
- Changes apply immediately

**Audio Flow**:
```
Synth → Filter → Delay → Reverb → Vibrato → Speakers
```

### Per-User Adaptation

**What It Does**:
- Tracks user's natural movement range (min/max X/Y)
- After 15 samples, begins scaling movement to fill (0,1) space
- Adapts gradually (fast initially, then slow)
- Ensures minimum range of 35% to prevent collapse

**What It Doesn't Do**:
- Change parameter mappings (X/Y always control chosen parameters)
- Change audio ranges (filter always 200-8000Hz)
- Alter musical relationships
- Change control directionality

**Storage**:
- Saved to localStorage
- Persists across sessions
- User can reset anytime

**Example**:
- User moves in center 50% of screen
- System detects this after 40 samples
- Adapts so 50% movement fills 100% of XY space
- User gets full parameter control within comfortable range

The XY Controller provides continuous, expressive control perfect for sound design and experimental music making!
