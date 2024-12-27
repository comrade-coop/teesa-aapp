'use server';

import { gameState } from '@/app/_core/game-state';

export async function getGameEnded(): Promise<boolean> {
  return gameState.getGameEnded();
}