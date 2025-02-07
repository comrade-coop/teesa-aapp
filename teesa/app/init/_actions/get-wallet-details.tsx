'use server';

import { ethers } from 'ethers';

export async function getAccountFundsAmount() {
  const address = process.env.WALLET_ADDRESS as string;
  
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const balance = await provider.getBalance(address);
  
  // Convert balance from wei to ether
  const formattedBalance = ethers.formatEther(balance);

  return { address, balance: formattedBalance };
}