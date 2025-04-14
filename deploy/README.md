# Deployment

This section contains the instructions for deploying the Teesa aApp. We are using [Docker](https://www.docker.com) and the [aApp Toolkitt](https://github.com/comrade-coop/aapp-toolkit) to deploy the app in production.


## Prerequisites

- Ensure you have [Docker](https://www.docker.com) installed on your system.
- Ensure you have deployed the NFT contract - check the [README.md](../packages/nft/README.md) in the `packages/nft` directory.


## NFT contract

You need to have the NFT contract deployed in order to use the Teesa aApp. **As this contract is an NFT collection, we deploy it once and reuse between games.** To ensure the agent is fully autonomous, in production we make a new wallet and transfer the ownership of the NFT contract to that wallet. We are using the [aApp Toolkit Cloud volumes](https://github.com/comrade-coop/aapp-toolkit/blob/main/docs/APPMANIFEST.md) to securely store the new wallet's private key and ensure that there is access to it only from the Teesa aApp.

The process is the following (check `setup-wallet-and-nft-contract.js` for details):
- Check if there is a private key in the **aApp Toolkit Cloud Volume**:
  - If there is no private key, create a new wallet and store the private key in the **aApp Toolkit Cloud Volume**.
  - If there is a private key, use it as the wallet for the Teesa aApp.
- Check if there are funds in the wallet:
  - If there are no funds, transfer funds from the wallet that was used to deploy the contract (we pass the private key of that wallet to the Docker container).
  - If there are funds, do nothing.
- Check if the NFT contract is already transferred to the new wallet:
  - If the NFT contract is not transferred, transfer it to the new wallet.
  - If the NFT contract is transferred, do nothing.


## Deployment

1. Build the Docker image:
```bash
docker build \
   --build-arg CLOUD_VOLUME_PATH=<cloud-volume-path> \ # The path to the aApp Toolkit Cloud Volume (check the **NFT contract** section for more details)
   --build-arg ANTHROPIC_API_KEY=<anthropic-api-key> \ # API key for the Anthropic API
   --build-arg ELIZA_API_URL=<eliza-api-url> \ # The URL for the Eliza API
   --build-arg ELIZA_AGENT_ID=<eliza-agent-id> \ # The Eliza agent ID (can get it from HTTP GET: `${ELIZA_API_URL}/agents`)
   --build-arg PRIVYIO_APP_ID=<privyio-app-id> \ # App ID of the PrivyIO
   --build-arg PRIVYIO_APP_SECRET=<privyio-app-secret> \ # App secret of the PrivyIO
   --build-arg ATTESTATION_URL=<attestation-url> \ # Url for serving attestation verification by aApp Toolkit
   --build-arg LANGCHAIN_TRACING_V2=false \ # Stop the LangSmith logging
   --build-arg INITIAL_WALLET_PRIVATE_KEY=<initial-wallet-private-key> \ # Private key of the wallet that was used to deploy the NFT contract (check the **NFT contract** section for more details)
   --build-arg CONTRACT_NETWORK=<contract-network> \ # mainnet, sepolia, base or baseSepolia
   --build-arg RPC_URL=<rpc-url> \ # RPC URL for the network
   --build-arg BLOCKCHAINSCAN_API_KEY=<blockchainscan-api-key> \ # API key for the blockchain scanner (Etherscan or Basescan, depending on the network. We automatically use the correct API key based on the network.)
   --build-arg TEAM_ADDRESS=<team-address> \ # The address of the team multi-sig wallet
   --build-arg PINATA_API_KEY=<pinata-api-key> \ # API key for the Pinata API
   --build-arg PINATA_API_SECRET=<pinata-api-secret> \ # API secret for the Pinata API
   --build-arg FAL_API_KEY=<fal-api-key> \ # API key for the Fal.AI API
   --build-arg NFT_CONTRACT_ADDRESS=<nft-contract-address> \ # The address of the NFT contract
   --pull \
   --rm \
   -f "deploy/Dockerfile" \
   -t teesa-app-deploy:latest \
   .
```

2. Start the Docker container:
```bash
docker run \
   -p 3000:3000 \
   -v "$(pwd)/volumes/cloud-aapp-volume:/cloud-aapp-volume" \
   -v "$(pwd)/volumes/ollama:/root/.ollama" \ # Optional: If you want to persist the ollama models
   teesa-app-deploy:latest
```


## Accessing the Application

Once the container is started, you can access the application from your web browser at:

```
http://localhost:3000
```