'use server';

/*
 * In production we set the CHAIN_ID and GAME_CONTRACT_ADDRESS in the .env file on container startup.
 * We need to use these environment variables in a client component.
 * In Next.js the browser environment variables are set during the build process.
 * So we need to get the environment variables from the server in order to use them in a client component.
 */
export async function getEnvironments() {
  let chainId: number;
  try {
    chainId = Number(process.env.CHAIN_ID);
  } catch (error) {
    console.log('Error parsing chain ID:', error);
    chainId = -1;
  }

  const gameContractAddress = process.env.GAME_CONTRACT_ADDRESS;
  const rpcUrl = process.env.RPC_URL;

  return { chainId, gameContractAddress, rpcUrl };
}
