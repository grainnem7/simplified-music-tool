import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import EntryScreen from './components/EntryScreen'
import MovementWizard from './components/MovementWizard'
import SetupScreen from './components/SetupScreen'
import PerformanceView from './components/PerformanceView'
import ThemeSelector from './components/ThemeSelector'
import AboutPage from './components/AboutPage'
import { ThemeProvider } from './contexts/ThemeContext'
import { MusicSettingsProvider, useMusicSettings } from './contexts/MusicSettingsContext'
import { MovementProvider, useMovements } from './contexts/MovementContext'

/**
 * App State Flow:
 * - 'entry': Initial screen with "Play now", "Customise", or "Advanced setup" options
 * - 'wizard': Movement setup wizard for custom movements (inclusive, non-prescriptive)
 * - 'advanced-setup': Traditional body part selector (for advanced users)
 * - 'performance': Main music-making interface
 *
 * This flow is designed to be inclusive and non-prescriptive by default:
 * - "Play now" bypasses setup entirely, using default motion detection
 * - "Customise" lets users define their own movements through demonstration
 * - "Advanced setup" provides the traditional body-part selection for those who prefer it
 */
type AppState = 'entry' | 'wizard' | 'advanced-setup' | 'performance'

function MainApp() {
  const [currentState, setCurrentState] = useState<AppState>('entry')
  const { setDefaultMode, getActiveMovements } = useMovements()
  const { updateSettings } = useMusicSettings()

  // For backwards compatibility with the music engine, we still need to pass
  // some body parts. In default mode, we use a generic set. In custom mode,
  // we map movements to the internal body part system.
  // TODO: Refactor music engine to work directly with Movement objects
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([])

  // Body part pools for each role
  const MELODIC_PARTS = ['rightWrist', 'rightElbow', 'rightShoulder']
  const BASS_PARTS = ['leftWrist', 'leftElbow', 'leftShoulder']
  const CHORD_PARTS = ['rightHip', 'leftHip', 'rightKnee', 'leftKnee']
  const CONTROL_PARTS = ['rightAnkle', 'leftAnkle']

  // Remove any GitHub corners that might be present from previous builds
  useEffect(() => {
    const githubCorner = document.querySelector('.github-corner')
    if (githubCorner) {
      githubCorner.remove()
    }
  }, [])

  // Handle "Play now" - go straight to performance with default mapping
  const handlePlayNow = () => {
    setDefaultMode(true)
    // Use a default set of body parts for the music engine
    // This provides generic motion detection without exposing body-part UI
    setSelectedBodyParts(['rightWrist', 'leftWrist', 'rightElbow', 'leftElbow'])
    setCurrentState('performance')
  }

  // Handle "Customise my movements" - open the wizard
  const handleCustomise = () => {
    setCurrentState('wizard')
  }

  // Handle "Advanced setup" - open the body part selector
  const handleAdvancedSetup = () => {
    setCurrentState('advanced-setup')
  }

  // Handle advanced setup completion (from body part selector)
  const handleAdvancedSetupComplete = (bodyParts: string[]) => {
    setDefaultMode(false)
    setSelectedBodyParts(bodyParts)
    setCurrentState('performance')
  }

  // Handle wizard completion
  const handleWizardComplete = () => {
    setDefaultMode(false)
    const movements = getActiveMovements()

    // Map movements to body parts based on their roles
    const usedParts: string[] = []
    const newBodyPartConfigs: Record<string, { role: string; sensitivity: number; octaveRange: [number, number] }> = {}

    // Track how many of each role we've assigned
    const roleCounters = { melodic: 0, bass: 0, chord: 0, control: 0 }

    movements.forEach(movement => {
      const role = movement.musicalRole || 'melodic'
      let bodyPart: string | undefined

      // Assign a body part from the appropriate pool
      switch (role) {
        case 'melodic':
          bodyPart = MELODIC_PARTS[roleCounters.melodic % MELODIC_PARTS.length]
          roleCounters.melodic++
          break
        case 'bass':
          bodyPart = BASS_PARTS[roleCounters.bass % BASS_PARTS.length]
          roleCounters.bass++
          break
        case 'chord':
          bodyPart = CHORD_PARTS[roleCounters.chord % CHORD_PARTS.length]
          roleCounters.chord++
          break
        case 'control':
          bodyPart = CONTROL_PARTS[roleCounters.control % CONTROL_PARTS.length]
          roleCounters.control++
          break
        default:
          bodyPart = MELODIC_PARTS[roleCounters.melodic % MELODIC_PARTS.length]
          roleCounters.melodic++
      }

      if (bodyPart && !usedParts.includes(bodyPart)) {
        usedParts.push(bodyPart)
        newBodyPartConfigs[bodyPart] = {
          role: role === 'control' ? 'melodic' : role, // Map control to melodic for now
          sensitivity: 1.0,
          octaveRange: role === 'bass' ? [1, 3] : role === 'chord' ? [2, 4] : [4, 6]
        }
      }
    })

    // Update the music settings with the new body part configs
    updateSettings({ bodyPartConfigs: newBodyPartConfigs })

    // Set the selected body parts
    setSelectedBodyParts(usedParts.length > 0 ? usedParts : ['rightWrist', 'leftWrist'])
    setCurrentState('performance')
  }

  // Handle wizard skip (same as Play now)
  const handleWizardSkip = () => {
    handlePlayNow()
  }

  // Handle back to entry
  const handleBackToEntry = () => {
    setCurrentState('entry')
  }

  // Handle change movements (open wizard from performance)
  const handleChangeMovements = () => {
    setCurrentState('wizard')
  }

  return (
    <div className="App">
      <header className="app-header">
        <ThemeSelector />
      </header>
      <main id="main-content">
        {currentState === 'entry' && (
          <EntryScreen
            onPlayNow={handlePlayNow}
            onCustomise={handleCustomise}
            onAdvancedSetup={handleAdvancedSetup}
          />
        )}
        {currentState === 'wizard' && (
          <MovementWizard
            onComplete={handleWizardComplete}
            onSkip={handleWizardSkip}
          />
        )}
        {currentState === 'advanced-setup' && (
          <SetupScreen
            onComplete={handleAdvancedSetupComplete}
          />
        )}
        {currentState === 'performance' && (
          <PerformanceView
            selectedBodyParts={selectedBodyParts}
            onBackToSetup={handleBackToEntry}
            onChangeMovements={handleChangeMovements}
          />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <MusicSettingsProvider>
        <MovementProvider>
          <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </MovementProvider>
      </MusicSettingsProvider>
    </ThemeProvider>
  )
}

export default App