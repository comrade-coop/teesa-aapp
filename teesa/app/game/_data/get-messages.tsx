'use server';

import { gameState } from '@/app/_core/game-state';

export async function getMessages() {
    return gameState.getHistory();
}