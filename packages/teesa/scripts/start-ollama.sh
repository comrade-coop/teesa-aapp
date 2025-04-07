#! /bin/bash

# Check if we're in the project root directory
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Function to cleanup on script exit
cleanup() {
    echo "Stopping $OLLAMA_MODEL model..."
    ollama stop $OLLAMA_MODEL
}

# Set trap to ensure cleanup runs on script exit
trap cleanup EXIT

check_model_running() {
    ollama ps | grep -q "$OLLAMA_MODEL"
}

# Check if model is running
if ! check_model_running; then
    echo "Starting $OLLAMA_MODEL model..."
    
    # Pull the model and show progress
    ollama pull $OLLAMA_MODEL
    
    # Start the model and wait for it to be ready
    ollama run $OLLAMA_MODEL > /dev/null 2>&1
    
    # Verify model is running
    if ! check_model_running; then
        echo "Error: Failed to start $OLLAMA_MODEL model"
        exit 1
    fi
else
    echo "$OLLAMA_MODEL model is already running"
fi

# Run the specified command
echo "Running: $*"
$*
