import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();

// Ensure the private key exists
if (!process.env.WALLET_PRIVATE_KEY) {
  throw new Error("WALLET_PRIVATE_KEY environment variable is not set.");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [process.env.WALLET_PRIVATE_KEY]
    }
  }
};

export default config;
