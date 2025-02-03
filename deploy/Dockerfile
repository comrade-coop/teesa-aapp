# syntax=docker.io/docker/dockerfile:1

FROM ubuntu:latest AS base


# Add build arguments
# `localhost`, `sepolia` or `base`
ARG NETWORK
# Private key of the wallet to use for the contract deployment
ARG WALLET_PRIVATE_KEY
# RPC URL of the network to use for the contract deployment
ARG RPC_URL
# API key of the blockchain scan service - Etherscan or Basescan to use for the contract deployment
# We automatically use the correct API key based on the network
ARG BLOCKCHAINSCAN_API_KEY
# Address of the team multi-sig wallet to use for the contract deployment
ARG TEAM_ADDRESS
# API key of the anthropic to use in the app
ARG ANTHROPIC_API_KEY
# The URL for the Eliza API
ARG ELIZA_API_URL
# The Eliza agent ID (can get it from HTTP GET: `${ELIZA_API_URL}/agents`)
ARG ELIZA_AGENT_ID
# App ID and app secret of the PrivyIO to use in the app
ARG PRIVYIO_APP_ID
ARG PRIVYIO_APP_SECRET
# Url for attestaion page provided by aapp-toolkit
ARG ATTESTATION_URL

# Set environment variables that will be available at runtime
ENV DOCKER_NETWORK=${NETWORK}
ENV DOCKER_WALLET_PRIVATE_KEY=${WALLET_PRIVATE_KEY}
ENV DOCKER_RPC_URL=${RPC_URL}
ENV DOCKER_BLOCKCHAINSCAN_API_KEY=${BLOCKCHAINSCAN_API_KEY}
ENV DOCKER_TEAM_ADDRESS=${TEAM_ADDRESS}
ENV DOCKER_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ENV DOCKER_ELIZA_API_URL=${ELIZA_API_URL}
ENV DOCKER_ELIZA_AGENT_ID=${ELIZA_AGENT_ID}
ENV DOCKER_PRIVYIO_APP_ID=${PRIVYIO_APP_ID}
ENV DOCKER_PRIVYIO_APP_SECRET=${PRIVYIO_APP_SECRET}
ENV DOCKER_ATTESTATION_URL=${ATTESTATION_URL}


# Update apt-get and install all the required packages
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get install -y build-essential python3 make g++ && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install NVM (Node Version Manager)
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Copy .nvmrc file
COPY .nvmrc /root/.nvmrc

# Install Node.js version specified in .nvmrc
RUN bash -c '. "/root/.nvm/nvm.sh" && nvm install $(cat /root/.nvmrc) && nvm use $(cat /root/.nvmrc)'

# Install Pnpm globally
RUN bash -c '. "/root/.nvm/nvm.sh" && npm install -g pnpm@9.15.2'


# Contracts dependencies stage
# Install dependencies only when needed
FROM base AS contracts-deps
WORKDIR /contracts

# Install dependencies based on the preferred package manager
COPY contracts/package.json contracts/yarn.lock* contracts/package-lock.json* contracts/pnpm-lock.yaml* contracts/.npmrc* ./
RUN bash -c '\
  . "/root/.nvm/nvm.sh" && \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi'


# Teesa dependencies stage
# Install dependencies only when needed
FROM base AS teesa-deps
WORKDIR /teesa

# Install dependencies based on the preferred package manager
COPY teesa/package.json teesa/yarn.lock* teesa/package-lock.json* teesa/pnpm-lock.yaml* teesa/.npmrc* ./
RUN bash -c '\
  . "/root/.nvm/nvm.sh" && \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi'


# Build stage
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy contracts and dependencies
COPY --from=contracts-deps /contracts/node_modules ./contracts/node_modules
COPY contracts/ ./contracts
COPY deploy/update-contracts-env.sh ./contracts/

# Copy teesa and dependencies
COPY --from=teesa-deps /teesa/node_modules ./teesa/node_modules
COPY teesa/ ./teesa
COPY deploy/update-teesa-env.sh ./teesa/

# Copy and update /contracts/.env file
RUN cd ./contracts && \
    cp .env.example .env && \
    chmod +x update-contracts-env.sh && \
    ./update-contracts-env.sh && \
    cd ..

# Copy and update /teesa/.env file
RUN cd ./teesa && \
    cp .env.example .env && \
    chmod +x update-teesa-env.sh && \
    ./update-teesa-env.sh && \
    cd ..

# Deploy the contract
RUN cd ./contracts && \
    bash -c '. "/root/.nvm/nvm.sh" && npx hardhat compile-contract' && \
    cd ..

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN cd ./teesa && \
    bash -c '\
    . "/root/.nvm/nvm.sh" && \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && corepack prepare pnpm@9.15.2 --activate && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi' && \
    cd ..


# Start stage
# Production image, copy all the files, deploy the contract and run next
FROM base AS runner
WORKDIR /app

# Download and install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the contracts files
COPY --from=builder /app/contracts ./contracts

# Copy the next.js build files
COPY --from=builder /app/teesa/public ./teesa/public
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/teesa/.next/standalone ./teesa 
COPY --from=builder /app/teesa/.next/static ./teesa/.next/static

# Copy and setup start script
COPY deploy/start.sh ./
RUN chmod +x start.sh

EXPOSE 3000

ENV PORT=3000

ENV HOSTNAME="0.0.0.0"
CMD ["./start.sh"]