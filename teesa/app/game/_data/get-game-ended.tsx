'use server';

import { llmState } from '../../_core/game-state';

export async function getGameEnded(): Promise<boolean> {
  return llmState.getGameEnded();
}