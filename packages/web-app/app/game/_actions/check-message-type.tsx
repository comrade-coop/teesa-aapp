'use server';

import { isMessageGuess } from "@teesa-monorepo/agent/src/get-message-type";

export async function checkMessageType(message: string): Promise<boolean> {
  return await isMessageGuess(message);
}