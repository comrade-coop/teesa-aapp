'use server';

import { createStreamableUI } from "ai/rsc";
import { LlmChatMessage } from "../_components/llm-chat-message";
import { wordGame } from '@/app/_core/word-game';
import { getLocaleServer } from "@/lib/server-utils";
import { UserChatMessage } from "../_components/user-chat-message";
import { LlmChatMessagePlaceholder } from "../_components/llm-chat-message-placeholder";
import { awardPrice } from "./award-price";

export async function sendMessage(userAddress: string, id: string, timestamp: number, message: string) {
  const responseUi = createStreamableUI();
  const locale = await getLocaleServer();

  responseUi.update(<>
    <UserChatMessage timestamp={timestamp} locale={locale} message={message} userAddress={userAddress} />
    <LlmChatMessagePlaceholder />
  </>);

  (async () => {
    const [wonGame, response] = await wordGame.processUserInput(userAddress, id, timestamp, message);

    responseUi.done(<>
      <UserChatMessage timestamp={timestamp} locale={locale} message={message} userAddress={userAddress} />
      <LlmChatMessage message={response} />
    </>);

    if (wonGame) {
      await awardPrice();
    }
  })();

  return responseUi.value;
}