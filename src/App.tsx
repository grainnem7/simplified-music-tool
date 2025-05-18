import { useState } from 'react'
import './App.css'
import WelcomeScreen from './components/WelcomeScreen'
import SetupScreen from './components/SetupScreen'
import PerformanceView from './components/PerformanceView'

type AppState = 'welcome' | 'setup' | 'performance'

function App() {
  const [currentState, setCurrentState] = useState<AppState>('welcome')
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])

  const handleStart = () => {
    setCurrentState('setup')
  }

  const handleSetupComplete = (bodyParts: string[]) => {
    setSelectedBodyParts(bodyParts)
    setCurrentState('performance')
  }

  const handleBackToSetup = () => {
    setCurrentState('setup')
  }

  return (
    <div className="App">
      {currentState === 'welcome' && <WelcomeScreen onStart={handleStart} />}
      {currentState === 'setup' && <SetupScreen onComplete={handleSetupComplete} />}
      {currentState === 'performance' && (
        <PerformanceView 
          selectedBodyParts={selectedBodyParts} 
          onBackToSetup={handleBackToSetup}
        />
      )}
    </div>
  )
}

export default App