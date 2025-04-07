'use server';

import { getEnv } from '@/lib/environments';

export async function getContractInitialized() {
  const contractAddress = getEnv('GAME_CONTRACT_ADDRESS');
  
  return !!contractAddress;
}