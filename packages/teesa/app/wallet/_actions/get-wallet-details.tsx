'use server';

import { getOwnerWalletAddress } from "@teesa-monorepo/nft/src/get-owner-wallet-address";
import { getNetwork } from "@teesa-monorepo/nft/src/networks";
import { ethers } from "ethers";

export async function getWalletDetails(): Promise<{ address: string, balance: string }> {
  const walletAddress = getOwnerWalletAddress();
  const network = getNetwork();

  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const balance = await provider.getBalance(walletAddress);
  const formattedBalance = ethers.formatEther(balance.toString());

  return { address: walletAddress, balance: formattedBalance };
} 