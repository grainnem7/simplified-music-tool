# Final deployment script without GitHub corner

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Step 2: Create a deployment directory
Write-Host "Preparing deployment directory..." -ForegroundColor Green
$tempDir = "gh-pages-final"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Step 3: Copy dist contents to deployment directory
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Step 4: Create a simple index.html file
$finalHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movement to Music AI</title>
  <link rel="stylesheet" href="assets/index-39ede4c9.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" crossorigin src="assets/index-e7585ebc.js"></script>
</body>
</html>
"@

# Write the HTML file
Set-Content -Path "$tempDir\index.html" -Value $finalHtml

# Step 5: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force | Out-Null

# Step 6: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Final deployment without GitHub corner"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan