import { task } from "hardhat/config";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

task("compile-contract", "Compile the game contract")
  .setAction(async () => {
    await compile();
  });

async function compile() {
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

    // Create /teesa/app/_contracts directory if it doesn't exist
    const contractsDir = path.join(__dirname, '../../teesa/app/_contracts');
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    // Copy artifact
    const artifactPath = path.join(__dirname, '../artifacts/contracts/Game.sol/Game.json');
    const destPath = path.join(contractsDir, 'Game.json');
    fs.copyFileSync(artifactPath, destPath);

    console.log(`Compile successful!`);
  } catch (error) {
    console.error('Compile error:', error);
    process.exit(1);
  }
}
