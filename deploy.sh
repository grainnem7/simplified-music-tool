#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Create .nojekyll file to disable Jekyll processing
touch dist/.nojekyll

# If using a custom domain, create CNAME file
# echo "yourdomain.com" > dist/CNAME

# Message for deployment
echo "Built files are now in the dist/ directory."
echo ""
echo "To deploy to GitHub Pages:"
echo "1. Create a new repository named 'movement-to-music-ai' if it doesn't exist yet"
echo "2. Run these commands to push to GitHub Pages:"
echo ""
echo "   cd dist"
echo "   git init"
echo "   git add ."
echo "   git commit -m \"Deploy to GitHub Pages\""
echo "   git branch -M gh-pages"
echo "   git remote add origin https://github.com/YOUR_USERNAME/movement-to-music-ai.git"
echo "   git push -f origin gh-pages"
echo ""
echo "3. Enable GitHub Pages in your repository settings to use the gh-pages branch"