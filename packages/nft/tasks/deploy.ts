import { task } from "hardhat/config";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import NftModule from "../ignition/modules/nft";

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

task("deploy-contracts", "Deploy the NFT contracts")
  .setAction(async () => {
    const hre = await import("hardhat");
    await deploy(hre);
  });

async function deploy(hardhat: any) {
  try {
    // Deploy contracts using Ignition
    console.log(`\nDeploying to ${hardhat.network.name}...`);
    let deploymentResult: any;
    try {
      deploymentResult = await hardhat.ignition.deploy(NftModule);
      console.log('Deployment command executed successfully! ✅');
    } catch (error) {
      console.error('Deployment failed! ❌');
      throw error;
    }

    const paymentSplitterContractAddress = deploymentResult.paymentSplitter.target;
    const teesaNftContractAddress = deploymentResult.teesaNft.target;

    // Verify contract on Etherscan/BaseScan
    console.log('\nVerifying contracts...');

    const teamAddress = process.env.TEAM_ADDRESS;
    if (!teamAddress) {
      throw new Error("TEAM_ADDRESS environment variable is not set");
    }

    try {
      // Verify contracts, passing arguments directly
      await hardhat.run("verify:verify", {
        address: paymentSplitterContractAddress,
        network: hardhat.network.name,
        contract: "contracts/payment-splitter.sol:PaymentSplitter"
      });

      await hardhat.run("verify:verify", {
        address: teesaNftContractAddress,
        constructorArguments: [teamAddress, paymentSplitterContractAddress],
        network: hardhat.network.name,
        contract: "contracts/teesa-nft.sol:TeesaNft"
      });

      console.log('Contracts verification successful! ✅');
    } catch (error) {
      console.error('Contracts verification failed! ❌');
      console.error(error);
    }

    // Update .env file
    const envPath = path.join(__dirname, '../../../.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update CONTRACT_ADDRESS in .env
    if (envContent.includes('NFT_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/NFT_CONTRACT_ADDRESS=.*/, `NFT_CONTRACT_ADDRESS=${teesaNftContractAddress}`);
    } else {
      envContent += `\NFT_CONTRACT_ADDRESS=${teesaNftContractAddress}`;
    }

    fs.writeFileSync(envPath, envContent.trim());

    console.log(`Deployment successful! Teesa NFT contract address:\n${teesaNftContractAddress}`);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}
