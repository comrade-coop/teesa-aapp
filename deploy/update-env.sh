#!/bin/sh

#
# Update Agent environment variables
#

# Update Ollama model
sed -i "s|OLLAMA_MODEL=.*|OLLAMA_MODEL=$DOCKER_OLLAMA_MODEL|g" .env

# Update OpenRouter configuration
sed -i "s|OPENROUTER_API_KEY=.*|OPENROUTER_API_KEY=$DOCKER_OPENROUTER_API_KEY|g" .env
sed -i "s|OPENROUTER_MODEL=.*|OPENROUTER_MODEL=$DOCKER_OPENROUTER_MODEL|g" .env

#
# Update Web app environment variables
#

# Update Privy.io configuration
sed -i "s|NEXT_PUBLIC_PRIVYIO_APP_ID=.*|NEXT_PUBLIC_PRIVYIO_APP_ID=$DOCKER_PRIVYIO_APP_ID|g" .env
sed -i "s|PRIVYIO_APP_SECRET=.*|PRIVYIO_APP_SECRET=$DOCKER_PRIVYIO_APP_SECRET|g" .env

# Update aApp Toolkit configuration
sed -i "s|NEXT_PUBLIC_ATTESTATION_URL=.*|NEXT_PUBLIC_ATTESTATION_URL=$DOCKER_ATTESTATION_URL|g" .env

#
# Update Twitter client environment variables
#

# Update Twitter credentials
sed -i "s|TWITTER_USERNAME=.*|TWITTER_USERNAME=$DOCKER_TWITTER_USERNAME|g" .env
sed -i "s|TWITTER_PASSWORD=.*|TWITTER_PASSWORD=$DOCKER_TWITTER_PASSWORD|g" .env
sed -i "s|TWITTER_EMAIL=.*|TWITTER_EMAIL=$DOCKER_TWITTER_EMAIL|g" .env
sed -i "s|TWITTER_2FA_SECRET=.*|TWITTER_2FA_SECRET=$DOCKER_TWITTER_2FA_SECRET|g" .env

# Update Twitter intervals

sed -i "s|TWITTER_INTERACTION_MONITORING_INTERVAL_SECONDS=.*|TWITTER_INTERACTION_MONITORING_INTERVAL_SECONDS=$DOCKER_TWITTER_INTERACTION_MONITORING_INTERVAL_SECONDS|g" .env
sed -i "s|TWITTER_POSTING_INTERVAL_MIN_MINUTES=.*|TWITTER_POSTING_INTERVAL_MIN_MINUTES=$DOCKER_TWITTER_POSTING_INTERVAL_MIN_MINUTES|g" .env
sed -i "s|TWITTER_POSTING_INTERVAL_MAX_MINUTES=.*|TWITTER_POSTING_INTERVAL_MAX_MINUTES=$DOCKER_TWITTER_POSTING_INTERVAL_MAX_MINUTES|g" .env

#
# Update NFT contract environment variables
#

# Set the wallet private key to the initial wallet private key so we can compile the contracts
# Later we will set the environment variable to the Teesa's wallet private key in the container process
sed -i "s|WALLET_PRIVATE_KEY=.*|WALLET_PRIVATE_KEY=$DOCKER_INITIAL_WALLET_PRIVATE_KEY|g" .env

# Update contract network
sed -i "s|CONTRACT_NETWORK=.*|CONTRACT_NETWORK=$DOCKER_CONTRACT_NETWORK|g" .env

# Update all RPC URLs regardless of network
sed -i "s|RPC_URL_MAINNET=.*|RPC_URL_MAINNET=$DOCKER_RPC_URL|g" .env
sed -i "s|RPC_URL_SEPOLIA=.*|RPC_URL_SEPOLIA=$DOCKER_RPC_URL|g" .env
sed -i "s|RPC_URL_BASE=.*|RPC_URL_BASE=$DOCKER_RPC_URL|g" .env
sed -i "s|RPC_URL_BASE_SEPOLIA=.*|RPC_URL_BASE_SEPOLIA=$DOCKER_RPC_URL|g" .env

# Update network-specific scan API keys based on network
case "$DOCKER_CONTRACT_NETWORK" in
  "mainnet")
    sed -i "s|ETHERSCAN_API_KEY=.*|ETHERSCAN_API_KEY=$DOCKER_BLOCKCHAINSCAN_API_KEY|g" .env
    ;;
  "sepolia")
    sed -i "s|ETHERSCAN_API_KEY=.*|ETHERSCAN_API_KEY=$DOCKER_BLOCKCHAINSCAN_API_KEY|g" .env
    ;;
  "base")
    sed -i "s|BASESCAN_API_KEY=.*|BASESCAN_API_KEY=$DOCKER_BLOCKCHAINSCAN_API_KEY|g" .env
    ;;
  "baseSepolia")
    sed -i "s|BASESCAN_API_KEY=.*|BASESCAN_API_KEY=$DOCKER_BLOCKCHAINSCAN_API_KEY|g" .env
    ;;
  *)
    echo "Invalid network: $DOCKER_CONTRACT_NETWORK"
    exit 1
    ;;
esac

# Update team address
sed -i "s|TEAM_ADDRESS=.*|TEAM_ADDRESS=$DOCKER_TEAM_ADDRESS|g" .env

# Update Pinata configuration
sed -i "s|PINATA_API_KEY=.*|PINATA_API_KEY=$DOCKER_PINATA_API_KEY|g" .env
sed -i "s|PINATA_API_SECRET=.*|PINATA_API_SECRET=$DOCKER_PINATA_API_SECRET|g" .env

# Update Fal.AI configuration
sed -i "s|FALAI_API_KEY=.*|FALAI_API_KEY=$DOCKER_FALAI_API_KEY|g" .env

# Update NFT contract address
sed -i "s|NFT_CONTRACT_ADDRESS=.*|NFT_CONTRACT_ADDRESS=$DOCKER_NFT_CONTRACT_ADDRESS|g" .env
