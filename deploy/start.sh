#!/bin/sh

# Deploy contract
cd /app/contracts
echo "Deploying contract to $DOCKER_NETWORK network..."
npx hardhat deploy-contract $DOCKER_NETWORK

# Start the Next.js server
# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
cd /app/teesa
exec node server.js 