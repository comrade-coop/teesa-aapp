#!/bin/sh
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
sed -i "s|LANGCHAIN_TRACING_V2=.*|LANGCHAIN_TRACING_V2=$DOCKER_USE_LANGCHAIN_TRACING|g" .env