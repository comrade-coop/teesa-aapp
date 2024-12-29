'use server';

import { ConnectedWallet } from "@privy-io/react-auth";
import { ProcessPaymentResult } from "../_models/process-payment-result";

export async function processPayment(walletAddress: string, wallets: ConnectedWallet[]): Promise<ProcessPaymentResult> {
  const wallet = wallets.find(wallet => wallet.address == walletAddress);
  if(!wallet) {
    return ProcessPaymentResult.FailedWalletNotFound;
  }

  console.log("Processing payment...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Payment processed successfully");

  return ProcessPaymentResult.Success;
}
