import { Link } from 'react-router-dom'
import './EntryScreen.css'

/**
 * EntryScreen - Inclusive entry point for the music tool
 *
 * This screen replaces the old body-part selection setup.
 * It provides two paths:
 * 1. "Play now" - Jump straight in with default motion detection
 * 2. "Customise my movements" - Set up personal movement patterns
 *
 * Design principles:
 * - No assumptions about user's body or abilities
 * - Immediate access to making music
 * - Optional customisation for regular users
 */

interface EntryScreenProps {
  onPlayNow: () => void
  onCustomise: () => void
  onAdvancedSetup: () => void
}

function EntryScreen({ onPlayNow, onCustomise, onAdvancedSetup }: EntryScreenProps) {
  return (
    <div className="entry-screen">
      <div className="entry-header">
        <div className="entry-header-top">
          <h1 className="entry-title">Get Started</h1>
          <Link
            to="/about"
            className="about-link"
          >
            About
          </Link>
        </div>
        <p className="entry-subtitle">
          Start with default controls or configure custom movements.
        </p>
      </div>

      <div className="entry-options">
        {/* Primary action: Play now */}
        <div className="entry-option primary-option">
          <button
            className="entry-button primary"
            onClick={onPlayNow}
            aria-describedby="play-now-description"
          >
            Play now
          </button>
          <p id="play-now-description" className="option-description">
            Start immediately with default motion detection. Any movement in front of the camera will generate sound.
          </p>
        </div>

        {/* Secondary action: Customise */}
        <div className="entry-option secondary-option">
          <button
            className="entry-button secondary"
            onClick={onCustomise}
            aria-describedby="customise-description"
          >
            Customise my movements
          </button>
          <p id="customise-description" className="option-description">
            Record and configure your own movement controls. Recommended for regular use or when you need specific gesture mappings.
          </p>
        </div>

        {/* Advanced action: Body part selector */}
        <div className="entry-option advanced-option">
          <button
            className="entry-button secondary"
            onClick={onAdvancedSetup}
            aria-describedby="advanced-description"
          >
            Select body parts
          </button>
          <p id="advanced-description" className="option-description">
            Select specific body parts to track using a diagram. Provides precise control over detected landmarks.
          </p>
        </div>
      </div>

      <div className="entry-note">
        <p>
          Movement settings can be changed anytime from the main screen.
        </p>
      </div>
    </div>
  )
}

export default EntryScreen
