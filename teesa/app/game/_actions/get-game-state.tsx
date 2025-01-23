'use server';

import { gameState } from '@/app/_core/game-state';

export async function getGameState() {
  const [gameEnded, winnerAddress] = await Promise.all([
    gameState.getGameEnded(),
    gameState.getWinnerAddress()
  ]);

  return { gameEnded, winnerAddress };
}
