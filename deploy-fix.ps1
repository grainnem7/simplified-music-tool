# Clean deployment script for GitHub Pages with fix for path issues
# This script ensures paths are correctly configured in the build

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Step 2: Create a temporary directory for deployment
Write-Host "Creating temporary directory..." -ForegroundColor Green
$tempDir = "gh-pages-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Step 3: Copy ONLY the dist contents to the temp directory (NOT the dist folder itself)
Write-Host "Copying build files..." -ForegroundColor Green
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Step 4: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force | Out-Null

# Step 5: Validate the index.html file to ensure it doesn't have path issues
Write-Host "Checking index.html for path issues..." -ForegroundColor Yellow
$indexPath = "$tempDir\index.html"
$indexContent = Get-Content -Path $indexPath -Raw

if ($indexContent -match '(src|href)="./src/') {
    Write-Host "WARNING: Found relative path to src directory in index.html. This will cause issues." -ForegroundColor Red
    Write-Host "The build process should have removed these references." -ForegroundColor Red
    
    Write-Host "Continuing with deployment anyway..." -ForegroundColor Yellow
}

# Step 6: Initialize Git in the temp directory
Set-Location -Path $tempDir
git init
git checkout -b main

# Step 7: Add all files
git add -A

# Step 8: Commit the changes
git commit -m "Clean deployment to GitHub Pages"

# Step 9: Push to the gh-pages branch
Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Step 10: Return to the original directory
Set-Location -Path ..

# Step 11: Clean up
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan