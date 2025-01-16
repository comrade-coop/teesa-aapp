import { ethers } from 'ethers';
import GameContract from '../../_contracts/Game.json';
import { ConnectedWallet } from "@privy-io/react-auth";
import { getEnvironments } from '../../_actions/get-environments';

export async function executeContractAction(
  walletAddress: string, 
  wallets: ConnectedWallet[],
  contractMethod: string,
  errorMessage: string = 'Error executing contract action'
): Promise<boolean> {
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
    const transaction = await gameContract[contractMethod]();
    await provider.waitForTransaction(transaction.hash, 1);
    return true;
  } catch (error) {
    console.error(errorMessage, error);
    return false;
  }
} 