import { ConnectedWallet } from "@privy-io/react-auth";
import { getWalletBalance } from '../../_contracts/get-wallet-balance';
import { executeContractActionClient, ExecuteContractActionClientResult } from '../../_contracts/execute-contract-action-client';
import { calculateCurrentFee } from "@/app/game/_actions/calculate-current-fee";
export enum ProcessPaymentResult {
  Success,
  FailedInsufficientFunds,
  FailedWalletNotFound,
  FailedOtherError
}

export async function processPayment(walletAddress: string, wallets: ConnectedWallet[]): Promise<ProcessPaymentResult> {
  if (process.env.NEXT_PUBLIC_ENV_MODE === 'dev') {
    return ProcessPaymentResult.Success;
  }

  const balance = await getWalletBalance(walletAddress, wallets);
  if (!balance) {
    return ProcessPaymentResult.FailedWalletNotFound;
  }

  const currentFee = await calculateCurrentFee();

  if(balance.lt(currentFee)) {
    return ProcessPaymentResult.FailedInsufficientFunds;
  }

  const result = await executeContractActionClient(walletAddress, wallets, 'payFee', [{ value: currentFee }]);
    
  if(result == ExecuteContractActionClientResult.Success) {
    return ProcessPaymentResult.Success;
  } else if(result == ExecuteContractActionClientResult.FailedWalletNotFound) {
    return ProcessPaymentResult.FailedWalletNotFound;
  } else {
    return ProcessPaymentResult.FailedOtherError;
  }
}
