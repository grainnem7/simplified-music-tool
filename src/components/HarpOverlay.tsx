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
  // Log what we're receiving
  useEffect(() => {
    if (fingertipPositions && fingertipPositions.length > 0) {
      console.log('HarpOverlay received index fingers:', fingertipPositions.length);
    }
  }, [fingertipPositions]);

  const [lastFingertipPositions, setLastFingertipPositions] = useState<Map<string, number>>(new Map());
  const [vibratingSstrings, setVibratingStrings] = useState<Set<number>>(new Set());
  const [lastCrossedStrings, setLastCrossedStrings] = useState<Map<string, number>>(new Map());
  const [lastNoteTime, setLastNoteTime] = useState<number>(0);

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
      // We have fingertips! (removed log to reduce spam)
      
      fingertipPositions.forEach(fingertip => {
        const fingerId = `${fingertip.hand}_${fingertip.finger}`;
        const lastX = lastFingertipPositions.get(fingerId);
        
        if (lastX === undefined) {
          setLastFingertipPositions(prev => new Map(prev).set(fingerId, fingertip.x));
          return;
        }

        // Check each string to see if fingertip crossed it
        displayStrings.forEach((string, index) => {
          const stringX = stringSpacing * (index + 1);
          const crossed = (lastX < stringX && fingertip.x >= stringX) || 
                         (lastX > stringX && fingertip.x <= stringX);
          
          // Get the last crossed string for this fingertip
          const lastCrossedString = lastCrossedStrings.get(fingerId);
          
          // Only play if we crossed the string AND it's not the same string we just crossed
          if (crossed && lastCrossedString !== index) {
            const now = Date.now();
            const timeSinceLastNote = now - lastNoteTime;
            
            // Calculate movement speed for dynamic adjustments
            const movementSpeed = Math.abs(fingertip.x - lastX);
            const isGlissando = movementSpeed > 15;
            
            // Minimum time between notes to prevent crushing (in milliseconds)
            const minNoteSpacing = isGlissando ? 25 : 60;
            
            // Always play the note, but respect minimum spacing
            if (timeSinceLastNote >= minNoteSpacing) {
              const actualNote = getActualNote(string);
              const velocity = isGlissando ? 0.6 : 0.85;
              
              // Play immediately for better responsiveness
              onStringPlucked(index, actualNote, velocity);
              setLastNoteTime(now);
            }
            
            // Always record the crossing even if we don't play the note
            setLastCrossedStrings(prev => new Map(prev).set(fingerId, index));
            
            // Add vibration effect
            setVibratingStrings(prev => new Set(prev).add(index));
            setTimeout(() => {
              setVibratingStrings(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
              });
            }, 500);
          }
        });

        setLastFingertipPositions(prev => new Map(prev).set(fingerId, fingertip.x));
        
        // Clear last crossed string if finger is far from any string
        const nearestStringDistance = Math.min(
          ...displayStrings.map((_, index) => Math.abs(fingertip.x - stringSpacing * (index + 1)))
        );
        if (nearestStringDistance > stringSpacing / 2) {
          setLastCrossedStrings(prev => {
            const next = new Map(prev);
            next.delete(fingerId);
            return next;
          });
        }
      });
    }
  }, [fingertipPositions, onStringPlucked, displayStrings, stringSpacing, pedalPositions]);

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
        
        {/* Render fingertip positions with labels */}
        {fingertipPositions && fingertipPositions.map((fingertip, index) => {
          // Skip rendering if coordinates are invalid
          if (isNaN(fingertip.x) || isNaN(fingertip.y)) return null;
          
          return (
            <g key={`fingertip-${index}`}>
              <circle
                cx={fingertip.x}
                cy={fingertip.y}
                r={10}
                fill={fingertip.hand === 'left' ? '#4ecdc4' : '#f7b801'}
                opacity={0.9}
                stroke="#ffffff"
                strokeWidth={3}
                className="fingertip-indicator"
              />
              <text
                x={fingertip.x}
                y={fingertip.y - 15}
                textAnchor="middle"
                fill={fingertip.hand === 'left' ? '#4ecdc4' : '#f7b801'}
                fontSize="14"
                fontWeight="bold"
                stroke="#000000"
                strokeWidth="0.5"
              >
                {fingertip.hand === 'left' ? 'L' : 'R'}
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