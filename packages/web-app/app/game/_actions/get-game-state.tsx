'use server';

import { gameState } from '@teesa-monorepo/agent/src/state/agent-state';

export async function getGameState() {
  const [id, gameEnded, winnerAddress] = await Promise.all([
    gameState.getId(),
    gameState.getGameEnded(),
    gameState.getWinnerAddress()
  ]);

  return { id, gameEnded, winnerAddress };
}
