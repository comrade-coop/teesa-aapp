'use server';

import { gameState } from '@/app/_core/game-state';

export async function getGameEnded(): Promise<[boolean, string[]]> {
  const gameEnded = await gameState.getGameEnded();
  const winnersAddresses = await gameState.getWinnersAddresses();

  return [gameEnded, winnersAddresses];
}