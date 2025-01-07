import { ethers } from 'ethers';
import GameContract from '../../../_contracts/Game.json';
import { ConnectedWallet } from "@privy-io/react-auth";

export async function withdrawShare(walletAddress: string, wallets: ConnectedWallet[]): Promise<boolean> {
  const wallet = wallets.find(wallet => wallet.address == walletAddress);
  if (!wallet) {
    return false;
  }

  let chainId: number;
  try {
    chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  } catch (error) {
    console.log('Error parsing chain ID:', error);
    return false;
  }
  await wallet.switchChain(chainId);

  const provider = await wallet.getEthersProvider();
  const signer = provider.getSigner();
  const gameContract = new ethers.Contract(process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS!, GameContract.abi, signer);

  try {
    const withdrawTransaction = await gameContract.withdrawTeamShare();
    await provider.waitForTransaction(withdrawTransaction.hash, 1);
    return true;
  } catch (error) {
    console.log('Error processing withdraw share:', error);
    return false;
  }
}