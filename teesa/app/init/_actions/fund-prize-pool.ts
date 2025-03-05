import { ConnectedWallet } from "@privy-io/react-auth";
import { executeContractActionClient, ExecuteContractActionClientResult } from "../../_contracts/execute-contract-action-client";
import { parseEther } from "ethers";

export async function fundPrizePool(walletAddress: string, wallets: ConnectedWallet[], amount: number): Promise<ExecuteContractActionClientResult> {
  const result = await executeContractActionClient(
    walletAddress,
    wallets,
    'fundPrizePool',
    [{ value: parseEther(amount.toString()) }]
  );

  if (result == ExecuteContractActionClientResult.Success) {
    console.log('Prize pool funded successfully');
  }

  return result;
} 