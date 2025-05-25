import React, { memo } from 'react';
import './HarpPedals.css';

interface HarpPedalsProps {
  pedalPositions: { [key: string]: 'flat' | 'natural' | 'sharp' };
  onPedalChange: (pedal: string, position: 'flat' | 'natural' | 'sharp') => void;
  presets?: { [key: string]: { [key: string]: 'flat' | 'natural' | 'sharp' } };
  onPresetSelect?: (presetName: string) => void;
}

// Harp pedals are arranged: D C B | E F G A
const PEDAL_ORDER = ['D', 'C', 'B', 'E', 'F', 'G', 'A'];

// Common scale presets
const DEFAULT_PRESETS = {
  'C Major': { D: 'natural', C: 'natural', B: 'natural', E: 'natural', F: 'natural', G: 'natural', A: 'natural' },
  'G Major': { D: 'natural', C: 'natural', B: 'natural', E: 'natural', F: 'sharp', G: 'natural', A: 'natural' },
  'D Major': { D: 'natural', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'natural', A: 'natural' },
  'A Major': { D: 'natural', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'sharp', A: 'natural' },
  'E Major': { D: 'sharp', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'sharp', A: 'natural' },
  'B Major': { D: 'sharp', C: 'sharp', B: 'natural', E: 'natural', F: 'sharp', G: 'sharp', A: 'sharp' },
  'F Major': { D: 'natural', C: 'natural', B: 'flat', E: 'natural', F: 'natural', G: 'natural', A: 'natural' },
  'Bb Major': { D: 'natural', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'natural', A: 'natural' },
  'Eb Major': { D: 'natural', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'natural', A: 'flat' },
  'Ab Major': { D: 'flat', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'natural', A: 'flat' },
  'Db Major': { D: 'flat', C: 'natural', B: 'flat', E: 'flat', F: 'natural', G: 'flat', A: 'flat' },
  'Gb Major': { D: 'flat', C: 'flat', B: 'flat', E: 'flat', F: 'natural', G: 'flat', A: 'flat' },
  'Whole Tone': { D: 'natural', C: 'natural', B: 'flat', E: 'natural', F: 'sharp', G: 'sharp', A: 'flat' },
  'Pentatonic': { D: 'natural', C: 'natural', B: 'flat', E: 'natural', F: 'sharp', G: 'natural', A: 'natural' }
};

const HarpPedals: React.FC<HarpPedalsProps> = memo(({ 
  pedalPositions, 
  onPedalChange,
  presets = DEFAULT_PRESETS,
  onPresetSelect
}) => {
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
      <div className="pedals-label">Harp Pedals</div>
      
      {/* Preset selector */}
      {onPresetSelect && (
        <div className="preset-selector">
          <label htmlFor="scale-preset">Scale Preset:</label>
          <select id="scale-preset" onChange={handlePresetChange} defaultValue="">
            <option value="">Custom</option>
            {Object.keys(presets).map(presetName => (
              <option key={presetName} value={presetName}>{presetName}</option>
            ))}
          </select>
        </div>
      )}

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

      {/* Current scale display */}
      <div className="current-scale">
        {PEDAL_ORDER.map(pedal => (
          <span key={pedal} className="scale-note">
            {pedal}{getPedalSymbol(pedalPositions[pedal] || 'natural')}
          </span>
        ))}
      </div>
    </div>
  );
});

HarpPedals.displayName = 'HarpPedals';

export default HarpPedals;
export { DEFAULT_PRESETS };