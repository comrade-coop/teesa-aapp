#!/bin/sh
# Update Anthropic API key
sed -i "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$DOCKER_ANTHROPIC_API_KEY|g" .env

# Update Privy.io configuration
sed -i "s|NEXT_PUBLIC_PRIVYIO_APP_ID=.*|NEXT_PUBLIC_PRIVYIO_APP_ID=$DOCKER_PRIVYIO_APP_ID|g" .env
sed -i "s|PRIVYIO_APP_SECRET=.*|PRIVYIO_APP_SECRET=$DOCKER_PRIVYIO_APP_SECRET|g" .env 