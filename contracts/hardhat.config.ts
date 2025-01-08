import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "./tasks/deploy";

require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: process.env.RPC_URL_LOCALHOST,
      accounts: [process.env.WALLET_PRIVATE_KEY_LOCALHOST!]
    },
    sepolia: {
      url: process.env.RPC_URL_SEPOLIA,
      accounts: [process.env.WALLET_PRIVATE_KEY_SEPOLIA!]
    },
    base: {
      url: process.env.RPC_URL_BASE,
      accounts: [process.env.WALLET_PRIVATE_KEY_BASE!]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY!,
      base: process.env.BASESCAN_API_KEY!
    }
  }
};

export default config;
