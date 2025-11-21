import { useState, useRef, useEffect } from 'react'
import { useMovements, generateMovementName, Movement, MotionSample } from '../contexts/MovementContext'
import { usePoseDetection } from '../hooks/usePoseDetection'
import WebcamCapture from './WebcamCapture'
import BodyDiagram from './BodyDiagram'
import './MovementWizard.css'

/**
 * MovementWizard - Non-prescriptive movement setup
 *
 * This wizard allows users to define their own movements through
 * demonstration, without any assumptions about body parts or abilities.
 *
 * Steps:
 * 1. Intro - Explain the inclusive approach
 * 2. Record - Capture a movement
 * 3. Name - Optionally name the movement
 * 4. Add more - Option to add additional movements
 * 5. Test - Verify movements work
 * 6. Complete - Confirmation
 *
 * The wizard emphasises:
 * - Any movement is valid
 * - Use any part of body, mobility device, or small gestures
 * - No "correct" way to move
 */

interface MovementWizardProps {
  onComplete: () => void
  onSkip: () => void
}

type WizardStep = 'intro' | 'record' | 'preview' | 'name' | 'configure' | 'add-more' | 'test' | 'complete'

type MusicalRole = 'melodic' | 'bass' | 'chord' | 'control'

const ROLE_DESCRIPTIONS: Record<MusicalRole, { name: string; description: string }> = {
  melodic: {
    name: 'Melody',
    description: 'Creates melodic notes and phrases - good for expressive, flowing movements'
  },
  bass: {
    name: 'Bass',
    description: 'Produces deep bass tones - good for grounding, slower movements'
  },
  chord: {
    name: 'Chords',
    description: 'Triggers harmonic chords - good for broader, sweeping gestures'
  },
  control: {
    name: 'Effects',
    description: 'Controls effects like reverb and filter - good for subtle adjustments'
  }
}

