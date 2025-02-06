#!/bin/bash

# Start Ollama
ollama serve > /dev/null 2>&1 &
sleep 5

# Load OLLAMA_MODEL from .env file
if [ ! -f "teesa/.env" ]; then
    echo "Error: .env file not found in the /teesa directory"
    exit 1
fi

# Get OLLAMA_MODEL from .env
OLLAMA_MODEL=$(grep '^OLLAMA_MODEL=' teesa/.env | cut -d '=' -f2)

if [ -z "$OLLAMA_MODEL" ]; then
    echo "Error: OLLAMA_MODEL not found in .env file"
    exit 1
fi

MODEL_NAME=$OLLAMA_MODEL

# Pull and start the Ollama model
ollama pull $MODEL_NAME
ollama run $MODEL_NAME > /dev/null 2>&1

# Generate new wallet - install ethers first
bash -c '. "/root/.nvm/nvm.sh" && npm install ethers && node generate-wallet.js'

# Keep container running
tail -f /dev/null