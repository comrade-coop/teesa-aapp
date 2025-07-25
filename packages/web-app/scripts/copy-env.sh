#! /bin/bash

#
# Functions definitions
#

# Function to cleanup on script exit
cleanup() {
    rm -f .env
}

#
# Main script
#

# Check if we're in the project root directory
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Copy the .env file from the repository root to the current directory
cp ../../.env .

# Set trap to ensure cleanup runs on script exit
trap cleanup EXIT

# Run the specified command
eval "$*"