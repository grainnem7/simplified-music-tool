import './MusicGenerator.css'
import * as Tone from 'tone'

interface MusicGeneratorProps {
  isActive: boolean
  poses: any
  selectedBodyParts: string[]
}

function MusicGenerator({ isActive, poses, selectedBodyParts }: MusicGeneratorProps) {
  const testSound = async () => {
    console.log('Testing Tone.js...')
    await Tone.start()
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease("C4", "8n")
    console.log('Test sound triggered')
  }

  return (
    <div className="music-generator">
      <div className="status">
        {isActive ? 'Generating Music...' : 'Ready'}
      </div>
      
      <button onClick={testSound}>Test Sound</button>
      
      <div className="visualization">
        {/* This will show audio visualization */}
      </div>
    </div>
  )
}

export default MusicGenerator