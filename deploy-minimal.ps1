# Deploy with minimal index.html file
# This script creates a minimal index.html file that works with GitHub Pages

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Find asset filenames dynamically
$cssFile = Get-ChildItem -Path "dist\assets" -Filter "index-*.css" | Select-Object -First 1
$jsFile = Get-ChildItem -Path "dist\assets" -Filter "index-*.js" | Select-Object -First 1

if (!$cssFile -or !$jsFile) {
    Write-Host "Error: Could not find CSS or JS files in dist\assets" -ForegroundColor Red
    exit 1
}

$cssFileName = $cssFile.Name
$jsFileName = $jsFile.Name

Write-Host "Found CSS file: $cssFileName" -ForegroundColor Green
Write-Host "Found JS file: $jsFileName" -ForegroundColor Green

# Step 2: Create a simple index.html file with correct paths
Write-Host "Creating minimal index.html..." -ForegroundColor Yellow
$newIndexContent = @"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Movement to Music AI</title>
    <link rel="stylesheet" href="/simplified-music-tool/assets/$cssFileName">
    <script type="module" crossorigin src="/simplified-music-tool/assets/$jsFileName"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"@

# Write the new index.html
Set-Content -Path "dist\index.html" -Value $newIndexContent

# Step 3: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "dist\.nojekyll" -ItemType File -Force | Out-Null

# Step 4: Create temporary directory for deployment
Write-Host "Preparing deployment directory..." -ForegroundColor Green
$tempDir = "gh-pages-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Step 5: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Deploy with minimal index.html"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan