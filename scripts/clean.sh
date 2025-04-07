#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"/..

echo "Cleanup started."

# Find and remove node_modules and build artifacts
find . -type d -name "node_modules" -exec rm -rf {} + \
    -o -type d -name "dist" -exec rm -rf {} + \
    -o -type d -name ".next" -exec rm -rf {} + \
    -o -type d -name "artifacts" -exec rm -rf {} + \
    -o -type d -name "cache" -exec rm -rf {} +

# Remove pnpm lockfile
# rm ./pnpm-lock.yaml

# Remove .pnpm-store
rm -rf ./.pnpm-store

echo "Cleanup completed."
exit 0
