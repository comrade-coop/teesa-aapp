'use server';

import { ethers } from 'ethers';
import { getEnv } from '@/lib/environments';
export async function getAccountFundsAmount() {
  const address = getEnv('WALLET_ADDRESS') as string;
  
  const provider = new ethers.JsonRpcProvider(getEnv('RPC_URL'));
  const balance = await provider.getBalance(address);
  
  // Convert balance from wei to ether
  const formattedBalance = ethers.formatEther(balance);

  return { address, balance: formattedBalance };
}