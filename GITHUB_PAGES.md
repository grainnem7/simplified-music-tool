# Deploying to GitHub Pages

Follow these simplified instructions to deploy your application to GitHub Pages.

## Windows / PowerShell Deployment

1. Open a PowerShell window
2. Navigate to your project directory:
   ```
   cd "C:\Users\Dell Precision\Repos\movement-to-music-ai"
   ```
3. Run the Windows deployment script:
   ```
   .\deploy-windows.ps1
   ```

## WSL / Linux Deployment

If using WSL or Linux, you'll need to modify the permissions first:

1. Navigate to your project directory
2. Build the project:
   ```
   npm run build
   ```
3. Create .nojekyll file:
   ```
   touch dist/.nojekyll
   ```
4. Deploy with gh-pages:
   ```
   npx gh-pages -d dist
   ```

## Troubleshooting Permission Issues

The WSL environment may have permission issues with files on Windows drives. If you encounter permission errors:

1. Run the deployment from native Windows PowerShell or Command Prompt
2. Alternatively, copy the project to a native Linux directory in WSL before deploying

## Checking Your Deployment

After deployment:

1. Your site will be available at: https://grainnem7.github.io/simplified-music-tool/
2. It might take 5-10 minutes for GitHub to build and publish your site
3. Check the Settings > Pages section in your GitHub repository to see the status