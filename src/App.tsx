import { useState, useEffect } from 'react'
import './App.css'
import WelcomeScreen from './components/WelcomeScreen'
import SetupScreen from './components/SetupScreen'
import PerformanceView from './components/PerformanceView'
import ThemeSelector from './components/ThemeSelector'
import { ThemeProvider } from './contexts/ThemeContext'

type AppState = 'welcome' | 'setup' | 'performance'

function App() {
  const [currentState, setCurrentState] = useState<AppState>('welcome')
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])
  
  // Remove any GitHub corners that might be present from previous builds
  useEffect(() => {
    const githubCorner = document.querySelector('.github-corner')
    if (githubCorner) {
      githubCorner.remove()
    }
  }, [])

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
    <ThemeProvider>
      <div className="App">
        <header className="app-header">
          <ThemeSelector />
        </header>
        <main id="main-content">
          {currentState === 'welcome' && <WelcomeScreen onStart={handleStart} />}
          {currentState === 'setup' && <SetupScreen onComplete={handleSetupComplete} />}
          {currentState === 'performance' && (
            <PerformanceView 
              selectedBodyParts={selectedBodyParts} 
              onBackToSetup={handleBackToSetup}
            />
          )}
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App