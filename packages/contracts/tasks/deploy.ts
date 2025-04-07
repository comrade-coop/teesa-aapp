import { task } from "hardhat/config";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getNetwork } from "../networks";

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

task("deploy-contract", "Deploy the game contract")
  .setAction(async () => {
    await deploy();
  });

async function deploy() {
  try {
    const network = getNetwork().name;

    // Deploy contract using Ignition
    console.log(`\nDeploying to ${network}...`);
    let output: string;
    try {
      output = execSync(
        `echo y | npx hardhat ignition deploy ./ignition/modules/teesa-nft.ts --network ${network}`,
        { encoding: 'utf-8' }
      );
      console.log(output);
      console.log('Deployment command executed successfully! ✅');
    } catch (error) {
      console.error('Deployment failed! ❌');
      throw error;
    }

    // Extract contract address from output
    const addressMatch = output.match(/TeesaNftModule#TeesaNft - (0x[a-fA-F0-9]{40})/);
    if (!addressMatch) {
      throw new Error('Could not find contract address in deployment output');
    }
    const contractAddress = addressMatch[1];

    // Verify contract on Etherscan/BaseScan
    console.log('\nVerifying contract...');

    const nftName = process.env.NFT_NAME;
    if (!nftName) {
      throw new Error("NFT_NAME environment variable is not set");
    }
    const nftSymbol = process.env.NFT_SYMBOL;
    if (!nftSymbol) {
      throw new Error("NFT_SYMBOL environment variable is not set");
    }
    const royaltyFeeReceiverAddress = process.env.ROYALTY_FEE_RECEIVER_ADDRESS;
    if (!royaltyFeeReceiverAddress) {
      throw new Error("ROYALTY_FEE_RECEIVER_ADDRESS environment variable is not set");
    }
    const royaltyFeeNumeratorStr = process.env.ROYALTY_FEE_NUMERATOR;
    if (!royaltyFeeNumeratorStr) {
      throw new Error("ROYALTY_FEE_NUMERATOR environment variable is not set");
    }
    // Hardhat verify expects large numbers as strings
    const royaltyFeeNumerator = royaltyFeeNumeratorStr;

    try {
      // Create arguments.js file
      const argsFilePath = createConstructorArgsFile(
        nftName,
        nftSymbol,
        royaltyFeeReceiverAddress,
        royaltyFeeNumerator
      );

      try {
        // Execute verification with constructor args file
        const verifyCommand = `npx hardhat verify --constructor-args ${argsFilePath} --network ${network} ${contractAddress}`;
        execSync(verifyCommand, { encoding: 'utf-8', stdio: 'inherit' });
        console.log('Contract verification successful! ✅');
      } catch (error) {
        console.error('Contract verification failed! ❌');
        console.error(error);
      } finally {
        fs.unlinkSync(argsFilePath);
      }
    } catch (error) {
      console.error('Contract verification process failed! ❌');
      console.error(error);
    }

    // Update .env file
    const envPath = path.join(__dirname, '../../../.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update CONTRACT_ADDRESS in .env
    if (envContent.includes('NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${contractAddress}`);
    } else {
      envContent += `\NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${contractAddress}`;
    }

    fs.writeFileSync(envPath, envContent.trim());

    console.log(`Deployment successful! Contract address:\n${contractAddress}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

function createConstructorArgsFile(
  nftName: string,
  nftSymbol: string,
  teamAddress: string,
  royaltyFeeNumerator: string // Use string for large number compatibility
): string {
  const argsContent = `module.exports = [
  "${nftName}",
  "${nftSymbol}",
  "${teamAddress}",
  "${royaltyFeeNumerator}"
];`;
  const argsFilePath = path.join(__dirname, '../arguments.js');
  fs.writeFileSync(argsFilePath, argsContent);
  return argsFilePath;
}
