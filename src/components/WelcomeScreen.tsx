interface WelcomeScreenProps {
  onStart: () => void
}

function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="container">
      <h1>Movement to Music AI</h1>
      <p>Transform your movements into music using AI</p>
      <p>This application uses your webcam to detect body movements and generates music in real-time based on your gestures.</p>
      <button onClick={onStart}>Get Started</button>
    </div>
  )
}

export default WelcomeScreen