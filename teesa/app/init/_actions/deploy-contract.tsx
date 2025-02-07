'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import { DeployContractResult } from '../_models/deploy-contract-result-enum';

export async function deployContract(): Promise<DeployContractResult> {
  const execAsync = promisify(exec);

  try {
    console.log('Deploying contract...');

    const network = process.env.BLOCKCHAIN_NETWORK;
    const { stdout, stderr } = await execAsync(`cd ../contracts && npx hardhat deploy-contract ${network}`);

    console.log('Deployment output:');
    console.log(stdout);

    // Extract contract address from the output
    const addressMatch = stdout.match(/Contract address:\s*(\w+)/);
    const contractAddress = addressMatch ? addressMatch[1] : null;

    if (!contractAddress) {
      throw new Error('Contract address not found in deployment output');
    }

    console.log(`Contract address: ${contractAddress}`);
    process.env.GAME_CONTRACT_ADDRESS = contractAddress;

    return DeployContractResult.Success;
  } catch (error: any) {
    // Check for insufficient funds error
    if (error.stderr?.includes('insufficient funds') || error.message?.includes('insufficient funds')
      || error.stderr?.includes('IGN410: Gas estimation failed') || error.message?.includes('IGN410: Gas estimation failed')) {
      console.error('Deployment failed: Insufficient funds in wallet to pay for gas fees. Please add funds to your wallet and try again.');
      return DeployContractResult.FailedInsufficientFunds;
    }

    console.error('Error:', error);
    return DeployContractResult.Failed;
  }
}