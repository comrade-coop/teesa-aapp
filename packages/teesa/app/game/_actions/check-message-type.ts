'use server';

import { wordGame } from "../../_core/word-game";
import { MessageTypeEnum } from "../../_core/message-type-enum";

export async function checkMessageType(message: string): Promise<[string, MessageTypeEnum]> {
  return await wordGame.getInputTypeForMessage(message);
}