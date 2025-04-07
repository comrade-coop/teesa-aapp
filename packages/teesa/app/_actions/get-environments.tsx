'use server';

import { getEnv } from "@/lib/environments";

/*
 * In production we set the CHAIN_ID, GAME_CONTRACT_ADDRESS, RPC_URL and WALLET_ADDRESS in the .env file on container startup.
 * We need to use these environment variables in a client component.
 * In Next.js the browser environment variables are set during the build process.
 * So we need to get the environment variables from the server in order to use them in a client component.
 */
export async function getEnvironments() {
  let chainId: number;
  try {
    chainId = Number(getEnv('CHAIN_ID'));
  } catch (error) {
    console.log('Error parsing chain ID:', error);
    chainId = -1;
  }

  const gameContractAddress = getEnv('GAME_CONTRACT_ADDRESS');
  const rpcUrl = getEnv('RPC_URL');
  const teesaWalletAddress = getEnv('WALLET_ADDRESS');
  
  return { chainId, gameContractAddress, rpcUrl, teesaWalletAddress };
}
