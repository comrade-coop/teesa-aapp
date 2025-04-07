import { ethers } from 'ethers';
import GameContract from './abi/Game.json';
import { ConnectedWallet } from "@privy-io/react-auth";
import { getEnvironments } from '../_actions/get-environments';

export enum ExecuteContractActionClientResult {
  Success,
  FailedWalletNotFound,
  FailedOtherError
}

export async function executeContractActionClient(
  walletAddress: string, 
  wallets: ConnectedWallet[],
  contractMethod: string,
  params: any[],
  errorMessage?: string
): Promise<ExecuteContractActionClientResult> {
  if (!errorMessage) {
    errorMessage = `Error executing contract action: ${contractMethod}`;
  }

  const wallet = wallets.find(wallet => wallet.address == walletAddress);
  if (!wallet) {
    console.error(`Wallet not found for address: ${walletAddress}`);
    return ExecuteContractActionClientResult.FailedWalletNotFound;
  }

  const { chainId, gameContractAddress } = await getEnvironments();
  
  await wallet.switchChain(chainId);

  const provider = await wallet.getEthersProvider();
  const signer = provider.getSigner();
  const gameContract = new ethers.Contract(gameContractAddress!, GameContract.abi, signer as any);

  try {
    const transaction = await gameContract[contractMethod](...params);
    await provider.waitForTransaction(transaction.hash, 1);
    return ExecuteContractActionClientResult.Success;
  } catch (error) {
    console.error(errorMessage, error);
    return ExecuteContractActionClientResult.FailedOtherError;
  }
} 