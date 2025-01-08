import { ethers } from 'ethers';
import GameContract from '../../../_contracts/Game.json';
import { ConnectedWallet } from "@privy-io/react-auth";
import { getEnvironments } from '../../../_actions/get-environments';

export async function withdrawShare(walletAddress: string, wallets: ConnectedWallet[]): Promise<boolean> {
  const wallet = wallets.find(wallet => wallet.address == walletAddress);
  if (!wallet) {
    return false;
  }

  const { chainId, gameContractAddress } = await getEnvironments();
  
  await wallet.switchChain(chainId);

  const provider = await wallet.getEthersProvider();
  const signer = provider.getSigner();
  const gameContract = new ethers.Contract(gameContractAddress!, GameContract.abi, signer as any);

  try {
    const withdrawTransaction = await gameContract.withdrawTeamShare();
    await provider.waitForTransaction(withdrawTransaction.hash, 1);
    return true;
  } catch (error) {
    console.log('Error processing withdraw share:', error);
    return false;
  }
}