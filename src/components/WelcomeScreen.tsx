import './WelcomeScreen.css'

interface WelcomeScreenProps {
  onStart: () => void
}

function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="container" role="main">
      <h1>Movement to Music AI</h1>
      <p className="welcome-description">
        Transform your movements into music using AI
      </p>
      <div className="welcome-content">
        <p>This application uses your webcam to detect body movements and generates music in real-time based on your gestures.</p>
        <ul className="feature-list" aria-label="Application features">
          <li>Real-time pose detection using AI</li>
          <li>Customizable body part selection</li>
          <li>Dynamic music generation</li>
          <li>Accessible with multiple theme options</li>
        </ul>
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