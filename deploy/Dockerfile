# syntax=docker.io/docker/dockerfile:1


FROM ubuntu:latest AS base


# Add build arguments
# Path to the aapp-toolkit cloud volume
ARG CLOUD_VOLUME_PATH
#
# Agent build arguments
#
# The Ollama model to use
ARG OLLAMA_MODEL
# OpenRouter configuration
ARG OPENROUTER_API_KEY
ARG OPENROUTER_MODEL
#
# Web app build arguments
#
# App ID and app secret of the PrivyIO to use in the app
ARG PRIVYIO_APP_ID
ARG PRIVYIO_APP_SECRET
# Url for attestaion page provided by aapp-toolkit
ARG ATTESTATION_URL
#
# Twitter client build arguments
#
# Twitter credentials
ARG TWITTER_USERNAME
ARG TWITTER_PASSWORD
ARG TWITTER_EMAIL
ARG TWITTER_2FA_SECRET
# Intervals
ARG TWITTER_INTERACTION_MONITORING_INTERVAL_SECONDS
ARG TWITTER_POSTING_INTERVAL_MIN_MINUTES
ARG TWITTER_POSTING_INTERVAL_MAX_MINUTES
#
# NFT build arguments
#
# The private key of the wallet that we used to deploy the NFT contract
ARG INITIAL_WALLET_PRIVATE_KEY
# `mainnet`, `sepolia`, `base` or `baseSepolia`
ARG CONTRACT_NETWORK
# RPC URL of the network to use for the contract deployment
ARG RPC_URL
# API key of the blockchain scan service - Etherscan or Basescan to use for the contract deployment
# We automatically use the correct API key based on the network
ARG BLOCKCHAINSCAN_API_KEY
# Address of the team multi-sig wallet to use for the royalties
ARG TEAM_ADDRESS
# The API key and secret for the Pinata API
ARG PINATA_API_KEY
ARG PINATA_API_SECRET
# The API key for the Fal.AI API
ARG FALAI_API_KEY
# The address of the NFT contract
ARG NFT_CONTRACT_ADDRESS


# Set environment variables that will be available at runtime
ENV DOCKER_CLOUD_VOLUME_PATH=${CLOUD_VOLUME_PATH}
ENV DOCKER_OLLAMA_MODEL=${OLLAMA_MODEL}
ENV DOCKER_OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
ENV DOCKER_OPENROUTER_MODEL=${OPENROUTER_MODEL}
ENV DOCKER_PRIVYIO_APP_ID=${PRIVYIO_APP_ID}
ENV DOCKER_PRIVYIO_APP_SECRET=${PRIVYIO_APP_SECRET}
ENV DOCKER_ATTESTATION_URL=${ATTESTATION_URL}
ENV DOCKER_TWITTER_USERNAME=${TWITTER_USERNAME}
ENV DOCKER_TWITTER_PASSWORD=${TWITTER_PASSWORD}
ENV DOCKER_TWITTER_EMAIL=${TWITTER_EMAIL}
ENV DOCKER_TWITTER_2FA_SECRET=${TWITTER_2FA_SECRET}
ENV DOCKER_TWITTER_INTERACTION_MONITORING_INTERVAL_SECONDS=${TWITTER_INTERACTION_MONITORING_INTERVAL_SECONDS}
ENV DOCKER_TWITTER_POSTING_INTERVAL_MIN_MINUTES=${TWITTER_POSTING_INTERVAL_MIN_MINUTES}
ENV DOCKER_TWITTER_POSTING_INTERVAL_MAX_MINUTES=${TWITTER_POSTING_INTERVAL_MAX_MINUTES}
ENV DOCKER_INITIAL_WALLET_PRIVATE_KEY=${INITIAL_WALLET_PRIVATE_KEY}
ENV DOCKER_CONTRACT_NETWORK=${CONTRACT_NETWORK}
ENV DOCKER_RPC_URL=${RPC_URL}
ENV DOCKER_BLOCKCHAINSCAN_API_KEY=${BLOCKCHAINSCAN_API_KEY}
ENV DOCKER_TEAM_ADDRESS=${TEAM_ADDRESS}
ENV DOCKER_PINATA_API_KEY=${PINATA_API_KEY}
ENV DOCKER_PINATA_API_SECRET=${PINATA_API_SECRET}
ENV DOCKER_FALAI_API_KEY=${FALAI_API_KEY}
ENV DOCKER_NFT_CONTRACT_ADDRESS=${NFT_CONTRACT_ADDRESS}


# Update apt-get and install all the required packages
RUN apt-get update && \
  apt-get install -y curl && \
  apt-get install -y build-essential python3 make g++ && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Download and install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Install NVM (Node Version Manager)
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Copy .nvmrc file
COPY .nvmrc /root/.nvmrc

# Install Node.js version specified in .nvmrc
RUN bash -c '. "/root/.nvm/nvm.sh" && nvm install $(cat /root/.nvmrc) && nvm use $(cat /root/.nvmrc)'

# Install Pnpm globally
RUN bash -c '. "/root/.nvm/nvm.sh" && npm install -g pnpm@9.15.2'

# Set the working directory
WORKDIR /workspace


# Build the projects
WORKDIR teesa-aapp

# Copy the source code and the update-env.sh script
COPY packages/ ./packages/
COPY .env.example .
COPY .npmrc .
COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY deploy/update-env.sh .

# Copy and update the .env file
RUN cp .env.example .env && \
  chmod +x update-env.sh && \
  ./update-env.sh

# Install dependencies
RUN bash -c '\
  . "/root/.nvm/nvm.sh" && \
  corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm install'

# Compile the NFT contract to generate the ABI
RUN bash -c '\
  . "/root/.nvm/nvm.sh" && \
  corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm --filter @teesa-monorepo/nft compile-contracts'

# Set Node and Next.js environments
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build
RUN bash -c '\
  . "/root/.nvm/nvm.sh" && \
  corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm run build'

# Copy the Next.js public directory to the build directory
RUN cp -r packages/web-app/public packages/web-app/.next/standalone/packages/web-app/public
RUN cp -r packages/web-app/.next/static packages/web-app/.next/standalone/packages/web-app/.next/static

WORKDIR ..

# Copy the setup script, the start script and the dependecies files
COPY deploy/setup-wallet-and-nft-contract.js .
COPY deploy/start.sh .
RUN cp teesa-aapp/packages/nft/abi/teesa-nft.json .
RUN cp teesa-aapp/.env .

# Set the port
EXPOSE 3000
ENV PORT=3000

RUN chmod +x ./start.sh
ENV HOSTNAME="0.0.0.0"
CMD ["./start.sh"]