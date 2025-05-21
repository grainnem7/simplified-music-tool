import './WelcomeScreen.css'

interface WelcomeScreenProps {
  onStart: () => void
}

function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="container" role="main">
      <h1>Movement to Music AI</h1>
      <p className="welcome-description">
        Create music using your body movements 
      </p>
      <div className="welcome-content">
        <button 
          onClick={onStart}
          aria-label="Get started with Movement to Music"
          className="primary-button"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen