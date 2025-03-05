import { task } from "hardhat/config";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

task("deploy-contract", "Deploy the game contract")
  .addPositionalParam(
    "targetNetwork",
    "Network to deploy to (localhost, sepolia, baseSepolia, or base)"
  )
  .setAction(async (args) => {
    await deploy(args.targetNetwork);
  });

async function deploy(network: 'localhost' | 'sepolia' | 'baseSepolia' | 'base') {
  // Validate network parameter
  if (!['localhost', 'sepolia', 'baseSepolia', 'base'].includes(network)) {
    throw new Error(`Invalid network: ${network}. Must be one of: localhost, sepolia, baseSepolia, base`);
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

    console.log(`Deployment successful! Contract address:\n${contractAddress}`);
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
