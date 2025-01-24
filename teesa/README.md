# Next.js Application

This project is the Next.js application for the Teesa game. We use `pnpm` for package management.

## Prerequisites

Ensure you have completed the following:
- **Setup your development environment** - Check the [README.md](../dev-setup/README.md) in the `../dev-setup` directory.
- **Deploy the contracts** - Check the [README.md](../contracts/README.md) in the `../contracts` directory.

## Installation

1. Set permissions for the scripts
   ```bash
   chmod +x teesa/scripts/start-dev-ollama.sh
   ```

2. Install the dependencies:
   ```bash
   pnpm install
   ```

3. Set up the environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with:
   - `NEXT_PUBLIC_ENV_MODE`: Set to either "dev" for development or "prod" for production (defaults to "prod")
   - `ANTHROPIC_API_KEY`: Your API key for accessing the Anthropic LLMs
   - Langsmith Configuration (**used only in development**) - you can get the values from the Langsmith dashboard (https://smith.langchain.com/):
     - `LANGCHAIN_TRACING_V2`
     - `LANGCHAIN_ENDPOINT`
     - `LANGCHAIN_API_KEY`
     - `LANGCHAIN_PROJECT`
   - PrivyIO Configuration - you can get the values from the PrivyIO dashboard (https://dashboard.privy.io/):
     - `NEXT_PUBLIC_PRIVYIO_APP_ID`: Your PrivyIO app ID
     - `PRIVYIO_APP_SECRET`: Your PrivyIO app secret
   - The following environment variables are automatically set by the contract deployment script. Refer to the [README.md](../contracts/README.md) in the `../contracts` directory directory for more details:
      - `RPC_URL` - RPC URL for the network
      - `WALLET_PRIVATE_KEY` - Private key for the wallet
      - `CHAIN_ID` - Chain ID for the network
      - `GAME_CONTRACT_ADDRESS` - Address of the game contract

## Start the Application

To start the ollama model and the development server, use the following command:
```bash
pnpm ollama
```
This will start the ollama model and the app locally, and you can access the app at http://localhost:3000.
