'use server';

import { ethers } from 'ethers';
import { getWalletAddressAndBalance } from '@/app/_contracts/get-wallet-address-and-balance';

export async function getWalletDetails() {
  const { address, balance } = await getWalletAddressAndBalance();
  
  // Convert balance from wei to ether
  const formattedBalance = ethers.formatEther(balance.toString());

  return { address, balance: formattedBalance };
}