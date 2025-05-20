# Clean deployment script for Windows PowerShell
# This script ensures ONLY the dist contents are published

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Step 2: Create a temporary directory for deployment
Write-Host "Creating temporary directory..." -ForegroundColor Green
$tempDir = "gh-pages-temp"
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Step 3: Copy ONLY the dist contents to the temp directory (NOT the dist folder itself)
Write-Host "Copying build files..." -ForegroundColor Green
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Step 4: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force | Out-Null

# Step 5: Initialize Git in the temp directory
Set-Location -Path $tempDir
git init
git checkout -b main

# Step 6: Add all files
git add -A

# Step 7: Commit the changes
git commit -m "Clean deployment to GitHub Pages"

# Step 8: Push to the gh-pages branch - REPLACE WITH YOUR REPOSITORY
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Step 9: Return to the original directory
Set-Location -Path ..

# Step 10: Clean up
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan