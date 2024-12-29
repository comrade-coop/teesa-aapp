import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

type Network = 'hardhat-local' | 'sepolia' | 'base';

async function deploy(network: Network) {
  try {
    // Deploy contract using Ignition
    console.log(`Deploying to ${network}...`);
    const output = execSync(
      `echo y | npx hardhat ignition deploy ./ignition/modules/Game.ts --network ${network}`,
      { encoding: 'utf-8' }
    );
    
    // Extract contract address from output
    const addressMatch = output.match(/GameModule#Game - (0x[a-fA-F0-9]{40})/);
    if (!addressMatch) {
      throw new Error('Could not find contract address in deployment output');
    }
    const contractAddress = addressMatch[1];

    // Update .env file
    const envPath = path.join(__dirname, '../../teesa/.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    if (envContent.includes('GAME_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /GAME_CONTRACT_ADDRESS=.*/,
        `GAME_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nGAME_CONTRACT_ADDRESS=${contractAddress}`;
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

// Allow running from command line
if (require.main === module) {
  const network = process.argv[2] as Network;
  if (!network) {
    console.error('Please provide a network: hardhat-local, sepolia, or base');
    process.exit(1);
  }
  deploy(network);
}

export { deploy };
