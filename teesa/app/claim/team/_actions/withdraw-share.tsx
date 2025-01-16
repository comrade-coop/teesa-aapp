import { ConnectedWallet } from "@privy-io/react-auth";
import { executeContractAction } from '@/app/_utils/contract';

export async function withdrawShare(walletAddress: string, wallets: ConnectedWallet[]): Promise<boolean> {
  return executeContractAction(
    walletAddress,
    wallets,
    'withdrawTeamShare',
    'Error processing withdraw share'
  );
}