#!/bin/sh

#
# Update Teesa environment variables
#

# Update Anthropic API key
sed -i "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$DOCKER_ANTHROPIC_API_KEY|g" .env

# Update Eliza configuration
sed -i "s|ELIZA_API_URL=.*|ELIZA_API_URL=$DOCKER_ELIZA_API_URL|g" .env
sed -i "s|ELIZA_AGENT_ID=.*|ELIZA_AGENT_ID=$DOCKER_ELIZA_AGENT_ID|g" .env

# Update Privy.io configuration
sed -i "s|NEXT_PUBLIC_PRIVYIO_APP_ID=.*|NEXT_PUBLIC_PRIVYIO_APP_ID=$DOCKER_PRIVYIO_APP_ID|g" .env
sed -i "s|PRIVYIO_APP_SECRET=.*|PRIVYIO_APP_SECRET=$DOCKER_PRIVYIO_APP_SECRET|g" .env 

# Update aApp Toolkit configuration
sed -i "s|NEXT_PUBLIC_ATTESTATION_URL=.*|NEXT_PUBLIC_ATTESTATION_URL=$DOCKER_ATTESTATION_URL|g" .env

# Update LangSmith tracing
sed -i "s|LANGCHAIN_TRACING_V2=.*|LANGCHAIN_TRACING_V2=$DOCKER_LANGCHAIN_TRACING_V2|g" .env


#
# Update NFT contract environment variables
#

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
sed -i "s|FAL_API_KEY=.*|FAL_API_KEY=$DOCKER_FAL_API_KEY|g" .env

# Update NFT contract address
sed -i "s|NFT_CONTRACT_ADDRESS=.*|NFT_CONTRACT_ADDRESS=$DOCKER_NFT_CONTRACT_ADDRESS|g" .env
