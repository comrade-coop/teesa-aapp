# Teesa aApp

This is the monorepo for the Teesa aApp - autonomous agent built with the [aApp Toolkitt](https://github.com/comrade-coop/aapp-toolkit).


## 📦 Project Structure

The project is organized into two packages:

- `packages/teesa` - The main package for the Teesa app. Contains a NextJS app
- `packages/teesa-nft` - The package for the Teesa NFT. Contains the NFT contract and methods for interacting with it.


## 🛠️ Development Setup

To start the app in development mode follow these steps.

### Prerequisites

Follow the instructions in the [Development Environment Setup](./dev-setup/README.md) guide to setup your development environment.

### Environment Variables

The `.env` file is used to configure the environment variables for the project. We have separated the file into two parts - one for each of the two packages:

```bash
cp .env.example .env
```

#### Teesa environment variables

- `ENV_MODE`- set to either `dev` for development or `prod` for production (defaults to `prod`)
- `OLLAMA_MODEL` - the Ollama model to use (defaults to "llama3.2")
- `ANTHROPIC_API_KEY` - your API key for accessing the Anthropic LLMs
- Eliza Configuration:
  - `ELIZA_API_URL`: The URL for the Eliza API
  - `ELIZA_AGENT_ID`: The Eliza agent ID (can get it from HTTP GET: `${ELIZA_API_URL}/agents`)
- PrivyIO Configuration - you can get the values from the PrivyIO dashboard (https://dashboard.privy.io/):
  - `NEXT_PUBLIC_PRIVYIO_APP_ID`: Your PrivyIO app ID
  - `PRIVYIO_APP_SECRET`: Your PrivyIO app secret
- `NEXT_PUBLIC_ATTESTATION_URL` - URL for serving attestation verification by aApp Toolkit
- Langsmith Configuration (**used only in development**) - you can get the values from the Langsmith dashboard (https://smith.langchain.com/):
  - `LANGCHAIN_TRACING_V2` - defaults to `false`
  - `LANGCHAIN_ENDPOINT`
  - `LANGCHAIN_API_KEY`
  - `LANGCHAIN_PROJECT`

#### NFT environment variables

- `WALLET_PRIVATE_KEY` - the private key of the wallet you will use to deploy the NFT contract
- `CONTRACT_NETWORK` -  the blockchain network for the contract - `mainnet`, `sepolia`, `base` or `baseSepolia`
- RPC URLs for the networks:
  - `RPC_URL_MAINNET` - RPC URL for Ethereum Mainnet (we are using Alchemy, but you can use any other RPC provider)
  - `RPC_URL_SEPOLIA` - RPC URL for Ethereum Sepolia (we are using Alchemy, but you can use any other RPC provider)
  - `RPC_URL_BASE` - RPC URL for Base (we are using Alchemy, but you can use any other RPC provider)
  - `RPC_URL_BASE_SEPOLIA` - RPC URL for Base Sepolia (we are using Alchemy, but you can use any other RPC provider)
- Etherscan and Basescan API keys:
  - `ETHERSCAN_API_KEY` - Etherscan API key
  - `BASESCAN_API_KEY` - Basescan API key
- `TEAM_ADDRESS` - the address of the team wallet. We set it as the receiver for the NFT royalties.
- Pinata Configuration - you can get the values from the Pinata dashboard (http://pinata.cloud):
  - `PINATA_API_KEY` - your API key for accessing the Pinata API
  - `PINATA_API_SECRET` - your API secret for accessing the Pinata API
- `NFT_CONTRACT_ADDRESS` - the address of the NFT contract. **We set it automatically when deploying the contract**

### Install dependencies and build the project

1. Install dependencies
   ```bash
   pnpm install
   ```

2. Build the project
   ```bash
   pnpm build
   ```

### NFT contract

To use the app you need to deploy the NFT contract. Refer to the [NFT README](./packages/nft/README.md) for more details.

### Teesa app

Refer to the [Teesa README](./packages/teesa/README.md) for details on how to start the app.


## 🚀 Production Setup

To deploy the app to production follow the steps described in the [Deployment README](./deploy/README.md).


## 📜 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute this project as per the license terms.
