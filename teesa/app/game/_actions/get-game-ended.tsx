'use server';

import { gameState } from '@/app/_core/game-state';

export async function getGameEnded(): Promise<[boolean, string[], boolean]> {
  const [gameEnded, winnersAddresses, gameAbandoned] = await Promise.all([
    gameState.getGameEnded(),
    gameState.getWinnersAddresses(),
    gameState.getGameAbandoned()
  ]);

  return [gameEnded, winnersAddresses, gameAbandoned];
}