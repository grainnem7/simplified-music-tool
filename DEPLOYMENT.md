# Deploying to GitHub Pages

This guide provides step-by-step instructions for deploying this application to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your computer
- Node.js and npm installed

## Option 1: Using the PowerShell Script (Recommended for Windows)

1. Open PowerShell as Administrator
2. Navigate to the project directory:
   ```
   cd "C:\Users\Dell Precision\Repos\movement-to-music-ai"
   ```
3. Run the deployment script:
   ```
   .\deploy-gh-pages.ps1
   ```
4. When prompted, enter your GitHub credentials

## Option 2: Manual Deployment

### First-time setup:

1. Ensure you have access to the repository `simplified-music-tool`
2. Make sure the repository URL is configured correctly:
   ```
   git remote set-url origin https://github.com/grainnem7/simplified-music-tool.git
   ```

### Deployment steps:

1. Build the application:
   ```
   npm run build
   ```

2. Make sure GitHub doesn't process the site with Jekyll:
   ```
   touch dist/.nojekyll
   ```

3. Deploy to GitHub Pages branch:
   ```
   npx gh-pages -d dist
   ```

4. Go to your GitHub repository's Settings > Pages to ensure:
   - Source is set to "Deploy from a branch"
   - Branch is set to "gh-pages" with folder set to "/ (root)"

## Troubleshooting

If you encounter any issues:

1. **Permission errors in WSL**: Try running the commands in PowerShell or Command Prompt instead.

2. **404 errors after deployment**: 
   - Make sure the repository is public
   - Verify that GitHub Pages is enabled in the repository settings
   - Check that the "base" path in vite.config.ts matches your repository name

3. **Blank page with no errors**:
   - Open browser DevTools and check the console for path-related errors
   - Make sure all assets are loading correctly with the proper base path

4. **Cannot find module errors**:
   - Run `npm install` to make sure all dependencies are installed
   - Try clearing npm cache with `npm cache clean --force`

Your deployed site should be available at: `https://grainnem7.github.io/simplified-music-tool/`