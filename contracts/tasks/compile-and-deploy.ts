import { task } from "hardhat/config";
import { execSync } from 'child_process';

task("compile-and-deploy-contract", "Compile and deploy the game contract")
  .addPositionalParam(
    "targetNetwork",
    "Network to deploy to (localhost, sepolia, or base)"
  )
  .setAction(async (args) => {
    await compileAndDeploy(args.targetNetwork);
  });

async function compileAndDeploy(network: 'localhost' | 'sepolia' | 'base') {
  // Validate network parameter
  if (!['localhost', 'sepolia', 'base'].includes(network)) {
    throw new Error(`Invalid network: ${network}. Must be one of: localhost, sepolia, base`);
  }

  execSync(`npx hardhat compile-contract ${network}`, { encoding: 'utf-8', stdio: 'inherit' });
  execSync(`npx hardhat deploy-contract ${network}`, { encoding: 'utf-8', stdio: 'inherit' });
}