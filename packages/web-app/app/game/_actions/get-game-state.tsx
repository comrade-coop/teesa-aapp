'use server';

import { agentState } from '@teesa-monorepo/agent/src/state/agent-state';

export async function getGameState() {
  const [id, gameEnded, winnerAddress] = await Promise.all([
    agentState.getId(),
    agentState.getGameEnded(),
    agentState.getWinnerAddress()
  ]);

  return { id, gameEnded, winnerAddress };  
}
