// Test script to verify intuitive music mapping
// Run with node test-intuitive-music.js

function testIntuitiveMapping() {
  // Test vertical mapping (Y position to pitch)
  console.log('Testing vertical mapping (Y to pitch):')
  
  // Simulate different Y positions (0 = top, 1 = bottom)
  const testPositions = [
    { y: 0.0, expected: 'high pitch (octave 6)' },
    { y: 0.25, expected: 'medium-high pitch (octave 5)' },
    { y: 0.5, expected: 'medium pitch (octave 4-5)' },
    { y: 0.75, expected: 'medium-low pitch (octave 3-4)' },
    { y: 1.0, expected: 'low pitch (octave 3)' }
  ]
  
  testPositions.forEach(pos => {
    // Invert Y (1 - y) to make top = high pitch
    const normalizedY = 1 - pos.y
    const targetOctave = Math.floor(normalizedY * 4) + 3
    console.log(`Y=${pos.y} -> Octave ${targetOctave} (${pos.expected})`)
  })
  
  console.log('\nTesting horizontal mapping (X to note):')
  
  // Test X position to note mapping
  const pentatonicScale = ['C', 'D', 'E', 'G', 'A']
  const xPositions = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
  
  xPositions.forEach(x => {
    const noteIndex = Math.floor(x * pentatonicScale.length)
    const note = pentatonicScale[Math.max(0, Math.min(noteIndex, pentatonicScale.length - 1))]
    console.log(`X=${x} -> Note ${note}`)
  })
  
  console.log('\nIntuitive mapping summary:')
  console.log('- Higher hand position = higher pitch')
  console.log('- Left-to-right movement = C to A notes')
  console.log('- Faster movement = louder volume')
  console.log('- Different body parts have different roles:')
  console.log('  - Hands/Wrists: Play melody')
  console.log('  - Elbows: Play harmony')
  console.log('  - Shoulders: Trigger chord changes')
  console.log('  - Head: Ambient effects')
}

testIntuitiveMapping()