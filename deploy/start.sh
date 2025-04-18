#!/bin/bash
set -e

# In the Docker container we copy this file to root directory and set is as CMD

# Start Ollama
ollama serve > /dev/null 2>&1 &
sleep 5

# Load OLLAMA_MODEL from .env file
if [ ! -f "./.env" ]; then
    echo "Error: .env file not found in the root directory"
    exit 1
fi

# Get OLLAMA_MODEL from .env
OLLAMA_MODEL=$(grep '^OLLAMA_MODEL=' ./.env | cut -d '=' -f2)

if [ -z "$OLLAMA_MODEL" ]; then
    echo "Error: OLLAMA_MODEL not found in .env file"
    exit 1
fi

MODEL_NAME=$OLLAMA_MODEL

# Pull and start the Ollama model
ollama pull $MODEL_NAME
ollama run $MODEL_NAME > /dev/null 2>&1

# Add NVM configuration to shell profile for persistence
echo 'export NVM_DIR="/root/.nvm"' >> /root/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /root/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> /root/.bashrc

# Load NVM directly for current session
export NVM_DIR="/root/.nvm"
. "/root/.nvm/nvm.sh"

# Setup the wallet and the NFT contract
npm install ethers dotenv
node setup-wallet-and-nft-contract.js

# Get the wallet private key from the wallet.key file
WALLET_PRIVATE_KEY_FILE_PATH="$DOCKER_CLOUD_VOLUME_PATH/wallet.key"
if [ ! -f "$WALLET_PRIVATE_KEY_FILE_PATH" ]; then
    echo "Error: Wallet private key file not found at $WALLET_PRIVATE_KEY_FILE_PATH"
    exit 1
fi

WALLET_PRIVATE_KEY=$(cat "$WALLET_PRIVATE_KEY_FILE_PATH")

# Start the Next.js server
# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
cd /app-start/app/packages/teesa
WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY DOCKER_CLOUD_VOLUME_PATH=$DOCKER_CLOUD_VOLUME_PATH exec node server.js 