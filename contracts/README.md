# Contracts

This project includes the contract and associated tools for deploying and testing. Each game instance has its own contract, and we are leveraging **Hardhat** for development, testing, and deployment.

## Project Structure

- **contracts:** Contract files are located in the `/contracts` directory
- **tests:** Test cases for the contracts are in the `/tests` directory
- **tasks:** Deployment tasks are in the `/tasks` directory
- **hardhat.config.ts:** Deployment configurations are available for the following networks:
  - Hardhat Localhost Network
  - Sepolia
  - Base Ethereum Mainnet


## Prerequisites

Ensure you have completed the following:
- **Setup your development environment** - Check the [README.md](../dev-setup/README.md) in the `../dev-setup` directory.

## Dependencies

1. Install Hardhat and project dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

2. Update the `.env` file with:
   - Private keys for the wallets:
      - `WALLET_PRIVATE_KEY_LOCALHOST`: Private key for deploying to Hardhat localhost network
      - `WALLET_PRIVATE_KEY_SEPOLIA`: Private key for deploying to Sepolia testnet
      - `WALLET_PRIVATE_KEY_BASE`: Private key for deploying to Base mainnet
   - RPC URLs for the networks:
      - `RPC_URL_LOCALHOST`: RPC URL for Hardhat localhost network
      - `RPC_URL_SEPOLIA`: RPC URL for Sepolia testnet (we are using Alchemy, but you can use any other RPC provider)
      - `RPC_URL_BASE`: RPC URL for Base mainnet (we are using Alchemy, but you can use any other RPC provider)
   - Etherscan and Basescan API keys:
      - `ETHERSCAN_API_KEY`: Etherscan API key
      - `BASESCAN_API_KEY`: Basescan API key
   - `TEAM_ADDRESS`: The address of the team multi-sig wallet

## Deployment

Run the deployment script:
```bash
npx hardhat compile-and-deploy-contract <network>
```
Replace `<network>` with desired target (`localhost`, `sepolia`, `base`)

### Localhost deployment

Start the Hardhat localhost node:
```bash
npx hardhat node
```

Deploy the contract:
```bash
npx hardhat compile-and-deploy-contract localhost
```

### Deployment Steps

The deployment script will:
1. Compile the contract
2. Test the contract
3. Deploy the contract
4. Verify the contract on Etherscan and Basescan
5. Update the `RPC_URL`, `WALLET_PRIVATE_KEY`, `CHAIN_ID` and `GAME_CONTRACT_ADDRESS` in `../teesa/.env`
6. Copy the contract ABI to `../teesa/app/_contracts` (added in .gitignore)
