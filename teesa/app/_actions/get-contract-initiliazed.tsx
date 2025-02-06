import 'server-only';

export async function getContractInitialized() {
  const contractAddress = process.env.GAME_CONTRACT_ADDRESS;
  
  return !!contractAddress;
}