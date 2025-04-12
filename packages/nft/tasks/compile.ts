import fs from 'fs';
import { task } from "hardhat/config";
import path from 'path';

task("compile-contracts", "Compile the NFT contracts")
  .setAction(async () => {
    const hre = await import("hardhat");
    await compile(hre);
  });

async function compile(hardhat: any) {
  try {
    // Compile contracts first
    console.log('Compiling contracts...');
    try {
      await hardhat.run("compile");
      console.log('Compilation successful! ✅');
    } catch (error) {
      console.error('Compilation failed! ❌');
      throw error;
    }

    // Run tests
    console.log('\nRunning tests...');
    try {
      await hardhat.run("test");
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

    // Copy TeesaNft artifact
    const artifactPath = path.join(__dirname, '../artifacts/contracts/teesa-nft.sol/TeesaNft.json');
    const destPath = path.join(contractsDir, 'teesa-nft.json');
    fs.copyFileSync(artifactPath, destPath);

    console.log(`Compile successful!`);
  } catch (error) {
    console.error('Compile error:', error);
    process.exit(1);
  }
}
