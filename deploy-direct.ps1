# Direct deployment script with post-build fixes
# This script modifies the built files directly before deployment

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Step 2: Fix paths in the built index.html file
Write-Host "Fixing paths in index.html..." -ForegroundColor Yellow
$indexPath = "dist\index.html"
$indexContent = Get-Content -Path $indexPath -Raw

# Replace absolute paths with correct prefixed paths
$fixedContent = $indexContent -replace 'href="/vite.svg"', 'href="/simplified-music-tool/vite.svg"'

# Write the fixed content back
Set-Content -Path $indexPath -Value $fixedContent

# Step 3: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "dist\.nojekyll" -ItemType File -Force | Out-Null

# Step 4: Create temp directory and copy files
Write-Host "Preparing deployment directory..." -ForegroundColor Green
$tempDir = "gh-pages-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Step 5: Initialize Git in the temp directory and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Deploy with fixed paths"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan