#! /bin/bash

# Check if we're in the project root directory
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Copy the .env file from the repository root to the current directory
cp ../../.env .

# Source the .env file to get the OLLAMA_MODEL
source .env

# Function to check if Ollama is running
check_ollama_running() {
  curl -s http://localhost:11434/api/version >/dev/null 2>&1
  return $?
}

# Ensure Ollama is running
echo "Checking if Ollama service is running..."
if ! check_ollama_running; then
  echo "Starting Ollama service..."
  nohup ollama serve > /dev/null 2>&1 &
  disown

  # Wait for Ollama to start
  for i in {1..15}; do
    if check_ollama_running; then
      echo "Ollama service started successfully."
      break
    fi
    echo "Waiting for Ollama service to start... ($i/15)"
    sleep 2
  done

  if ! check_ollama_running; then
    echo "Failed to start Ollama service. Please check the logs."
    exit 1
  fi
else
  echo "Ollama service is already running."
fi

# Check if OLLAMA_MODEL is set
if [ -z "$OLLAMA_MODEL" ]; then
    echo "OLLAMA_MODEL is not set in .env file. Using llama3 as default."
    OLLAMA_MODEL="llama3"
fi

echo "Using Ollama model: $OLLAMA_MODEL"

# Function to cleanup on script exit
cleanup() {
    echo "Stopping $OLLAMA_MODEL model..."
    ollama stop "$OLLAMA_MODEL"

    # # Remove the .env file
    rm -f .env
}

# Set trap to ensure cleanup runs on script exit
trap cleanup EXIT

check_model_running() {
    ollama ps | grep -q "$OLLAMA_MODEL"
}

# Check if Ollama is installed and running
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed or not in PATH. Skipping Ollama setup."
else
    # Check if model is running
    if ! check_model_running; then
        echo "Starting $OLLAMA_MODEL model..."

        # Pull the model and show progress
        ollama pull "$OLLAMA_MODEL"

        # Start the model and wait for it to be ready
        ollama run "$OLLAMA_MODEL" > /dev/null 2>&1 &

        # Give it a moment to start
        sleep 3

        # Verify model is running
        if ! check_model_running; then
            echo "Error: Failed to start $OLLAMA_MODEL model"
            exit 1
        fi
    else
        echo "$OLLAMA_MODEL model is already running"
    fi
fi

# Run the specified command
echo "Running: $*"
$*
