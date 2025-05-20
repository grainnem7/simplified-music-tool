# Deploy simple working version

# Stop on errors
$ErrorActionPreference = "Stop"

# Step 1: Build the project
Write-Host "Building project..." -ForegroundColor Green
npm run build

# Get the current asset filenames from the generated dist/index.html
Write-Host "Reading asset filenames..." -ForegroundColor Yellow
try {
    $distIndex = Get-Content -Path "dist\index.html" -Raw
    
    # Extract the JS filename using regex
    $jsMatch = [regex]::Match($distIndex, 'src="\/simplified-music-tool\/assets\/(index-[a-z0-9]+\.js)"')
    $jsFilename = if ($jsMatch.Success) { $jsMatch.Groups[1].Value } else { "index.js" }
    
    # Extract the CSS filename using regex
    $cssMatch = [regex]::Match($distIndex, 'href="\/simplified-music-tool\/assets\/(index-[a-z0-9]+\.css)"')
    $cssFilename = if ($cssMatch.Success) { $cssMatch.Groups[1].Value } else { "index.css" }
    
    Write-Host "Found JS file: $jsFilename" -ForegroundColor Green
    Write-Host "Found CSS file: $cssFilename" -ForegroundColor Green
} catch {
    Write-Host "Error reading dist/index.html. Using default filenames." -ForegroundColor Red
    $jsFilename = "index.js"
    $cssFilename = "index.css"
}

# Step 2: Create deployment directory
Write-Host "Preparing deployment directory..." -ForegroundColor Green
$tempDir = "gh-pages-working"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
New-Item -Path "$tempDir\assets" -ItemType Directory -Force | Out-Null

# Step 3: Copy asset files
Write-Host "Copying asset files..." -ForegroundColor Green
Copy-Item -Path "dist\assets\*" -Destination "$tempDir\assets" -Recurse

# Step 4: Create a working index.html file
$workingHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movement to Music AI</title>
  <link rel="stylesheet" href="assets/$cssFilename">
  <style>
    .github-corner { display: none !important; }
    body { margin: 0; overflow-x: hidden; }
    @media (max-width: 768px) {
      .webcam-container { max-width: 100%; }
      .performance-area { grid-template-columns: 1fr !important; padding: 1rem !important; }
      .controls { padding: 0.5rem !important; }
      .button { padding: 0.5rem 1rem !important; font-size: 0.9rem !important; }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" crossorigin src="assets/$jsFilename"></script>
</body>
</html>
"@

# Write the HTML file
Set-Content -Path "$tempDir\index.html" -Value $workingHtml

# Step 5: Create .nojekyll file
Write-Host "Creating .nojekyll file..." -ForegroundColor Green
New-Item -Path "$tempDir\.nojekyll" -ItemType File -Force | Out-Null

# Step 6: Initialize Git and deploy
Set-Location -Path $tempDir
git init
git checkout -b main
git add -A
git commit -m "Deploy simple working version"

Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory and clean up
Set-Location -Path ..
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be available at: https://grainnem7.github.io/simplified-music-tool/" -ForegroundColor Cyan
Write-Host "Note: It may take a few minutes for the changes to propagate." -ForegroundColor Cyan