'use server';

import { deploy } from '@/app/_contracts/deploys';
import { DeployContractResult } from '../_models/deploy-contract-result-enum';
import { setEnv } from '@/lib/environments';

export async function deployContract(): Promise<DeployContractResult> {
  try {
    const contractAddress = await deploy();
    setEnv('GAME_CONTRACT_ADDRESS', contractAddress);

    return DeployContractResult.Success;
  } catch (error: any) {
    // Check for insufficient funds error
    if (error.stderr?.includes('insufficient funds') || error.message?.includes('insufficient funds')
      || error.stderr?.includes('IGN410: Gas estimation failed') || error.message?.includes('IGN410: Gas estimation failed')) {
      return DeployContractResult.FailedInsufficientFunds;
    }

    return DeployContractResult.Failed;
  }
}