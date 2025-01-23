import { ConnectedWallet } from "@privy-io/react-auth";
import { executeContractActionClient, ExecuteContractActionClientResult } from "@/app/_contracts/execute-contract-action-client";
import { ClaimSharesResult } from "../../_models/claim-shares-result-enum";

export async function withdrawTeamShare(walletAddress: string, wallets: ConnectedWallet[]): Promise<ClaimSharesResult> {
  const result = await executeContractActionClient(
    walletAddress,
    wallets,
    'withdrawTeamShare',
    []
  );

  if (result == ExecuteContractActionClientResult.Success) {
    console.log('Team share withdrawn successfully');
    return ClaimSharesResult.Success;
  } else if (result == ExecuteContractActionClientResult.FailedWalletNotFound) {
    return ClaimSharesResult.FailedWalletNotFound;
  } else {
    return ClaimSharesResult.FailedOtherError;
  }
}
