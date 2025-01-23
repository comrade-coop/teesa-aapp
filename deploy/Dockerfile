# syntax=docker.io/docker/dockerfile:1

FROM node:23.6.0-alpine AS base


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
# App ID and app secret of the PrivyIO to use in the app
ARG PRIVYIO_APP_ID
ARG PRIVYIO_APP_SECRET

# Set environment variables that will be available at runtime
ENV DOCKER_NETWORK=${NETWORK}
ENV DOCKER_WALLET_PRIVATE_KEY=${WALLET_PRIVATE_KEY}
ENV DOCKER_RPC_URL=${RPC_URL}
ENV DOCKER_BLOCKCHAINSCAN_API_KEY=${BLOCKCHAINSCAN_API_KEY}
ENV DOCKER_TEAM_ADDRESS=${TEAM_ADDRESS}
ENV DOCKER_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ENV DOCKER_PRIVYIO_APP_ID=${PRIVYIO_APP_ID}
ENV DOCKER_PRIVYIO_APP_SECRET=${PRIVYIO_APP_SECRET}


# Contracts dependencies stage
# Install dependencies only when needed
FROM base AS contracts-deps
WORKDIR /contracts

# Install dependencies based on the preferred package manager
COPY contracts/package.json contracts/yarn.lock* contracts/package-lock.json* contracts/pnpm-lock.yaml* contracts/.npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Teesa dependencies stage
# Install dependencies only when needed
FROM base AS teesa-deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /teesa

# Install dependencies based on the preferred package manager
COPY teesa/package.json teesa/yarn.lock* teesa/package-lock.json* teesa/pnpm-lock.yaml* teesa/.npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


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
    npx hardhat compile-contract && \
    cd ..

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN cd ./teesa && \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi && \
  cd ..


# Start stage
# Production image, copy all the files, deploy the contract and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the contracts files
COPY --from=builder --chown=nextjs:nodejs /app/contracts ./contracts

# Copy the next.js build files
COPY --from=builder /app/teesa/public ./teesa/public
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/teesa/.next/standalone ./teesa 
COPY --from=builder --chown=nextjs:nodejs /app/teesa/.next/static ./teesa/.next/static

# Copy and setup start script
COPY deploy/start.sh ./
RUN chmod +x start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000

ENV HOSTNAME="0.0.0.0"
CMD ["./start.sh"]