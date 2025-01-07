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
    // Remove artifacts, cache, and ignition deployments
    console.log('Removing artifacts, cache, and ignition deployments...');
    try {
      execSync('npx hardhat clean', { encoding: 'utf-8', stdio: 'inherit' });
      execSync('rm -rf ./ignition/deployments/*', { encoding: 'utf-8', stdio: 'inherit' });
      console.log('Clear successful! ✅');
    } catch (error) {
      console.error('Clear failed! ❌');
      throw error;
    }

    // Compile contracts first
    console.log('Compiling contracts...');
    try {
      execSync('npx hardhat compile', { encoding: 'utf-8', stdio: 'inherit' });
      console.log('Compilation successful! ✅');
    } catch (error) {
      console.error('Compilation failed! ❌');
      throw error;
    }

    // Run tests
    console.log('\nRunning tests...');
    try {
      execSync('npx hardhat test', { encoding: 'utf-8', stdio: 'inherit' });
      console.log('Tests passed successfully! ✅');
    } catch (error) {
      console.error('Tests failed! ❌');
      throw error;
    }

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

      const teamAddresses = process.env.TEAM_ADDRESSES;
      if (!teamAddresses) {
        throw new Error("TEAM_ADDRESSES environment variable is not set");
      }

      const teamAddressesArray = teamAddresses.split(',').map(addr => addr.trim());
      if (teamAddressesArray.length === 0) {
        throw new Error("At least one team address is required");
      }

      try {
        // Create arguments.js file
        const argsFilePath = createConstructorArgsFile(teamAddressesArray);
        
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
    const chainId = network === 'localhost' ? 1337 :
      network === 'sepolia' ? 11155111 :
        network === 'base' ? 8453 :
          -1;

    // Set CHAIN ID in .env
    if (envContent.includes('NEXT_PUBLIC_CHAIN_ID=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_CHAIN_ID=.*/, `NEXT_PUBLIC_CHAIN_ID=${chainId}`);
    } else {
      envContent += `\nNEXT_PUBLIC_CHAIN_ID=${chainId}`;
    }

    // Update RPC URL based on network
    const rpcUrl = network === 'localhost' ? process.env.LOCALHOST_RPC_URL :
      network === 'sepolia' ? process.env.SEPOLIA_RPC_URL :
        network === 'base' ? process.env.BASE_RPC_URL :
          '';

    // Update RPC_URL in .env
    if (envContent.includes('RPC_URL=')) {
      envContent = envContent.replace(/RPC_URL=.*/, `RPC_URL=${rpcUrl}`);
    } else {
      envContent += `\nRPC_URL=${rpcUrl}`;
    }

    // Get corresponding private key based on network
    const privateKey = network === 'localhost' ? process.env.WALLET_PRIVATE_KEY_LOCALHOST :
      network === 'sepolia' ? process.env.WALLET_PRIVATE_KEY_SEPOLIA :
        network === 'base' ? process.env.WALLET_PRIVATE_KEY_BASE :
          '';

    // Update WALLET_PRIVATE_KEY in .env
    if (envContent.includes('WALLET_PRIVATE_KEY=')) {
      envContent = envContent.replace(/WALLET_PRIVATE_KEY=.*/, `WALLET_PRIVATE_KEY=${privateKey}`);
    } else {
      envContent += `\nWALLET_PRIVATE_KEY=${privateKey}`;
    }

    if (envContent.includes('NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=${contractAddress}`;
    }

    fs.writeFileSync(envPath, envContent.trim());

    // Create _contracts directory if it doesn't exist
    const contractsDir = path.join(__dirname, '../../teesa/app/_contracts');
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    // Copy artifact
    const artifactPath = path.join(__dirname, '../artifacts/contracts/Game.sol/Game.json');
    const destPath = path.join(contractsDir, 'Game.json');
    fs.copyFileSync(artifactPath, destPath);

    console.log(`Deployment successful! Contract address: ${contractAddress}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

function createConstructorArgsFile(teamAddresses: string[]): string {
  const argsContent = `module.exports = [[\n${teamAddresses.map(addr => `"${addr}"`).join(',\n')}\n]];`;
  const argsFilePath = path.join(__dirname, '../arguments.js');
  fs.writeFileSync(argsFilePath, argsContent);
  return argsFilePath;
}
