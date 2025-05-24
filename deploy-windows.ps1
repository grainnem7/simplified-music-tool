# PowerShell script to deploy to GitHub Pages from Windows
Write-Host "Deploying to GitHub Pages..." -ForegroundColor Green

# Clear out previous build if it exists
if (Test-Path "dist") {
    Write-Host "Cleaning previous build..." -ForegroundColor Cyan
    Remove-Item -Path "dist" -Recurse -Force
}

# Build the project 
Write-Host "Building the project..." -ForegroundColor Cyan
npm run build

# Create .nojekyll file to prevent Jekyll processing
Write-Host "Creating .nojekyll file..." -ForegroundColor Cyan
New-Item -Path "dist/.nojekyll" -ItemType File -Force

# Create a temporary directory for the gh-pages branch
$tempDir = "temp-gh-pages"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory

# Clone the gh-pages branch
Write-Host "Cloning gh-pages branch..." -ForegroundColor Cyan
git clone -b gh-pages https://github.com/grainnem7/simplified-music-tool.git $tempDir

# Clear existing files
Write-Host "Preparing for new files..." -ForegroundColor Cyan
Get-ChildItem -Path "$tempDir" -Exclude ".git" | Remove-Item -Recurse -Force

# Copy the dist files to the temporary directory
Write-Host "Copying build files..." -ForegroundColor Cyan
Copy-Item -Path "dist/*" -Destination $tempDir -Recurse

# Create .nojekyll file directly in the deployment directory
New-Item -Path "$tempDir/.nojekyll" -ItemType File -Force

# Commit and push
Write-Host "Committing and pushing changes..." -ForegroundColor Cyan
Push-Location $tempDir
git add .
git commit -m "Deploy to GitHub Pages"
git push
Pop-Location

# Clean up
Write-Host "Cleaning up..." -ForegroundColor Cyan
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Yellow
Write-Host "Note: It might take a few minutes for changes to propagate and appear online." -ForegroundColor Yellow