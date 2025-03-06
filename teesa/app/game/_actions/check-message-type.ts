'use server';

import { wordGame } from "../../_core/word-game";
import { InputTypeEnum } from "../../_core/input-type-enum";

export async function checkMessageType(message: string): Promise<[string, InputTypeEnum]> {
  return await wordGame.getInputTypeForMessage(message);
}