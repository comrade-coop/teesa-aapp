# Contracts

This project includes the contract and associated tools for deploying and testing. Each game instance has its own contract, and we are leveraging **Hardhat** for development, testing, and deployment.

## Project Structure

- **Contracts:** Contract files are located in the `/contracts` directory
- **Tests:** Test cases for the contracts are in the `/tests` directory
- **hardhat.config.ts:** Deployment configurations are available for the following networks:
  - Hardhat Local Network
  - Sepolia
  - Base Ethereum Mainnet

## Prerequisites

2. Ensure you have Node.js and npm installed
3. Install Hardhat and project dependencies:
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
   - `WALLET_PRIVATE_KEY_HARDHAT_LOCAL`: Private key for deploying to local Hardhat network
   - `WALLET_PRIVATE_KEY_SEPOLIA`: Private key for deploying to Sepolia testnet
   - `WALLET_PRIVATE_KEY_BASE`: Private key for deploying to Base mainnet
   - Generate Alchemy API key and include the following networks:
     - Base Mainnet
     - Ethereum Mainnet (required for Sepolia)
     - Ethereum Sepolia
   - `TEAM_ADDRESSES`: Comma-separated wallet addresses (no spaces) for team income distribution

## Deployment

Run the deployment script:
```bash
npx ts-node scripts/deploy.ts <network>
```
Replace `<network>` with desired target (`hardhat`, `sepolia`, `base`)

### Post-Deployment Steps

The deployment script will:
1. Compile the contract
2. Test the contract
3. Deploy the contract
4. Update the `NEXT_PUBLIC_GAME_CONTRACT_ADDRESS` in `/teesa/.env`
5. Copy the contract ABI to `/teesa/app/contracts`