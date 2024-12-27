'use server';

import { createStreamableUI } from "ai/rsc";
import { LlmChatMessage } from "../_components/llm-chat-message";
import { processUserInput } from "../../_core/word-game";
import { getLocaleServer } from "@/lib/server-utils";
import { UserChatMessage } from "../_components/user-chat-message";
import { LlmChatMessagePlaceholder } from "../_components/llm-chat-message-placeholder";

export async function sendMessage(userId: string, id: string, timestamp: number, message: string) {
  const responseUi = createStreamableUI();
  const locale = await getLocaleServer();

  responseUi.update(<>
    <UserChatMessage timestamp={timestamp} locale={locale} message={message} />
    <LlmChatMessagePlaceholder />
  </>);

  (async () => {

    const response = await processUserInput(userId, id, timestamp, message);

    responseUi.done(<>
      <UserChatMessage timestamp={timestamp} locale={locale} message={message} />
      <LlmChatMessage message={response} />
    </>);
  })();

  return responseUi.value;
}