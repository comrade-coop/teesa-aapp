import { ethers } from 'ethers';
import GameContract from '../../_contracts/Game.json';
import { ConnectedWallet } from "@privy-io/react-auth";
import { getEnvironments } from '../../_actions/get-environments';

export enum ProcessPaymentResult {
  Success,
  FailedInsufficientFunds,
  FailedWalletNotFound,
  FailedOtherError
}

export async function processPayment(walletAddress: string, wallets: ConnectedWallet[]): Promise<ProcessPaymentResult> {
  const wallet = wallets.find(wallet => wallet.address == walletAddress);
  if (!wallet) {
    return ProcessPaymentResult.FailedWalletNotFound;
  }

  const { chainId, gameContractAddress } = await getEnvironments();

  await wallet.switchChain(chainId);

  const provider = await wallet.getEthersProvider();
  const signer = provider.getSigner();
  const gameContract = new ethers.Contract(gameContractAddress!, GameContract.abi, signer as any);

  try {
    const balance = await provider.getBalance(walletAddress);
    const currentPrice = await gameContract.currentFee();

    if(balance.lt(currentPrice)) {
      return ProcessPaymentResult.FailedInsufficientFunds;
    }

    const paymentTransaction = await gameContract.payFee({ value: currentPrice });
    await provider.waitForTransaction(paymentTransaction.hash, 1);

    return ProcessPaymentResult.Success;
  } catch (error) {
    console.log('Error processing payment:', error);
    return ProcessPaymentResult.FailedOtherError;
  }
}