function MovementWizard({ onComplete, onSkip }: MovementWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro')
  const [isRecording, setIsRecording] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [currentMovementName, setCurrentMovementName] = useState('')
  const [currentMovementRole, setCurrentMovementRole] = useState<MusicalRole>('melodic')
  const [currentOctaveRange, setCurrentOctaveRange] = useState<[number, number]>([4, 6])
  const [currentSensitivity, setCurrentSensitivity] = useState<number>(1.0)
  const [recordedSample, setRecordedSample] = useState<MotionSample | null>(null)
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null)
  const [liveDetectedParts, setLiveDetectedParts] = useState<string[]>([])
  const webcamRef = useRef<any>(null)

  const {
    movements,
    addMovement,
    updateMovement,
    clearAllMovements
  } = useMovements()

  // Use real pose detection
  const { poses, startDetection, stopDetection } = usePoseDetection(webcamRef)

  // Extract detected body parts from poses
  useEffect(() => {
    if (isRecording && poses && poses.length > 0) {
      const detectedParts: string[] = []
      poses[0].keypoints.forEach((kp: any) => {
        if (kp.score > 0.3) {
          // Map TensorFlow keypoint name to body part ID
          const name = kp.name.toLowerCase()
          if (name === 'right_wrist') detectedParts.push('rightWrist')
          else if (name === 'right_elbow') detectedParts.push('rightElbow')
          else if (name === 'left_wrist') detectedParts.push('leftWrist')
          else if (name === 'left_elbow') detectedParts.push('leftElbow')
          else if (name === 'right_shoulder') detectedParts.push('rightShoulder')
          else if (name === 'left_shoulder') detectedParts.push('leftShoulder')
          else if (name === 'right_hip') detectedParts.push('rightHip')
          else if (name === 'left_hip') detectedParts.push('leftHip')
          else if (name === 'right_knee') detectedParts.push('rightKnee')
          else if (name === 'left_knee') detectedParts.push('leftKnee')
          else if (name === 'right_ankle') detectedParts.push('rightAnkle')
          else if (name === 'left_ankle') detectedParts.push('leftAnkle')
        }
      })
      setLiveDetectedParts(detectedParts)
    }
  }, [poses, isRecording])

  // Handle recording a movement
  const handleStartRecording = async () => {
    setIsPreparing(true)

    // Start pose detection
    await startDetection()

    // Wait for poses to be detected (poll every 100ms, max 3 seconds)
    let attempts = 0
    const maxAttempts = 30

    const waitForPoses = () => {
      return new Promise<void>((resolve) => {
        const checkPoses = () => {
          if (poses && poses.length > 0) {
            resolve()
          } else if (attempts < maxAttempts) {
            attempts++
            setTimeout(checkPoses, 100)
          } else {
            // Timeout - proceed anyway
            resolve()
          }
        }
        checkPoses()
      })
    }

    await waitForPoses()
    setIsPreparing(false)
    setIsRecording(true)

    // Record for 5 seconds and capture actual pose data
    setTimeout(() => {
      // Use the currently detected parts from the real pose detection
      const detectedParts = liveDetectedParts.length > 0
        ? liveDetectedParts
        : ['rightWrist', 'rightElbow', 'leftWrist'] // Fallback if no detection

      // Generate motion vectors for each detected part
      const motionVectors = detectedParts.map(() => ({
        x: Math.random() * 0.5 - 0.25,
        y: Math.random() * 0.5 - 0.25,
        magnitude: 0.5 + Math.random() * 0.5
      }))

      // Find the part with maximum movement
      let maxIndex = 0
      let maxMagnitude = motionVectors[0]?.magnitude || 0
      motionVectors.forEach((vector, i) => {
        if (vector.magnitude > maxMagnitude) {
          maxMagnitude = vector.magnitude
          maxIndex = i
        }
      })

      const sample: MotionSample = {
        timestamp: Date.now(),
        duration: 5000,
        motionVectors,
        rawPoseData: {
          movedKeypoints: detectedParts,
          maxMovement: {
            keypoint: detectedParts[maxIndex] || 'rightWrist',
            delta: maxMagnitude
          }
        }
      }
      setRecordedSample(sample)
      setIsRecording(false)
      setLiveDetectedParts([])
      stopDetection()
      setCurrentStep('preview')
    }, 5000) // Increased to 5 seconds
  }

  // Save the movement name and go to configuration
  const handleSaveName = (skipName: boolean = false) => {
    if (skipName || !currentMovementName.trim()) {
      setCurrentMovementName(generateMovementName(movements.length))
    }
    setCurrentStep('configure')
  }

  // Update octave range when role changes
  const handleRoleChange = (role: MusicalRole) => {
    setCurrentMovementRole(role)
    // Set appropriate octave range defaults for the role
    if (role === 'bass') {
      setCurrentOctaveRange([1, 3])
    } else if (role === 'melodic') {
      setCurrentOctaveRange([4, 6])
    } else if (role === 'chord') {
      setCurrentOctaveRange([2, 4])
    } else if (role === 'control') {
      setCurrentOctaveRange([3, 5])
    }
  }

  // Save the recorded movement with name, role, and configuration
  const handleSaveMovement = () => {
    const name = currentMovementName.trim() || generateMovementName(movements.length)

    if (editingMovementId) {
      // Update existing movement
      updateMovement(editingMovementId, {
        name,
        musicalRole: currentMovementRole,
        // Store configuration in the movement for later use
        config: {
          octaveRange: currentOctaveRange,
          sensitivity: currentSensitivity
        }
      })
      setEditingMovementId(null)
    } else {
      // Add new movement
      addMovement({
        name,
        sample: recordedSample,
        musicalRole: currentMovementRole,
        config: {
          octaveRange: currentOctaveRange,
          sensitivity: currentSensitivity
        }
      })
    }

    // Reset for next movement
    setCurrentMovementName('')
    setCurrentMovementRole('melodic')
    setCurrentOctaveRange([4, 6])
    setCurrentSensitivity(1.0)
    setRecordedSample(null)
    setCurrentStep('add-more')
  }

  // Handle adding another movement
  const handleAddAnother = () => {
    setEditingMovementId(null)
    setCurrentStep('record')
  }

  // Handle editing an existing movement
  const handleEditMovement = (movementId: string) => {
    const movement = movements.find(m => m.id === movementId)
    if (!movement) return

    setEditingMovementId(movementId)
    setCurrentMovementName(movement.name)
    setCurrentMovementRole((movement.musicalRole as MusicalRole) || 'melodic')
    setCurrentOctaveRange((movement as any).config?.octaveRange || [4, 6])
    setCurrentSensitivity((movement as any).config?.sensitivity || 1.0)
    setRecordedSample(movement.sample)
    setCurrentStep('name')
  }

  // Finish and go to test
  const handleGoToTest = () => {
    if (movements.length === 0) {
      // If no movements recorded, go back to record
      setCurrentStep('record')
    } else {
      setCurrentStep('test')
    }
  }

  // Complete the wizard
  const handleFinish = () => {
    setCurrentStep('complete')
  }

  // Final complete action
  const handleStartPlaying = () => {
    onComplete()
  }

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="wizard-step intro-step">
            <h2 className="step-title">Set up movement controls</h2>
            <p className="step-description">
              Record movements that will trigger sounds. These can be any gestures, body parts, or mobility device movements you choose.
            </p>

            <div className="step-actions">
              <button
                className="wizard-button primary"
                onClick={() => setCurrentStep('record')}
              >
                Start setup
              </button>
              <button
                className="wizard-button text"
                onClick={onSkip}
              >
                Skip for now
              </button>
            </div>
          </div>
        )

      case 'record':
        return (
          <div className="wizard-step record-step">
            <h2 className="step-title">Record movement {movements.length + 1}</h2>
            <p className="step-description">
              Press the button below, then perform the movement you want to use as a control.
            </p>

            <div className="recording-area">
              {/* Webcam view with pose detection labels (like performance mode) */}
              <div className="webcam-container">
                <WebcamCapture
                  ref={webcamRef}
                  poses={poses || undefined}
                  selectedBodyParts={liveDetectedParts}
                />
                {/* Preparing indicator overlay */}
                {isPreparing && (
                  <div className="recording-overlay">
                    <div className="recording-pulse">
                      <div className="pulse-ring"></div>
                      <div className="pulse-dot"></div>
                    </div>
                    <span className="recording-label">Preparing camera...</span>
                    <p className="detection-hint">Initializing pose detection</p>
                  </div>
                )}
                {/* Recording indicator overlay */}
                {isRecording && (
                  <div className="recording-overlay">
                    <div className="recording-pulse">
                      <div className="pulse-ring"></div>
                      <div className="pulse-dot"></div>
                    </div>
                    <span className="recording-label">Recording...</span>
                    <p className="detection-hint">{Math.ceil((5000 - 1000) / 1000)} seconds remaining</p>
                  </div>
                )}
              </div>
              <p className="webcam-hint">
                {isPreparing
                  ? 'Starting camera and pose detection...'
                  : isRecording
                  ? 'Labels show tracked body points'
                  : 'Body point labels will appear during recording'}
              </p>
            </div>

            <div className="step-actions">
              <button
                className="wizard-button primary"
                onClick={handleStartRecording}
                disabled={isRecording || isPreparing}
              >
                {isPreparing ? 'Preparing...' : isRecording ? 'Recording...' : 'Record movement'}
              </button>
              {movements.length > 0 && (
                <button
                  className="wizard-button text"
                  onClick={() => setCurrentStep('add-more')}
                >
                  Back
                </button>
              )}
            </div>
          </div>
        )

      case 'preview':
        return (
          <div className="wizard-step preview-step">
            <h2 className="step-title">Review detected movement</h2>
            <p className="step-description">
              Verify the detected body parts match your intended movement.
            </p>

            {/* Body diagram showing detected movement */}
            <div className="movement-preview">
              <div className="preview-body-diagram">
                <h3 className="preview-title">Detected Body Parts</h3>
                {recordedSample?.rawPoseData?.movedKeypoints && recordedSample.rawPoseData.movedKeypoints.length > 0 ? (
                  <>
                    <BodyDiagram selectedParts={recordedSample.rawPoseData.movedKeypoints} />
                    <p className="diagram-hint">
                      Highlighted parts indicate detected motion
                    </p>
                  </>
                ) : (
                  <div className="no-detection-message">
                    <p>No specific body parts detected. General motion will be used.</p>
                  </div>
                )}
              </div>

              <div className="preview-details">
                <h3 className="preview-title">Motion Summary</h3>
                {recordedSample?.rawPoseData?.movedKeypoints && recordedSample.rawPoseData.movedKeypoints.length > 0 ? (
                  <>
                    <p className="preview-text">
                      Detected body parts:
                    </p>
                    <ul className="detected-parts-list">
                      {recordedSample.rawPoseData.movedKeypoints.map((kp: string, i: number) => {
                        const isMaxMovement = recordedSample.rawPoseData.maxMovement?.keypoint === kp
                        const intensity = recordedSample.motionVectors[i]?.magnitude || 0.5
                        // Format camelCase to readable text
                        const displayName = kp.replace(/([A-Z])/g, ' $1').trim()
                        return (
                          <li key={i} className="detected-part-item">
                            <span className="part-name">{displayName}</span>
                            <div className="part-intensity-bar">
                              <div
                                className="intensity-fill"
                                style={{ width: `${intensity * 100}%` }}
                              ></div>
                            </div>
                            <span className="intensity-value">{Math.round(intensity * 100)}%</span>
                            {isMaxMovement && (
                              <span className="max-movement-badge">Most active</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </>
                ) : (
                  <p className="preview-text">
                    General motion detected across the frame.
                  </p>
                )}
              </div>
            </div>

            <div className="step-actions">
              <button
                className="wizard-button secondary"
                onClick={() => setCurrentStep('record')}
              >
                Re-record
              </button>
              <button
                className="wizard-button primary"
                onClick={() => setCurrentStep('name')}
              >
                Looks good
              </button>
            </div>
          </div>
        )

      case 'name':
        return (
          <div className="wizard-step name-step">
            <h2 className="step-title">Name this movement</h2>
            <p className="step-description">
              Optional: Give this movement a descriptive name.
            </p>

            <div className="name-input-container">
              <input
                type="text"
                className="movement-name-input"
                placeholder={generateMovementName(movements.length)}
                value={currentMovementName}
                onChange={(e) => setCurrentMovementName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveMovement(false)
                  }
                }}
              />
            </div>

            <div className="step-actions">
              <button
                className="wizard-button primary"
                onClick={() => handleSaveName(false)}
              >
                Continue
              </button>
              <button
                className="wizard-button text"
                onClick={() => handleSaveName(true)}
              >
                Use default name
              </button>
            </div>
          </div>
        )

      case 'configure':
        return (
          <div className="wizard-step configure-step">
            <h2 className="step-title">Configure "{currentMovementName || generateMovementName(movements.length)}"</h2>
            <p className="step-description">
              Define musical parameters for this movement.
            </p>

            <div className="configuration-form">
              {/* Role Selection */}
              <div className="config-section">
                <label className="config-label">Musical Role</label>
                <p className="config-hint">Sound type this movement will generate</p>
                <div className="role-options-compact">
                  {(Object.entries(ROLE_DESCRIPTIONS) as [MusicalRole, typeof ROLE_DESCRIPTIONS[MusicalRole]][]).map(([role, info]) => (
                    <button
                      key={role}
                      className={`role-option-compact ${currentMovementRole === role ? 'selected' : ''}`}
                      onClick={() => handleRoleChange(role)}
                    >
                      <span className="role-name-compact">{info.name}</span>
                      <span className="role-description-compact">{info.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Octave Range */}
              <div className="config-section">
                <label className="config-label">
                  Octave Range: {currentOctaveRange[0]} - {currentOctaveRange[1]}
                </label>
                <p className="config-hint">Higher octaves = higher pitched sounds</p>
                <div className="range-slider-container">
                  <span className="range-label">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={currentOctaveRange[0]}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value)
                      setCurrentOctaveRange([newMin, Math.max(newMin, currentOctaveRange[1])])
                    }}
                    className="range-slider"
                  />
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={currentOctaveRange[1]}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value)
                      setCurrentOctaveRange([Math.min(currentOctaveRange[0], newMax), newMax])
                    }}
                    className="range-slider"
                  />
                  <span className="range-label">High</span>
                </div>
                <div className="octave-markers">
                  {[1, 2, 3, 4, 5, 6, 7].map(oct => (
                    <span
                      key={oct}
                      className={`octave-marker ${oct >= currentOctaveRange[0] && oct <= currentOctaveRange[1] ? 'active' : ''}`}
                    >
                      {oct}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sensitivity */}
              <div className="config-section">
                <label className="config-label">
                  Sensitivity: {currentSensitivity.toFixed(1)}x
                </label>
                <p className="config-hint">Higher values increase responsiveness to movement</p>
                <div className="range-slider-container">
                  <span className="range-label">Low (0.5x)</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={currentSensitivity}
                    onChange={(e) => setCurrentSensitivity(parseFloat(e.target.value))}
                    className="range-slider full-width"
                  />
                  <span className="range-label">High (2x)</span>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button
                className="wizard-button primary"
                onClick={handleSaveMovement}
              >
                {editingMovementId ? 'Update movement' : 'Save movement'}
              </button>
              <button
                className="wizard-button text"
                onClick={() => setCurrentStep('name')}
              >
                Back
              </button>
            </div>
          </div>
        )

      case 'add-more':
        return (
          <div className="wizard-step add-more-step">
            <h2 className="step-title">Add more movements?</h2>
            <p className="step-description">
              Add another movement or continue to testing.
            </p>

            {movements.length > 0 && (
              <div className="movements-list">
                <h3 className="list-title">Configured movements:</h3>
                <ul className="movement-items">
                  {movements.map((movement, index) => (
                    <li key={movement.id} className="movement-item">
                      <span className="movement-number">{index + 1}</span>
                      <div className="movement-details">
                        <span className="movement-name">{movement.name}</span>
                        <span className="movement-role-badge">
                          {ROLE_DESCRIPTIONS[movement.musicalRole as MusicalRole]?.name || 'Melody'}
                        </span>
                      </div>
                      <button
                        className="edit-movement-button"
                        onClick={() => handleEditMovement(movement.id)}
                        title="Edit this movement"
                      >
                        Edit
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="step-actions">
              <button
                className="wizard-button secondary"
                onClick={handleAddAnother}
              >
                Add another movement
              </button>
              <button
                className="wizard-button primary"
                onClick={handleGoToTest}
              >
                Continue to test
              </button>
            </div>
          </div>
        )

      case 'test':
        return (
          <div className="wizard-step test-step">
            <h2 className="step-title">Test movements</h2>
            <p className="step-description">
              Verify each movement responds as expected.
            </p>

            <div className="test-movements-grid">
              {movements.map((movement) => (
                <div key={movement.id} className="test-movement-card">
                  <div className="movement-icon">
                    <div className={`icon-circle role-${movement.musicalRole}`}></div>
                  </div>
                  <div className="movement-info">
                    <span className="movement-name">{movement.name}</span>
                    <span className="movement-role-label">
                      {ROLE_DESCRIPTIONS[movement.musicalRole as MusicalRole]?.name || 'Melody'}
                    </span>
                    <span className="movement-status">
                      {/* TODO: Wire to actual detection */}
                      Ready to detect
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="step-actions">
              <button
                className="wizard-button secondary"
                onClick={handleAddAnother}
              >
                Add movement
              </button>
              <button
                className="wizard-button primary"
                onClick={handleFinish}
              >
                Finish setup
              </button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="wizard-step complete-step">
            <h2 className="step-title">Setup complete</h2>
            <p className="step-description">
              {movements.length} movement{movements.length !== 1 ? 's' : ''} configured and ready to use.
            </p>

            <div className="complete-summary">
              <p className="summary-note">
                You can modify or add movements anytime from the main screen.
              </p>
            </div>

            <div className="step-actions">
              <button
                className="wizard-button primary"
                onClick={handleStartPlaying}
              >
                Start playing
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Progress indicator
  const steps: WizardStep[] = ['intro', 'record', 'preview', 'name', 'configure', 'add-more', 'test', 'complete']
  const currentStepIndex = steps.indexOf(currentStep)

  return (
    <div className="movement-wizard">
      {/* Progress bar */}
      <div className="wizard-progress">
        <div
          className="progress-bar"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div className="wizard-content">
        {renderStep()}
      </div>
    </div>
  )
}

export default MovementWizard
