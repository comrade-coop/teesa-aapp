'use server';

import { gameState } from '../../_core/game-state';

export async function getGameState() {
  const [id, gameEnded, winnerAddress] = await Promise.all([
    gameState.getId(),
    gameState.getGameEnded(),
    gameState.getWinnerAddress()
  ]);

  return { id, gameEnded, winnerAddress };
}
