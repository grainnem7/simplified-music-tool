# Deploy at root level script
# This places all files at the root of gh-pages branch

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Find asset files
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

# Step 2: Create a modified index.html file with relative paths
Write-Host "Creating index.html with relative paths..." -ForegroundColor Yellow
$newIndexContent = @"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Movement to Music AI</title>
    <link rel="stylesheet" href="$cssFileName">
    <script type="module" crossorigin src="$jsFileName"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"@

# Create temp directory for deployment
$tempDir = "gh-pages-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Step 3: Copy assets DIRECTLY to the root level
Write-Host "Copying asset files to root level..." -ForegroundColor Green
Copy-Item -Path "dist\assets\$cssFileName" -Destination "$tempDir\$cssFileName"
Copy-Item -Path "dist\assets\$jsFileName" -Destination "$tempDir\$jsFileName"
if (Test-Path "dist\assets\vite-*.svg") {
    $svgFile = Get-ChildItem -Path "dist\assets" -Filter "vite-*.svg" | Select-Object -First 1
    Copy-Item -Path "dist\assets\$($svgFile.Name)" -Destination "$tempDir\$($svgFile.Name)"
}

# Write the new index.html to deployment directory
Set-Content -Path "$tempDir\index.html" -Value $newIndexContent

# Step 4: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force | Out-Null

# Step 5: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Deploy with all files at root level"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan