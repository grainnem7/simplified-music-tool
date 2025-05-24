# Simplified deployment script

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Step 2: Create an index.html file that loads from the proper paths
$indexContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movement to Music AI</title>
  <base href="/simplified-music-tool/">
  <script>
    // This helps ensure assets load from the correct location
    window.publicPath = '/simplified-music-tool/';
  </script>
  <link rel="stylesheet" href="assets/index-39ede4c9.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="assets/index-e7585ebc.js"></script>
</body>
</html>
"@

Set-Content -Path "dist\index.html" -Value $indexContent

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

# Step 5: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Simple deployment"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan