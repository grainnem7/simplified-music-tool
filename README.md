# Movement-to-Music AI

A web application that transforms human movements into music using AI. Users can select specific body parts to track for musical generation while ignoring others, creating a customizable movement-to-music experience.

## Features

- Real-time pose detection using TensorFlow.js and MoveNet
- Customizable body part selection for music generation
- Multiple musical modes (conductor, dancer, full body)
- Real-time music synthesis using Tone.js
- Visual feedback for tracked movements
- Client-side processing (no external API dependencies)

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd movement-to-music-ai

# Install dependencies
npm install
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Usage

1. Open the application in a modern web browser with webcam support
2. Grant camera permissions when prompted
3. Select which body parts you want to use for music generation
4. Choose a preset or create a custom configuration
5. Start performing and watch as your movements create music!

## Technical Stack

- React 18 with TypeScript
- Vite for build tooling
- TensorFlow.js for pose detection
- Tone.js for audio synthesis
- MoveNet/BlazePose models for movement tracking

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari (with limitations)

## License

MIT