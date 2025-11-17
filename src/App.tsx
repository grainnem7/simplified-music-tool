import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import SetupScreen from './components/SetupScreen'
import PerformanceView from './components/PerformanceView'
import ThemeSelector from './components/ThemeSelector'
import ProposalGuide, { CONTENT } from './components/ProposalGuide'
import AboutPage from './components/AboutPage'
import { ThemeProvider } from './contexts/ThemeContext'

type AppState = 'setup' | 'performance'

function MainApp() {
  const [currentState, setCurrentState] = useState<AppState>('setup')
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])

  // Remove any GitHub corners that might be present from previous builds
  useEffect(() => {
    const githubCorner = document.querySelector('.github-corner')
    if (githubCorner) {
      githubCorner.remove()
    }
  }, [])

  const handleSetupComplete = (bodyParts: string[]) => {
    setSelectedBodyParts(bodyParts)
    setCurrentState('performance')
  }

  const handleBackToSetup = () => {
    setCurrentState('setup')
  }

  return (
    <div className="App">
      <header className="app-header">
        <ThemeSelector />
      </header>
      <main id="main-content">
        {currentState === 'setup' && <SetupScreen onComplete={handleSetupComplete} />}
        {currentState === 'performance' && (
          <PerformanceView
            selectedBodyParts={selectedBodyParts}
            onBackToSetup={handleBackToSetup}
          />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/proposal"
          element={
            <ProposalGuide
              content={CONTENT}
              projectTitle="Amplifying Accessibility in Artificial Music Systems"
            />
          }
        />
      </Routes>
    </ThemeProvider>
  )
}

export default App