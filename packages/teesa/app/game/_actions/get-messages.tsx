'use server';

import { gameState } from '../../../agent/game-state';

export async function getMessages() {
    return gameState.getHistory();
}