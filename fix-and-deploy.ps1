# Fix and Deploy script for GitHub Pages
# This script creates a completely new index.html file that works with GitHub Pages

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Step 2: Create a completely new index.html file with correct paths
Write-Host "Creating fixed index.html..." -ForegroundColor Yellow
$newIndexContent = @"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/simplified-music-tool/assets/vite-4391efe2.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Transform your movements into music using AI with customizable body part tracking and multiple accessibility themes" />
    <meta name="theme-color" content="#1a1a1a" />
    <title>Movement to Music AI - Accessible Motion-Based Music Generation</title>
    <script type="module" crossorigin src="/simplified-music-tool/assets/index-e7585ebc.js"></script>
    <link rel="stylesheet" href="/simplified-music-tool/assets/index-39ede4c9.css">
  </head>
  <body>
    <a href="#main-content" class="skip-to-content">Skip to main content</a>
    <div id="root"></div>
  </body>
</html>
"@

# Write the new index.html
Set-Content -Path "dist\index.html" -Value $newIndexContent

# Step 3: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "dist\.nojekyll" -ItemType File -Force | Out-Null

# Step 4: Copy vite.svg to assets folder if it's not already there
if (Test-Path "dist\assets\vite-*.svg") {
    Write-Host "Vite SVG already in assets folder." -ForegroundColor Green
} else {
    Write-Host "Copying vite.svg to assets folder..." -ForegroundColor Yellow
    Copy-Item -Path "public\vite.svg" -Destination "dist\assets\vite.svg" -Force
}

# Step 5: Create temporary directory for deployment
Write-Host "Preparing deployment directory..." -ForegroundColor Green
$tempDir = "gh-pages-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Step 6: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Deploy with fully fixed paths"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan