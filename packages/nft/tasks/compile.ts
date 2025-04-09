import { task } from "hardhat/config";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

task("compile-contract", "Compile the NFT contract")
  .setAction(async () => {
    await compile();
  });

async function compile() {
  try {
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

    // Create ../abi directory if it doesn't exist
    const contractsDir = path.join(__dirname, '../abi');
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }

    // Copy artifact
    const artifactPath = path.join(__dirname, '../artifacts/contracts/teesa-nft.sol/TeesaNft.json');
    const destPath = path.join(contractsDir, 'teesa-nft.json');
    fs.copyFileSync(artifactPath, destPath);

    console.log(`Compile successful!`);
  } catch (error) {
    console.error('Compile error:', error);
    process.exit(1);
  }
}
