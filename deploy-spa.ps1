# Deploy script for Single Page App on GitHub Pages
# This script creates a special setup for SPAs on GitHub Pages

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Create temp directory for deployment
$tempDir = "gh-pages-temp"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Step 2: Copy all files from dist to temp directory
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse

# Step 3: Create a special 404.html file that redirects to index.html
$redirect404Content = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // Single Page Apps for GitHub Pages
    // MIT License
    // https://github.com/rafgraph/spa-github-pages
    (function(l) {
      if (l.search[1] === '/' ) {
        var decoded = l.search.slice(1).split('&').map(function(s) { 
          return s.replace(/~and~/g, '&')
        }).join('?');
        window.history.replaceState(null, null,
            l.pathname.slice(0, -1) + decoded + l.hash
        );
      }
    }(window.location))
    
    // Redirect to the index.html
    window.location.href = '/simplified-music-tool/';
  </script>
</head>
<body>
  <h1>Redirecting...</h1>
  <p>If you are not redirected automatically, click <a href="/simplified-music-tool/">here</a>.</p>
</body>
</html>
"@

Set-Content -Path "$tempDir\404.html" -Value $redirect404Content

# Step 4: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force | Out-Null

# Step 5: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Deploy with SPA redirect setup"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan