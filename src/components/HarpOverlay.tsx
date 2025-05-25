import React, { useState, useEffect, memo } from 'react';
import './HarpOverlay.css';

interface HarpOverlayProps {
  width: number;
  height: number;
  fingertipPositions?: Array<{ x: number; y: number; finger: string; hand: 'left' | 'right' }>;
  onStringPlucked?: (stringIndex: number, note: string, velocity?: number) => void;
  pedalPositions: { [key: string]: 'flat' | 'natural' | 'sharp' };
  isMobile?: boolean;
  showDebug?: boolean;
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
  fingertipPositions,
  onStringPlucked,
  pedalPositions,
  isMobile = false
}) => {

  const [lastFingertipPositions, setLastFingertipPositions] = useState<Map<string, number>>(new Map());
  const [vibratingSstrings, setVibratingStrings] = useState<Set<number>>(new Set());
  const [lastPlayedStringIndex, setLastPlayedStringIndex] = useState<number>(-1);
  const [lastPlayedTime, setLastPlayedTime] = useState<number>(0);

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




  // Check for string collisions - prefer fingertips if available, fallback to wrists
  useEffect(() => {
    if (!onStringPlucked) return;
    
    // Debug logging - only log once
    // Removed excessive logging

    // Use fingertip positions if available
    if (fingertipPositions && fingertipPositions.length > 0) {
      fingertipPositions.forEach(fingertip => {
        const fingerId = `${fingertip.hand}_${fingertip.finger}`;
        const lastX = lastFingertipPositions.get(fingerId);
        
        if (lastX === undefined) {
          setLastFingertipPositions(prev => new Map(prev).set(fingerId, fingertip.x));
          return;
        }

        // Find the string index for current and last position
        const getStringIndex = (x: number) => {
          for (let i = 0; i < displayStrings.length; i++) {
            const stringX = stringSpacing * (i + 1);
            if (Math.abs(x - stringX) < stringSpacing * 0.5) {
              return i;
            }
          }
          return -1;
        };

        const currentStringIndex = getStringIndex(fingertip.x);
        const lastStringIndex = getStringIndex(lastX);
        
        // If we're over a string
        if (currentStringIndex !== -1) {
          // Single string pluck (no movement or same string)
          if (lastStringIndex === -1 || currentStringIndex === lastStringIndex) {
            // Only play if this is a new touch or enough time has passed
            if (lastPlayedStringIndex !== currentStringIndex || Date.now() - lastPlayedTime > 100) {
              const actualNote = getActualNote(displayStrings[currentStringIndex]);
              console.log('Playing single string:', currentStringIndex, 'note:', actualNote);
              onStringPlucked(currentStringIndex, actualNote, 0.5);
              setLastPlayedStringIndex(currentStringIndex);
              setLastPlayedTime(Date.now());
              
              // Visual feedback
              setVibratingStrings(prev => new Set(prev).add(currentStringIndex));
              setTimeout(() => {
                setVibratingStrings(prev => {
                  const next = new Set(prev);
                  next.delete(currentStringIndex);
                  return next;
                });
              }, 500);
            }
          } 
          // Glissando (moved to a different string)
          else if (lastStringIndex !== -1 && currentStringIndex !== lastStringIndex) {
          // Find all strings between last and current (inclusive)
          const start = Math.min(lastStringIndex, currentStringIndex);
          const end = Math.max(lastStringIndex, currentStringIndex);
          const isMovingRight = currentStringIndex > lastStringIndex;
          
          // Play each string in order (excluding the starting position)
          let noteDelay = 0;
          
          if (isMovingRight) {
            // Moving right: play from lastStringIndex+1 to currentStringIndex
            for (let i = lastStringIndex + 1; i <= currentStringIndex; i++) {
              const actualNote = getActualNote(displayStrings[i]);
              
              setTimeout(() => {
                console.log('Playing string:', i, 'note:', actualNote);
                onStringPlucked(i, actualNote, 0.4);
                
                // Visual feedback
                setVibratingStrings(prev => new Set(prev).add(i));
                setTimeout(() => {
                  setVibratingStrings(prev => {
                    const next = new Set(prev);
                    next.delete(i);
                    return next;
                  });
                }, 500);
              }, noteDelay);
              
              noteDelay += 25; // 25ms between notes
            }
          } else {
            // Moving left: play from lastStringIndex-1 down to currentStringIndex
            for (let i = lastStringIndex - 1; i >= currentStringIndex; i--) {
              const actualNote = getActualNote(displayStrings[i]);
              
              setTimeout(() => {
                console.log('Playing string:', i, 'note:', actualNote);
                onStringPlucked(i, actualNote, 0.4);
                
                // Visual feedback
                setVibratingStrings(prev => new Set(prev).add(i));
                setTimeout(() => {
                  setVibratingStrings(prev => {
                    const next = new Set(prev);
                    next.delete(i);
                    return next;
                  });
                }, 500);
              }, noteDelay);
              
              noteDelay += 25; // 25ms between notes
            }
          }
          
          setLastPlayedStringIndex(currentStringIndex);
          }
        }

        setLastFingertipPositions(prev => new Map(prev).set(fingerId, fingertip.x));
      });
    }
  }, [fingertipPositions, onStringPlucked, displayStrings, stringSpacing, pedalPositions, lastPlayedStringIndex, lastPlayedTime]);

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
        
        {/* Fingertip positions are tracked but not rendered for cleaner view */}
      </svg>
    </div>
  );
});

HarpOverlay.displayName = 'HarpOverlay';

export default HarpOverlay;