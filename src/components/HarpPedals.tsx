import React, { memo, useState, useEffect, useRef } from 'react';
import './HarpPedals.css';

interface HarpPedalsProps {
  pedalPositions: { [key: string]: 'flat' | 'natural' | 'sharp' };
  onPedalChange: (pedal: string, position: 'flat' | 'natural' | 'sharp') => void;
  presets?: { [key: string]: { [key: string]: 'flat' | 'natural' | 'sharp' } };
  onPresetSelect?: (presetName: string) => void;
}

// Harp pedals are arranged: D C B | E F G A
const PEDAL_ORDER = ['D', 'C', 'B', 'E', 'F', 'G', 'A'];
// Musical scale order for display
const MUSICAL_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Common scale presets
const DEFAULT_PRESETS: { [key: string]: { [key: string]: 'flat' | 'natural' | 'sharp' } } = {
  // Major scales
  'C Major': { D: 'natural', C: 'natural', B: 'natural', E: 'natural', F: 'natural', G: 'natural', A: 'natural' },
  'G Major': { D: 'natural', C: 'natural', B: 'natural', E: 'natural', F: 'sharp', G: 'natural', A: 'natural' },
  'D Major': { D: 'natural', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'natural', A: 'natural' },
  'A Major': { D: 'natural', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'sharp', A: 'natural' },
  'E Major': { D: 'sharp', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'sharp', A: 'natural' },
  'B Major': { D: 'sharp', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'sharp', A: 'sharp' },
  'F Major': { D: 'natural', C: 'natural', B: 'flat', E: 'natural', F: 'natural', G: 'natural', A: 'natural' },
  'B♭ Major': { D: 'natural', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'natural', A: 'natural' },
  'E♭ Major': { D: 'natural', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'natural', A: 'flat' },
  'A♭ Major': { D: 'flat', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'natural', A: 'flat' },
  'D♭ Major': { D: 'flat', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'flat', A: 'flat' },
  'G♭ Major': { D: 'flat', C: 'flat', B: 'flat', E: 'flat', F: 'natural', G: 'flat', A: 'flat' },
  // Minor scales
  'A Minor': { D: 'natural', C: 'natural', B: 'natural', E: 'natural', F: 'natural', G: 'natural', A: 'natural' },
  'E Minor': { D: 'natural', C: 'natural', B: 'natural', E: 'natural', F: 'sharp', G: 'natural', A: 'natural' },
  'B Minor': { D: 'natural', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'natural', A: 'natural' },
  'D Minor': { D: 'natural', C: 'natural', B: 'flat', E: 'natural', F: 'natural', G: 'natural', A: 'natural' },
  'G Minor': { D: 'natural', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'natural', A: 'natural' },
  'C Minor': { D: 'natural', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'natural', A: 'flat' },
  // Special scales
  'Chromatic': { D: 'sharp', C: 'sharp', B: 'sharp', E: 'sharp', F: 'sharp', G: 'sharp', A: 'sharp' },
  'Whole Tone': { D: 'natural', C: 'natural', B: 'flat', E: 'natural', F: 'sharp', G: 'sharp', A: 'flat' },
  'Pentatonic': { D: 'natural', C: 'natural', B: 'flat', E: 'natural', F: 'sharp', G: 'natural', A: 'natural' }
};

