#!/bin/sh

# Update all private keys and RPC URLs regardless of network
sed -i "s|WALLET_PRIVATE_KEY_LOCALHOST=.*|WALLET_PRIVATE_KEY_LOCALHOST=$DOCKER_WALLET_PRIVATE_KEY|g" .env
sed -i "s|WALLET_PRIVATE_KEY_SEPOLIA=.*|WALLET_PRIVATE_KEY_SEPOLIA=$DOCKER_WALLET_PRIVATE_KEY|g" .env
sed -i "s|WALLET_PRIVATE_KEY_BASE=.*|WALLET_PRIVATE_KEY_BASE=$DOCKER_WALLET_PRIVATE_KEY|g" .env

sed -i "s|RPC_URL_LOCALHOST=.*|RPC_URL_LOCALHOST=$DOCKER_RPC_URL|g" .env
sed -i "s|RPC_URL_SEPOLIA=.*|RPC_URL_SEPOLIA=$DOCKER_RPC_URL|g" .env
sed -i "s|RPC_URL_BASE=.*|RPC_URL_BASE=$DOCKER_RPC_URL|g" .env

# Update network-specific scan API keys based on network
case "$DOCKER_NETWORK" in
  "sepolia")
    sed -i "s|ETHERSCAN_API_KEY=.*|ETHERSCAN_API_KEY=$DOCKER_BLOCKCHAINSCAN_API_KEY|g" .env
    ;;
  "base")
    sed -i "s|BASESCAN_API_KEY=.*|BASESCAN_API_KEY=$DOCKER_BLOCKCHAINSCAN_API_KEY|g" .env
    ;;
  "localhost")
    ;;
  *)
    echo "Invalid network: $DOCKER_NETWORK"
    exit 1
    ;;
esac

# Update team addresses regardless of network
sed -i "s|TEAM_ADDRESSES=.*|TEAM_ADDRESSES=$DOCKER_TEAM_ADDRESSES|g" .env 