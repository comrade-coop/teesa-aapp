#!/bin/sh

# Update all RPC URLs regardless of network
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

# Update team address regardless of network
sed -i "s|TEAM_ADDRESS=.*|TEAM_ADDRESS=$DOCKER_TEAM_ADDRESS|g" .env 
