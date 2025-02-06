import { task } from "hardhat/config";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

task("deploy-contract", "Deploy the game contract")
  .addPositionalParam(
    "targetNetwork",
    "Network to deploy to (localhost, sepolia, or base)"
  )
  .setAction(async (args) => {
    await deploy(args.targetNetwork);
  });

async function deploy(network: 'localhost' | 'sepolia' | 'base') {
  // Validate network parameter
  if (!['localhost', 'sepolia', 'base'].includes(network)) {
    throw new Error(`Invalid network: ${network}. Must be one of: localhost, sepolia, base`);
  }

  try {
    // Deploy contract using Ignition
    console.log(`\nDeploying to ${network}...`);
    let output: string;
    try {
      output = execSync(
        `echo y | npx hardhat ignition deploy ./ignition/modules/Game.ts --network ${network}`,
        { encoding: 'utf-8' }
      );
      console.log(output);
      console.log('Deployment command executed successfully! ✅');
    } catch (error) {
      console.error('Deployment failed! ❌');
      throw error;
    }

    // Extract contract address from output
    const addressMatch = output.match(/GameModule#Game - (0x[a-fA-F0-9]{40})/);
    if (!addressMatch) {
      throw new Error('Could not find contract address in deployment output');
    }
    const contractAddress = addressMatch[1];

    if (network != 'localhost') {
      // Verify contract on Etherscan/BaseScan
      console.log('\nVerifying contract...');

      const teamAddress = process.env.TEAM_ADDRESS;
      if (!teamAddress) {
        throw new Error("TEAM_ADDRESS environment variable is not set");
      }

      try {
        // Create arguments.js file
        const argsFilePath = createConstructorArgsFile(teamAddress);
        
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
    }

    // Update /teesa/.env file
    const envPath = path.join(__dirname, '../../teesa/.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Set CHAIN ID based on network
    const chainId = network === 'localhost' ? 31337 :
      network === 'sepolia' ? 11155111 :
        network === 'base' ? 8453 :
          -1;

    // Set CHAIN ID in .env
    if (envContent.includes('CHAIN_ID=')) {
      envContent = envContent.replace(/CHAIN_ID=.*/, `CHAIN_ID=${chainId}`);
    } else {
      envContent += `\CHAIN_ID=${chainId}`;
    }

    // Update RPC URL based on network
    const rpcUrl = network === 'localhost' ? process.env.RPC_URL_LOCALHOST :
      network === 'sepolia' ? process.env.RPC_URL_SEPOLIA :
        network === 'base' ? process.env.RPC_URL_BASE :
          '';

    // Update RPC_URL in .env
    if (envContent.includes('RPC_URL=')) {
      envContent = envContent.replace(/RPC_URL=.*/, `RPC_URL=${rpcUrl}`);
    } else {
      envContent += `\nRPC_URL=${rpcUrl}`;
    }

    if (envContent.includes('GAME_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /GAME_CONTRACT_ADDRESS=.*/,
        `GAME_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\GAME_CONTRACT_ADDRESS=${contractAddress}`;
    }

    fs.writeFileSync(envPath, envContent.trim());

    console.log(`Deployment successful! Contract address: ${contractAddress}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

function createConstructorArgsFile(teamAddress: string): string {
  const argsContent = `module.exports = ["${teamAddress}"];`;
  const argsFilePath = path.join(__dirname, '../arguments.js');
  fs.writeFileSync(argsFilePath, argsContent);
  return argsFilePath;
}
