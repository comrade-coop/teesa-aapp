# NFT

This package includes the NFT contract with associated tools for deploying and testing, as well as methods for interacting with it. We are leveraging [Hardhat](https://hardhat.org) for development, testing, and deployment of the contract. You need to have the NFT contract deployed in order to use the Teesa aApp. **As this contract is an NFT collection, we deploy it once and reuse between games.**


## Project Structure

- **assets** - contains the assets for the NFTs
- **contracts** - contains the NFT contract file
- **src** - contains the methods for interacting with the contract
- **tasks** - contains the compilation and deployment tasks
- **tests** - contains the test cases for the contract
- **hardhat.config.ts** - contains the deployment configurations for the following networks:
  - Mainnet
  - Sepolia (testnet)
  - Base
  - Base Sepolia (testnet)


## Prerequisites

Ensure you have completed the **Development setup** - check the [README.md](../../README.md) in the root directory.


## Deployment and initialization

To deploy the NFT contract and mint the initial NFT, run the following command from the **root directory**:
```bash
pnpm nft
```

This command will:
- Compile the contract
- Copy the contract's ABI to the `packages/nft/abi` directory
- Deploy the contract to the selected network (set with the `CONTRACT_NETWORK` environment variable in the `.env` file)
- Verify the contract on Etherscan/Basescan (depending on the selected network)
- Update the `NFT_CONTRACT_ADDRESS` in the `/.env` file


## Package pnpm scripts

When making changes to the contract, you can use the following pnpm scripts to compile and deploy the contract: (**navigate to the `packages/nft` directory first**)

- `pnpm compile-contracts` - compile the contract and copy the ABI to the `packages/nft/abi` directory
- `pnpm deploy-contracts` - deploy and verify the contract
- `pnpm publish-initial-nft` - mint the initial NFT
