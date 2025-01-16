import { ethers } from 'ethers';
import GameContract from '../../_contracts/Game.json';
import { gameState } from '@/app/_core/game-state';

export async function setupContractEventListeners() {
  if (!process.env.RPC_URL || !process.env.GAME_CONTRACT_ADDRESS) {
    console.error('Missing environment variables for contract events');
    return;
  }

  const provider = new ethers.WebSocketProvider(process.env.RPC_URL.replace('http', 'ws'));
  const contract = new ethers.Contract(process.env.GAME_CONTRACT_ADDRESS, GameContract.abi, provider);

  // Listen for GameAbandoned event
  contract.on('GameAbandoned', async () => {
    console.log('Game abandoned event received');
    await gameState.setGameAbandoned(true);
  });

  // Listen for GameEnded event
  contract.on('GameEnded', async () => {
    console.log('Game ended event received');
    await gameState.setGameEnded(true);
  });

  // Clean up on process exit
  process.on('exit', () => {
    contract.removeAllListeners();
    provider.destroy();
  });
} 