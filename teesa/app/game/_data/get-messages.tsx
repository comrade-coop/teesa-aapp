'use server';

import { llmState } from "@/app/_llm/state";

export async function getMessages() {
    let messages = await llmState.getHistory();

    return messages;
}