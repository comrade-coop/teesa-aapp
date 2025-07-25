'use server';

import { replyToUser } from "@teesa-monorepo/agent/src/agent";
import { AgentClientsEnum } from "@teesa-monorepo/agent/src/state/types";
import { createStreamableUI } from "ai/rsc";
import { getLocaleServer } from "../../../lib/server-utils";
import { LlmChatMessage } from "../_components/llm-chat-message";
import { LlmChatMessagePlaceholder } from "../_components/llm-chat-message-placeholder";
import { UserChatMessage } from "../_components/user-chat-message";
import { startSummaryLoop } from "./summary";

export async function sendMessage(userId: string, userAddress: string | undefined, messageId: string, timestamp: number, message: string) {
  const responseUi = createStreamableUI();
  const locale = await getLocaleServer();

  responseUi.update(<>
    <UserChatMessage timestamp={timestamp} locale={locale} message={message} userId={userId} />
    <LlmChatMessagePlaceholder />
  </>);

  (async () => {
    let llmMessage = await replyToUser(AgentClientsEnum.WEB, userId, userAddress, messageId, timestamp, message);
    
    responseUi.update(<>
      <UserChatMessage timestamp={timestamp} locale={locale} message={message} userId={userId} />
      <LlmChatMessage message={llmMessage} />
    </>);
    
    responseUi.done();

    await startSummaryLoop();
  })();

  return responseUi.value;
}