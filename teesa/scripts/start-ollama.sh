#! /bin/bash

# Check if we're in the project root directory
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Function to cleanup on script exit
cleanup() {
    echo "Stopping $MODEL_NAME model..."
    ollama stop $MODEL_NAME
}

# Set trap to ensure cleanup runs on script exit
trap cleanup EXIT

# Load OLLAMA_MODEL from .env file
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in project root"
    exit 1
fi

# Get OLLAMA_MODEL from .env
OLLAMA_MODEL=$(grep '^OLLAMA_MODEL=' .env | cut -d '=' -f2)

if [ -z "$OLLAMA_MODEL" ]; then
    echo "Error: OLLAMA_MODEL not found in .env file"
    exit 1
fi

MODEL_NAME=$OLLAMA_MODEL

check_model_running() {
    ! ollama ps | grep -q "$MODEL_NAME"
}

# Check if model is running
if check_model_running; then
    echo "Starting $MODEL_NAME model..."
    
    # Pull the model and show progress
    ollama pull $MODEL_NAME
    
    # Start the model and wait for it to be ready
    ollama run $MODEL_NAME > /dev/null 2>&1
    
    # Verify model is running
    if check_model_running; then
        echo "Error: Failed to start $MODEL_NAME model"
        exit 1
    fi
else
    echo "$MODEL_NAME model is already running"
fi

# Run the specified command
echo "Running: $*"
$*
