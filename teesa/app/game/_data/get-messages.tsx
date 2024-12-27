'use server';

import { llmState } from '../../_core/game-state';

export async function getMessages() {
    const messages = await llmState.getHistory();

    return messages;
}