import React, { useState, useEffect, memo } from 'react';
import './HarpOverlay.css';

interface HarpOverlayProps {
  width: number;
  height: number;
  handPositions?: { left?: { x: number; y: number }, right?: { x: number; y: number } };
  onStringPlucked?: (stringIndex: number, note: string) => void;
  pedalPositions: { [key: string]: 'flat' | 'natural' | 'sharp' };
  isMobile?: boolean;
}

// Concert harp has 47 strings from C1 to G7
const HARP_STRINGS: string[] = [
  'C1', 'D1', 'E1', 'F1', 'G1', 'A1', 'B1',
  'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2',
  'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
  'C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6',
  'C7', 'D7', 'E7', 'F7', 'G7'
];

const HarpOverlay: React.FC<HarpOverlayProps> = memo(({ 
  width, 
  height, 
  handPositions, 
  onStringPlucked,
  pedalPositions,
  isMobile = false
}) => {
  const [activeStrings, setActiveStrings] = useState<Set<number>>(new Set());
  const [lastHandPositions, setLastHandPositions] = useState<{ left?: { x: number }, right?: { x: number } }>({});
  const [vibratingSstrings, setVibratingStrings] = useState<Set<number>>(new Set());

  // For mobile, show every other string to improve performance
  const displayStrings = isMobile ? HARP_STRINGS.filter((_, index) => index % 2 === 0) : HARP_STRINGS;
  const totalStrings = displayStrings.length;
  const stringSpacing = width / (totalStrings + 1);

  // Get string color based on note
  const getStringColor = (note: string): string => {
    const noteName = note[0];
    if (noteName === 'C') return '#ff0000'; // Red for C strings
    if (noteName === 'F') return '#000080'; // Navy blue for F strings
    return '#ffffff'; // White for all other strings
  };

  // Get actual note with pedal modifications
  const getActualNote = (baseNote: string): string => {
    const noteName = baseNote[0];
    const octave = baseNote.slice(1);
    const pedalPosition = pedalPositions[noteName] || 'natural';
    
    let modifier = '';
    if (pedalPosition === 'flat') modifier = 'b';
    else if (pedalPosition === 'sharp') modifier = '#';
    
    return `${noteName}${modifier}${octave}`;
  };

  // Check for string collisions
  useEffect(() => {
    if (!handPositions || !onStringPlucked) return;

    const checkHandCrossing = (hand: 'left' | 'right', position?: { x: number; y: number }) => {
      if (!position) return;
      
      const lastX = lastHandPositions[hand]?.x;
      if (lastX === undefined) {
        setLastHandPositions(prev => ({ ...prev, [hand]: { x: position.x } }));
        return;
      }

      // Check each string to see if hand crossed it
      displayStrings.forEach((string, index) => {
        const stringX = stringSpacing * (index + 1);
        const crossed = (lastX < stringX && position.x >= stringX) || 
                       (lastX > stringX && position.x <= stringX);
        
        if (crossed && !activeStrings.has(index)) {
          // String was plucked
          const actualNote = getActualNote(string);
          onStringPlucked(index, actualNote);
          
          // Add to active strings to prevent rapid re-triggering
          setActiveStrings(prev => new Set(prev).add(index));
          
          // Add vibration effect
          setVibratingStrings(prev => new Set(prev).add(index));
          setTimeout(() => {
            setVibratingStrings(prev => {
              const next = new Set(prev);
              next.delete(index);
              return next;
            });
          }, 500);
          
          // Remove from active after a short delay
          setTimeout(() => {
            setActiveStrings(prev => {
              const next = new Set(prev);
              next.delete(index);
              return next;
            });
          }, 100);
        }
      });

      setLastHandPositions(prev => ({ ...prev, [hand]: { x: position.x } }));
    };

    checkHandCrossing('left', handPositions.left);
    checkHandCrossing('right', handPositions.right);
  }, [handPositions, lastHandPositions, onStringPlucked, activeStrings, displayStrings, stringSpacing, pedalPositions]);

  return (
    <div className="harp-overlay" style={{ width, height }}>
      <svg width={width} height={height} className="harp-strings-svg">
        {displayStrings.map((string, index) => {
          const x = stringSpacing * (index + 1);
          const color = getStringColor(string);
          const isVibrating = vibratingSstrings.has(index);
          
          return (
            <g key={index}>
              <line
                x1={x}
                y1={50}
                x2={x}
                y2={height - 60}
                stroke={color}
                strokeWidth={isVibrating ? 3 : 2}
                opacity={0.7}
                className={isVibrating ? 'vibrating' : ''}
              />
              {/* Note label */}
              <text
                x={x}
                y={height - 40}
                textAnchor="middle"
                fill={color}
                fontSize="10"
                opacity={0.8}
              >
                {string}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

HarpOverlay.displayName = 'HarpOverlay';

export default HarpOverlay;