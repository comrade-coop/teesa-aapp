import { ConnectedWallet } from "@privy-io/react-auth";
import { executeContractAction } from '@/app/_utils/contract';

export async function claimAbandonedGameShare(walletAddress: string, wallets: ConnectedWallet[]): Promise<boolean> {
  return executeContractAction(
    walletAddress,
    wallets,
    'claimAbandonedGameShare',
    'Error claiming abandoned game share'
  );
} 