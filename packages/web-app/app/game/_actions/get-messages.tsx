'use server';

import { gameState } from '@teesa-monorepo/agent/src/state/agent-state';

export async function getMessages() {
    return gameState.getHistory();
}