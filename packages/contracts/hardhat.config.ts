import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "./tasks/compile";
import "./tasks/deploy";
import "./tasks/compile-and-deploy";

require('dotenv').config({ path: '../../.env' });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mainnet: {
      url: process.env.RPC_URL_MAINNET,
      accounts: [process.env.WALLET_PRIVATE_KEY!]
    },
    sepolia: {
      url: process.env.RPC_URL_SEPOLIA,
      accounts: [process.env.WALLET_PRIVATE_KEY!]
    },
    baseSepolia: {
      url: process.env.RPC_URL_BASE_SEPOLIA,
      accounts: [process.env.WALLET_PRIVATE_KEY!]
    },
    base: {
      url: process.env.RPC_URL_BASE,
      accounts: [process.env.WALLET_PRIVATE_KEY!]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY!,
      sepolia: process.env.ETHERSCAN_API_KEY!,
      baseSepolia: process.env.BASESCAN_API_KEY!,
      base: process.env.BASESCAN_API_KEY!
    }
  }
};

export default config;
