# Installation Guide for Movement to Music AI

Due to permission issues in WSL environments, here are alternative installation methods:

## Method 1: Using Windows Command Prompt or PowerShell

1. Open Command Prompt or PowerShell as Administrator
2. Navigate to the project directory:
   ```
   cd "C:\Users\Dell Precision\Repos\movement-to-music-ai"
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Method 2: Using Windows with Node.js

1. Install Node.js for Windows from https://nodejs.org/
2. Open the project folder in Windows Explorer
3. Right-click in the folder and select "Open in Terminal"
4. Run the installation commands

## Method 3: Manual Dependency Installation

If automatic installation fails, try installing dependencies one by one:

```bash
npm install react react-dom
npm install -D @types/react @types/react-dom
npm install -D vite @vitejs/plugin-react
npm install -D typescript
```

Then add the complex dependencies:

```bash
npm install @tensorflow/tfjs
npm install @tensorflow-models/pose-detection
npm install tone
npm install react-webcam
```

## Method 4: Using Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
```

Then run:
```bash
docker build -t movement-to-music-ai .
docker run -p 5173:5173 movement-to-music-ai
```

## Troubleshooting

1. **Permission errors**: Run your terminal as Administrator
2. **Module not found**: Delete `node_modules` and `package-lock.json`, then reinstall
3. **Version conflicts**: Use exact versions in package.json
4. **WSL issues**: Consider using native Windows terminal instead

## Minimal Version

A minimal working version is available at:
`C:\Users\Dell Precision\Repos\movement-to-music-ai-minimal`

Run it with:
```bash
cd movement-to-music-ai-minimal
node server.js
```

Then open http://localhost:3000 in your browser.