import { task } from "hardhat/config";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

task("compile-contract", "Compile the game contract")
  .addPositionalParam(
    "targetNetwork",
    "Network to deploy to (localhost, sepolia, or base)"
  )
  .setAction(async (args) => {
    await compile(args.targetNetwork);
  });

async function compile(network: 'localhost' | 'sepolia' | 'base') {
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

    // Create /teesa/app/_contracts/abi directory if it doesn't exist
    const contractsDir = path.join(__dirname, '../../teesa/app/_contracts/abi');
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    // Copy artifact
    const artifactPath = path.join(__dirname, '../artifacts/contracts/Game.sol/Game.json');
    const destPath = path.join(contractsDir, 'Game.json');
    fs.copyFileSync(artifactPath, destPath);



    // Update /teesa/.env file
    const envPath = path.join(__dirname, '../../teesa/.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update BLOCKCHAIN_NETWORK in .env
    if (envContent.includes('BLOCKCHAIN_NETWORK=')) {
      envContent = envContent.replace(/BLOCKCHAIN_NETWORK=.*/, `BLOCKCHAIN_NETWORK=${network}`);
    } else {
      envContent += `\nBLOCKCHAIN_NETWORK=${network}`;
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

    fs.writeFileSync(envPath, envContent.trim());

    console.log(`Compile successful!`);
  } catch (error) {
    console.error('Compile error:', error);
    process.exit(1);
  }
}
