import { ethers } from 'ethers';
import GameContract from '../../_contracts/Game.json';
import { ConnectedWallet } from "@privy-io/react-auth";

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

  const provider = await wallet.getEthersProvider();
  const signer = provider.getSigner();
  const gameContract = new ethers.Contract(process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS!, GameContract.abi, signer);

  try {
    const balance = await provider.getBalance(walletAddress);
    const currentPrice = await gameContract.getCurrentPrice();

    if(balance.lt(currentPrice)) {
      return ProcessPaymentResult.FailedInsufficientFunds;
    }

    const paymentTransaction = await gameContract.pay({ value: currentPrice });
    await paymentTransaction.wait();

    return ProcessPaymentResult.Success;
  } catch (error) {
    console.log('Error processing payment:', error);
    return ProcessPaymentResult.FailedOtherError;
  }
}
