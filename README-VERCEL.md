# Vercel Deployment Instructions

This project was originally structured with a nested directory (`hubv1/hubv1/`). For proper Vercel deployment, we need to flatten the structure so that the Next.js project is at the root level.

## Fixing the Directory Structure

I've provided a script that will help move all the files from the nested directory to the root directory.

### Steps to Fix the Structure:

1. Make sure you're in the root directory (`/Users/shansrikanthan/Documents/GitHub/hubv1/`)

2. Run the provided script:
   ```
   ./move-to-root.sh
   ```

3. The script will:
   - Check for conflicts (files that exist in both directories)
   - Move all subdirectories from the nested directory to the root
   - Move all files from the nested directory to the root
   - Create backups of any important files that might be overwritten

4. After running the script, verify that all files have been moved correctly.

5. Commit the changes to git:
   ```
   git add .
   git commit -m "Fix directory structure for Vercel deployment"
   ```

## Alternative Manual Solution

If you prefer to do this manually:

1. Move all files and directories from `hubv1/hubv1/` to `hubv1/` (except node_modules)
2. Resolve any conflicts by comparing and merging files
3. Ensure package.json and next.config.mjs are in the root directory
4. Commit the changes

## Deploying to Vercel

Once your directory structure is fixed:

1. Push your changes to GitHub
2. Go to [Vercel](https://vercel.com) and create a new project
3. Import your repository
4. Vercel should automatically detect the Next.js project
5. Deploy!

## What's in This Project

- `move-to-root.sh` - Script to fix directory structure
- `vercel.json` - Configuration file for Vercel (usually not needed for Next.js, but added for safety)
- `.gitignore` - Standard Next.js gitignore file

If you encounter any issues during deployment, check the Vercel logs for detailed error messages.