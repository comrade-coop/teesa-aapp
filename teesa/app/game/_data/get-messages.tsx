'use server';

import { llmState } from "@/app/_llm/state";

export async function getMessages() {
    const messages = await llmState.getHistory();

    return messages;
}