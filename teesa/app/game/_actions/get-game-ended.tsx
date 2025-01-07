'use server';

import { gameState } from '@/app/_core/game-state';

export async function getGameEnded(): Promise<[boolean, string | undefined]> {
  const gameEnded = await gameState.getGameEnded();
  const winnerAddress = await gameState.getWinnerAddress();

  return [gameEnded, winnerAddress];
}