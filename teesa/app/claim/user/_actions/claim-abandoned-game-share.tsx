import { ConnectedWallet } from "@privy-io/react-auth";
import { executeContractActionClient, ExecuteContractActionClientResult } from "../../../_contracts/execute-contract-action-client";
import { ClaimSharesResult } from "../../_models/claim-shares-result-enum";

export async function claimAbandonedGameShare(walletAddress: string, wallets: ConnectedWallet[]): Promise<ClaimSharesResult> {
  const result = await executeContractActionClient(
    walletAddress,
    wallets,
    'claimAbandonedGameShare',
    []
  );

  if (result == ExecuteContractActionClientResult.Success) {
    console.log(`Abandoned game share claimed successfully. Wallet address: ${walletAddress}`);
    return ClaimSharesResult.Success;
  } else if (result == ExecuteContractActionClientResult.FailedWalletNotFound) {
    return ClaimSharesResult.FailedWalletNotFound;
  } else {
    return ClaimSharesResult.FailedOtherError;
  }
} 