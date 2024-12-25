'use server';

import { llmState } from "@/app/_llm/state";

export async function getGameEnded(): Promise<boolean> {
  return llmState.getGameEnded();
}