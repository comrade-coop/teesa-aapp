'use server';

import { isMessageGuess } from "@/agent/get-message-type";

export async function checkMessageType(message: string): Promise<boolean> {
  return await isMessageGuess(message);
}