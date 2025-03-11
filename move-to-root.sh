#!/bin/bash

# Script to move all files from nested hubv1 directory to the root directory
# This script preserves your git history and makes it ready for Vercel deployment

# Check if the nested directory exists
if [ ! -d "hubv1" ]; then
  echo "Error: The nested 'hubv1' directory doesn't exist in the current directory"
  exit 1
fi

# Get list of files in the nested directory (excluding node_modules and .git)
echo "Preparing to move files from nested hubv1 directory to root..."
find hubv1 -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | sort

# Check for file conflicts (files that exist in both directories)
CONFLICTS=()
for file in $(find hubv1 -type f -not -path "*/node_modules/*" -not -path "*/.git/*"); do
  # Get the relative path for checking conflicts
  rel_path=${file#hubv1/}
  if [ -f "$rel_path" ] && [ "$rel_path" != "move-to-root.sh" ]; then
    CONFLICTS+=("$rel_path")
  fi
done

# If conflicts exist, report them
if [ ${#CONFLICTS[@]} -gt 0 ]; then
  echo "Warning: The following files exist in both the root and nested directory:"
  for conflict in "${CONFLICTS[@]}"; do
    echo "  - $conflict"
  done
  echo "Please handle these conflicts manually to avoid data loss."
  echo "You can:"
  echo "  1. Backup the root files"
  echo "  2. Compare and merge the files"
  echo "  3. Run this script again"
  exit 1
fi

# Create a backup of root package.json if it exists
if [ -f "package.json" ]; then
  cp package.json package.json.backup
  echo "Created backup of root package.json as package.json.backup"
fi

# Move all directories except node_modules
echo "Moving directories..."
for dir in hubv1/*/; do
  dir_name=$(basename "$dir")
  if [ "$dir_name" != "node_modules" ] && [ "$dir_name" != ".git" ]; then
    # Only copy if directory doesn't exist at destination
    if [ ! -d "$dir_name" ]; then
      echo "Moving directory: $dir_name"
      cp -r "$dir" ./
    else
      echo "Directory already exists in root: $dir_name, skipping..."
    fi
  fi
done

# Move all files in the root of hubv1
echo "Moving files..."
for file in hubv1/*; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    if [ ! -f "$filename" ] || [ "$filename" == "package.json" ]; then
      echo "Moving file: $filename"
      cp "$file" ./
    else
      echo "File already exists in root: $filename, skipping..."
    fi
  fi
done

echo "Done! Files have been moved from the nested directory to root."
echo "To complete the process:"
echo "1. Review the moved files to ensure everything is correct"
echo "2. Update your .gitignore if needed"
echo "3. Commit the changes to Git"
echo ""
echo "Your project is now ready for Vercel deployment!"