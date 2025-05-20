# PowerShell script to deploy to GitHub Pages
Write-Host "Deploying to GitHub Pages..." -ForegroundColor Green

# Build the project 
Write-Host "Building the project..." -ForegroundColor Cyan
npm run build

# Create .nojekyll file to prevent Jekyll processing
Write-Host "Creating .nojekyll file..." -ForegroundColor Cyan
New-Item -Path "dist/.nojekyll" -ItemType File -Force

# Deploy to GitHub Pages using gh-pages
Write-Host "Deploying to GitHub Pages using gh-pages..." -ForegroundColor Cyan
npx gh-pages -d dist

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Yellow
Write-Host "Note: It might take a few minutes for changes to propagate and appear online." -ForegroundColor Yellow