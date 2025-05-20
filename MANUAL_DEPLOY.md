# Manual GitHub Pages Deployment

If the automated scripts aren't working, follow these manual steps:

## 1. Build Your Project

```bash
npm run build
```

## 2. Create a Clean Deployment Directory

```bash
# Create a new directory for deployment
mkdir -p gh-pages-manual

# Copy the assets folder
cp -r dist/assets gh-pages-manual/

# Create a minimal index.html file
cat > gh-pages-manual/index.html << 'EOF'
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
EOF

# Create .nojekyll file
touch gh-pages-manual/.nojekyll
```

## 3. Initialize Git and Push

```bash
# Navigate to the deployment directory
cd gh-pages-manual

# Initialize Git
git init
git checkout -b main

# Add all files
git add .

# Commit
git commit -m "Manual deployment"

# Push to GitHub Pages
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory
cd ..
```

## 4. If You're Using Windows/PowerShell

```powershell
# Create a new directory for deployment
New-Item -Path "gh-pages-manual" -ItemType Directory -Force

# Copy the assets folder
Copy-Item -Path "dist\assets" -Destination "gh-pages-manual\assets" -Recurse 

# Create a minimal index.html file
@"
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
"@ | Set-Content -Path "gh-pages-manual\index.html"

# Create .nojekyll file
New-Item -Path "gh-pages-manual\.nojekyll" -ItemType File -Force

# Navigate to the deployment directory
Set-Location -Path "gh-pages-manual"

# Initialize Git
git init
git checkout -b main

# Add all files
git add -A

# Commit
git commit -m "Manual deployment"

# Push to GitHub Pages
git push -f https://github.com/grainnem7/simplified-music-tool.git main:gh-pages

# Return to original directory
Set-Location -Path ".."
```

## 5. Alternative: Use `gh-pages` Package Directly

```bash
# Install gh-pages if not already installed
npm install gh-pages --save-dev

# Create a minimal index.html in the dist directory
cat > dist/index.html << 'EOF'
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
EOF

# Create .nojekyll file
touch dist/.nojekyll

# Deploy using gh-pages
npx gh-pages -d dist
```

## 6. Check Deployment Status

After pushing, check if your deployment was successful by:

1. Visiting your GitHub repository at: 
   https://github.com/grainnem7/simplified-music-tool

2. Go to "Settings" > "Pages" to check deployment status

3. Your site should be available at:
   https://grainnem7.github.io/simplified-music-tool/

Note: It may take a few minutes for changes to propagate.