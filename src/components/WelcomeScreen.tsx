import './WelcomeScreen.css'

interface WelcomeScreenProps {
  onStart: () => void
}

function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen" role="main">
      <div className="welcome-hero">
        <h1 className="hero-title">
          <span className="title-primary">Gesture</span>
          <span className="title-accent"> to Music</span>
        </h1>
      </div>

      <button
        onClick={onStart}
        aria-label="Get started with Gesture to Music"
        className="hero-button"
      >
        <span>Get Started</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

export default WelcomeScreen