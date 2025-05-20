# Automatic Deployment Setup

This project is configured with GitHub Actions to automatically deploy to GitHub Pages every time you push to the default branch.

## How It Works

1. When you push changes to the `master` branch, the GitHub Actions workflow in `.github/workflows/deploy.yml` will run automatically.

2. The workflow:
   - Checks out your code
   - Sets up Node.js
   - Installs dependencies
   - Builds your project
   - Creates a `.nojekyll` file to prevent Jekyll processing
   - Adds a CSS rule to hide the GitHub corner
   - Deploys the `dist` folder to the `gh-pages` branch

3. GitHub Pages serves your site from the `gh-pages` branch

## Deployment Workflow

The main deployment workflow (`deploy.yml`) runs on every push to the `master` branch. It includes:

1. Mobile-friendly CSS fixes for better display on phones and tablets
2. A fix to hide any GitHub corner elements
3. Proper viewport settings for mobile devices

All these improvements are applied automatically every time you push changes to your repository.

## Manual Deployment

You can also manually trigger a deployment from the GitHub Actions tab in your repository:

1. Go to your repository on GitHub
2. Click on the "Actions" tab
3. Select the workflow you want to run
4. Click "Run workflow" and select the branch

## Workflow File

- `.github/workflows/deploy.yml`: Main deployment workflow with mobile enhancements

## Troubleshooting

If your automatic deployment isn't working:

1. Check the "Actions" tab in your repository to see if there are any workflow errors
2. Make sure you have enabled GitHub Pages in your repository settings
3. Verify that you're pushing to the correct branch (`master` or `mobile-improvements`)
4. Check if you have any GitHub Actions minutes left in your free account

## GitHub Free Tier Limits

GitHub's free tier includes:
- 2,000 minutes of GitHub Actions per month for private repositories
- Unlimited minutes for public repositories
- 500MB of GitHub Pages storage