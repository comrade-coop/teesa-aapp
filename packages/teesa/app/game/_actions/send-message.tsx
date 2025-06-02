'use server';

import { runAgent } from "@/agent/agent";
import { AgentClientsEnum } from "@/agent/game-state";
import { createStreamableUI } from "ai/rsc";
import { getLocaleServer } from "../../../lib/server-utils";
import { LlmChatMessage } from "../_components/llm-chat-message";
import { LlmChatMessagePlaceholder } from "../_components/llm-chat-message-placeholder";
import { UserChatMessage } from "../_components/user-chat-message";

export async function sendMessage(userId: string, userAddress: string | undefined, messageId: string, timestamp: number, message: string) {
  const responseUi = createStreamableUI();
  const locale = await getLocaleServer();

  responseUi.update(<>
    <UserChatMessage timestamp={timestamp} locale={locale} message={message} userId={userId} />
    <LlmChatMessagePlaceholder />
  </>);

  (async () => {
    let llmMessage = await runAgent(AgentClientsEnum.WEB, userId, userAddress, messageId, timestamp, message);
    
    responseUi.update(<>
      <UserChatMessage timestamp={timestamp} locale={locale} message={message} userId={userId} />
      <LlmChatMessage message={llmMessage} />
    </>);
    
    responseUi.done();
  })();

  return responseUi.value;
}