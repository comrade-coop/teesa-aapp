import 'server-only'
import { ethers } from 'ethers';
import GameContract from '../../_contracts/Game.json';
import { gameState } from '@/app/_core/game-state';

export async function awardPrice() {
  if (!process.env.RPC_URL) {
    throw new Error('RPC_URL environment variable is not set');
  }

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, provider);
  
  const gameContract = new ethers.Contract(
    process.env.NEXT_PUBLIC_GAME_CONTRACT_ADDRESS!,
    GameContract.abi,
    wallet
  );

  try {
    const winnerAddress = await gameState.getWinnerAddress();
    const awardTransaction = await gameContract.awardPrize(winnerAddress);
    await awardTransaction.wait();
  } catch (error) {
    console.log('Error awarding price:', error);
  }
}