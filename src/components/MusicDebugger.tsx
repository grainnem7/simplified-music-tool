import { useState } from 'react'
import { useMusicGeneration } from '../hooks/useMusicGeneration'
import * as Tone from 'tone'
import './MusicDebugger.css'

function MusicDebugger() {
  const [logs, setLogs] = useState<string[]>([])
  const { generateMusic, stopMusic, testSound, selectPreset, currentPreset } = useMusicGeneration()
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }
  
  const handleTestSound = async () => {
    try {
      addLog('Starting test sound...')
      await Tone.start()
      addLog('Tone.js started')
      await testSound()
      addLog('Test sound completed')
    } catch (error) {
      addLog(`Error: ${error}`)
    }
  }
  
  const simulateHandMovement = async () => {
    try {
      await Tone.start()
      addLog('Simulating hand movement...')
      
      // Simulate a pose with hand movement
      const mockPose = {
        keypoints: [
          {
            name: 'right_wrist',
            x: 0.5,  // Center of screen horizontally
            y: 0.2,  // High up (inverted to 0.8 for high pitch)
            score: 0.9
          }
        ]
      }
      
      // Generate music for a simulated movement
      addLog('Generating music for high hand position')
      await generateMusic([mockPose], ['rightWrist'])
      
      setTimeout(() => {
        // Move hand down
        mockPose.keypoints[0].y = 0.8  // Low position
        addLog('Generating music for low hand position')
        generateMusic([mockPose], ['rightWrist'])
      }, 1000)
      
      setTimeout(() => stopMusic(), 3000)
    } catch (error) {
      addLog(`Error: ${error}`)
    }
  }
  
  return (
    <div className="music-debugger">
      <h3>Music Generation Debugger</h3>
      
      <div className="debug-controls">
        <button onClick={handleTestSound}>Test Basic Sound</button>
        <button onClick={simulateHandMovement}>Simulate Hand Movement</button>
        <button onClick={() => setLogs([])}>Clear Logs</button>
      </div>
      
      <div className="preset-controls">
        <label>Preset:</label>
        <select value={currentPreset} onChange={(e) => selectPreset(e.target.value)}>
          <option value="piano">Piano</option>
          <option value="synth">Synth</option>
          <option value="strings">Strings</option>
        </select>
      </div>
      
      <div className="log-output">
        <h4>Logs:</h4>
        {logs.length === 0 ? (
          <p>No logs yet</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))
        )}
      </div>
    </div>
  )
}

export default MusicDebugger