# Deploy with completely clean HTML

# Stop on errors
$ErrorActionPreference = "Stop"

# Step A: First, update the index.html file to remove the skip to content link
$originalIndexHtml = Get-Content -Path "index.html" -Raw
$cleanedIndexHtml = $originalIndexHtml -replace '<a href="#main-content" class="skip-to-content">Skip to main content</a>', ''
Set-Content -Path "index.html" -Value $cleanedIndexHtml

# Step 1: Clean build
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Step 2: Create a completely clean index.html
$cleanHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movement to Music AI</title>
  <link rel="stylesheet" href="/simplified-music-tool/assets/index-39ede4c9.css">
  <script type="module" crossorigin src="/simplified-music-tool/assets/index-e7585ebc.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
"@

# Overwrite the index.html in dist
Set-Content -Path "dist\index.html" -Value $cleanHtml

# Step 3: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "dist\.nojekyll" -ItemType File -Force | Out-Null

# Step 4: Create temp directory for deployment
Write-Host "Preparing deployment directory..." -ForegroundColor Green
$tempDir = "gh-pages-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Make sure .nojekyll is in the deployment directory
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force | Out-Null

# Step 5: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Deploy with completely clean HTML"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

# Restore the original index.html
Set-Content -Path "index.html" -Value $originalIndexHtml

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan