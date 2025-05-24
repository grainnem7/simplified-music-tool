# Debug deployment script that shows more details

# Stop on errors
$ErrorActionPreference = "Stop"

# Turn on verbose output
Set-PSDebug -Trace 1

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Step 2: Create empty deployment directory
Write-Host "Preparing deployment directory..." -ForegroundColor Green
$tempDir = "gh-pages-debug"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Step 3: Copy only the assets folder
Copy-Item -Path "dist\assets" -Destination "$tempDir\assets" -Recurse -Verbose

# Step 4: Create a simple index.html
$directHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movement to Music AI - Debug Version</title>
  <!-- Using relative paths -->
  <link rel="stylesheet" href="assets/index-39ede4c9.css">
</head>
<body>
  <h1>Debug Deployment</h1>
  <p>This is a debug version for GitHub Pages deployment.</p>
  <div id="root"></div>
  <script type="module" crossorigin src="assets/index-e7585ebc.js"></script>
</body>
</html>
"@

# Write the HTML file
Set-Content -Path "$tempDir\index.html" -Value $directHtml -Verbose

# Step 5: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force -Verbose | Out-Null

# Step 6: Initialize Git with verbose output
Set-Location -Path $tempDir
Write-Host "Initializing Git repository..." -ForegroundColor Green
git init
git config --local user.name "GitHub Actions"
git config --local user.email "actions@github.com"
git checkout -b main
git add -A

# Show what we're about to commit
Write-Host "Files to be committed:" -ForegroundColor Yellow
git status

git commit -m "Debug deployment with verbose output"

# Show more information about authentication
Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
Write-Host "Note: You will need to enter your GitHub credentials." -ForegroundColor Yellow
Write-Host "If you're using 2FA, you'll need to use a personal access token." -ForegroundColor Yellow

# Push with verbose output
git push -v -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory
Set-Location -Path ..

Write-Host "Deployment process completed." -ForegroundColor Green
Write-Host "Check the output above for any errors." -ForegroundColor Yellow
Write-Host "To verify your deployment, go to:" -ForegroundColor Cyan
Write-Host "https://github.com/grainnem7/simplified-music-tool/settings/pages" -ForegroundColor Cyan
Write-Host "and make sure it shows a recent deployment." -ForegroundColor Cyan