const HarpPedals: React.FC<HarpPedalsProps> = memo(({ 
  pedalPositions, 
  onPedalChange,
  presets = DEFAULT_PRESETS,
  onPresetSelect
}) => {
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the scale on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw staff lines
    const staffY = canvas.height / 2;
    const lineSpacing = 10;
    const staffLeft = 40;
    const staffRight = canvas.width - 20;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;

    // Draw 5 staff lines
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(staffLeft, staffY + i * lineSpacing);
      ctx.lineTo(staffRight, staffY + i * lineSpacing);
      ctx.stroke();
    }

    // Draw treble clef
    ctx.font = '36px serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('𝄞', 10, staffY + 6);

    // Note positions on staff (treble clef)
    const getStaffPosition = (note: string): number => {
      const positions: { [key: string]: number } = {
        'C': -1,
        'D': -0.5,
        'E': 0,
        'F': 0.5,
        'G': 1,
        'A': 1.5,
        'B': 2
      };
      
      return positions[note] || 0;
    };

    // Draw the scale notes
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const noteSpacing = (staffRight - staffLeft - 60) / 7;
    
    notes.forEach((note, index) => {
      const x = staffLeft + 40 + index * noteSpacing;
      
      // Get the staff position for this note
      const staffPosition = getStaffPosition(note);
      // Calculate Y position (staff positions increase going up, but Y coordinates decrease)
      const y = staffY + 2 * lineSpacing - staffPosition * lineSpacing;

      // Draw ledger lines if needed
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      
      // C4 needs a ledger line below the staff
      if (note === 'C') {
        ctx.beginPath();
        ctx.moveTo(x - 12, staffY + 3 * lineSpacing);
        ctx.lineTo(x + 12, staffY + 3 * lineSpacing);
        ctx.stroke();
      }

      // Draw note head
      ctx.beginPath();
      ctx.ellipse(x, y, 7, 5, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw accidental if needed
      const pedalPosition = pedalPositions[note] || 'natural';
      if (pedalPosition !== 'natural') {
        ctx.font = '20px serif';
        ctx.fillStyle = '#fff';
        const accidental = pedalPosition === 'flat' ? '♭' : '♯';
        ctx.fillText(accidental, x - 25, y + 6);
      }
    });

  }, [pedalPositions]);

  const getPedalSymbol = (position: 'flat' | 'natural' | 'sharp'): string => {
    switch (position) {
      case 'flat': return '♭';
      case 'natural': return '♮';
      case 'sharp': return '♯';
    }
  };

  const cyclePedalPosition = (currentPosition: 'flat' | 'natural' | 'sharp'): 'flat' | 'natural' | 'sharp' => {
    switch (currentPosition) {
      case 'flat': return 'natural';
      case 'natural': return 'sharp';
      case 'sharp': return 'flat';
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetName = e.target.value;
    if (presetName && onPresetSelect) {
      onPresetSelect(presetName);
    }
  };

  return (
    <div className="harp-pedals-container">
      <div className="pedals-header">
        <div className="pedals-label">Harp Pedals</div>
        {onPresetSelect && (
          <button 
            className="preset-button"
            onClick={() => setShowPresetSelector(!showPresetSelector)}
          >
            Presets
          </button>
        )}
      </div>

      <div className="pedals-display">
        {/* Left foot pedals */}
        <div className="pedal-group left-foot">
          {PEDAL_ORDER.slice(0, 3).map(pedal => {
            const position = pedalPositions[pedal] || 'natural';
            return (
              <div key={pedal} className="pedal-control">
                <button
                  className={`pedal pedal-${position}`}
                  onClick={() => onPedalChange(pedal, cyclePedalPosition(position))}
                  aria-label={`${pedal} pedal, currently ${position}`}
                >
                  <div className="pedal-letter">{pedal}</div>
                  <div className="pedal-position">
                    <span className={position === 'sharp' ? 'active' : ''}>♯</span>
                    <span className={position === 'natural' ? 'active' : ''}>♮</span>
                    <span className={position === 'flat' ? 'active' : ''}>♭</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="pedal-divider"></div>

        {/* Right foot pedals */}
        <div className="pedal-group right-foot">
          {PEDAL_ORDER.slice(3).map(pedal => {
            const position = pedalPositions[pedal] || 'natural';
            return (
              <div key={pedal} className="pedal-control">
                <button
                  className={`pedal pedal-${position}`}
                  onClick={() => onPedalChange(pedal, cyclePedalPosition(position))}
                  aria-label={`${pedal} pedal, currently ${position}`}
                >
                  <div className="pedal-letter">{pedal}</div>
                  <div className="pedal-position">
                    <span className={position === 'sharp' ? 'active' : ''}>♯</span>
                    <span className={position === 'natural' ? 'active' : ''}>♮</span>
                    <span className={position === 'flat' ? 'active' : ''}>♭</span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scale display in sheet music */}
      <div className="scale-display">
        <canvas 
          ref={canvasRef}
          width={400}
          height={120}
          className="scale-canvas"
        />
      </div>

      {/* Current scale display - clickable */}
      <div 
        className="current-scale clickable"
        onClick={() => onPresetSelect && setShowPresetSelector(!showPresetSelector)}
        title="Click to select a preset"
      >
        {MUSICAL_ORDER.map(pedal => (
          <span key={pedal} className="scale-note">
            {pedal}{getPedalSymbol(pedalPositions[pedal] || 'natural')}
          </span>
        ))}
      </div>

      {/* Preset selector popup */}
      {showPresetSelector && onPresetSelect && (
        <div className="preset-selector-popup">
          <div className="preset-popup-header">
            <h3>Select Scale</h3>
            <button 
              className="close-button"
              onClick={() => setShowPresetSelector(false)}
            >
              ×
            </button>
          </div>
          <div className="preset-list">
            <div className="preset-category">
              <div className="category-label">Major Scales</div>
              {Object.keys(presets).filter(name => name.includes('Major')).map(presetName => (
                <button
                  key={presetName}
                  className="preset-option"
                  onClick={() => {
                    onPresetSelect(presetName);
                    setShowPresetSelector(false);
                  }}
                >
                  {presetName}
                </button>
              ))}
            </div>
            <div className="preset-category">
              <div className="category-label">Minor Scales</div>
              {Object.keys(presets).filter(name => name.includes('Minor')).map(presetName => (
                <button
                  key={presetName}
                  className="preset-option"
                  onClick={() => {
                    onPresetSelect(presetName);
                    setShowPresetSelector(false);
                  }}
                >
                  {presetName}
                </button>
              ))}
            </div>
            <div className="preset-category">
              <div className="category-label">Special Scales</div>
              {Object.keys(presets).filter(name => !name.includes('Major') && !name.includes('Minor')).map(presetName => (
                <button
                  key={presetName}
                  className="preset-option"
                  onClick={() => {
                    onPresetSelect(presetName);
                    setShowPresetSelector(false);
                  }}
                >
                  {presetName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

HarpPedals.displayName = 'HarpPedals';

export default HarpPedals;
export { DEFAULT_PRESETS };