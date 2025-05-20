# Deploy with enhanced public files

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Make sure we have .nojekyll in the public directory
Write-Host "Ensuring .nojekyll is in the public directory..." -ForegroundColor Green
New-Item -Path "public\.nojekyll" -ItemType File -Force | Out-Null

# Step 2: Build the project
Write-Host "Building project with updated configuration..." -ForegroundColor Green
npm run build

# Step 3: Create temp directory for deployment
Write-Host "Preparing deployment directory..." -ForegroundColor Green
$tempDir = "gh-pages-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Make sure .nojekyll is in the deployment directory
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force | Out-Null

# Step 4: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Deploy with enhanced configuration"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan