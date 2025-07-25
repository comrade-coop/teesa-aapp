#! /bin/bash

#
# Functions definitions
#

# Function to check if Ollama is installed
check_ollama_installed() {
  command -v ollama &> /dev/null
}

# Function to check if Ollama is started
check_ollama_started() {
  curl -s http://localhost:11434/api/version >/dev/null 2>&1
  return $?
}

# Function to check if the model is started
check_model_started() {
    ollama ps | grep -q "$OLLAMA_MODEL"
}

# Function to cleanup on script exit
cleanup() {
    echo "Stopping $OLLAMA_MODEL model..."
    ollama stop "$OLLAMA_MODEL"
}

#
# Main script
#

# Check if we're in the project root directory
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Source the .env file to get the OLLAMA_MODEL
source .env

# Check if OLLAMA_MODEL is set
if [ -z "$OLLAMA_MODEL" ]; then
    echo "Error: OLLAMA_MODEL is not set in .env file. Please set it before running this script."
    exit 1
fi

echo "Using Ollama model: $OLLAMA_MODEL"

if ! check_ollama_installed; then
  echo "Ollama is not installed. Please install Ollama before running this script."
  exit 1
fi

echo "Checking if Ollama service is started..."
if ! check_ollama_started; then
  echo "Starting Ollama service..."
  nohup ollama serve > /dev/null 2>&1 &
  disown

  # Wait for Ollama to start
  for i in {1..15}; do
    if check_ollama_started; then
      echo "Ollama service started successfully."
      break
    fi
    echo "Waiting for Ollama service to start... ($i/15)"
    sleep 2
  done

  if ! check_ollama_started; then
    echo "Failed to start Ollama service. Please check the logs."
    exit 1
  fi
else
  echo "Ollama service is already started."
fi

# Set trap to ensure cleanup runs on script exit
trap cleanup EXIT

# Check if model is running
if ! check_model_started; then
    echo "Starting $OLLAMA_MODEL model..."

    # Pull the model and show progress
    ollama pull "$OLLAMA_MODEL"

    # Start the model and wait for it to be ready
    ollama run "$OLLAMA_MODEL" > /dev/null 2>&1 &

    # Wait for the model to start
    sleep 3

    # Verify model is running
    if ! check_model_started; then
        echo "Error: Failed to start $OLLAMA_MODEL model"
        exit 1
    fi
else
    echo "$OLLAMA_MODEL model is already started"
fi

# Run the specified command
echo "Running: $*"
eval "$*"
