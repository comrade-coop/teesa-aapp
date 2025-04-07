'use server';

import { gameState } from '../../_core/game-state';

export async function getMessages() {
    return gameState.getHistory();
}