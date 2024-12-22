'use server';

import { createStreamableUI } from "ai/rsc";
import { LlmChatMessage } from "./_components/llm-chat-message";
import { UserChatMessagePlaceholder } from "./_components/llm-chat-message-placeholder";
import { processUserInput } from "../_llm/llm";

export async function sendMessage(timestamp: number, message: string) {
  const responseUi = createStreamableUI();
  responseUi.update(<UserChatMessagePlaceholder />);

  (async () => {
    const [responseTimestamp, response] = await processUserInput('', timestamp, message);

    responseUi.done(<LlmChatMessage timestamp={responseTimestamp} message={response} />);
  })();

  return responseUi.value;
}