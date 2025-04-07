'use server';

import { createStreamableUI } from "ai/rsc";
import { getLocaleServer } from "../../../lib/server-utils";
import { MessageTypeEnum } from '../../_core/message-type-enum';
import { wordGame } from '../../_core/word-game';
import { LlmChatMessage } from "../_components/llm-chat-message";
import { LlmChatMessagePlaceholder } from "../_components/llm-chat-message-placeholder";
import { UserChatMessage } from "../_components/user-chat-message";
import { setWinner } from "./set-winner";
import { AnswerResultEnum } from "@/app/_core/game-state";

export async function sendMessage(userId: string, userAddress: string | undefined, id: string, timestamp: number, message: string, inputType: MessageTypeEnum) {
  const responseUi = createStreamableUI();
  const locale = await getLocaleServer();

  responseUi.update(<>
    <UserChatMessage timestamp={timestamp} locale={locale} message={message} userId={userId} />
    <LlmChatMessagePlaceholder />
  </>);

  (async () => {
    let llmMessage = '';

    if(inputType == MessageTypeEnum.GUESS) {
      const [response, answerResult] = await wordGame.checkGuessMessage(userId, id, timestamp, message);

      llmMessage = response;

      if(answerResult == AnswerResultEnum.CORRECT) {
        setWinner(userId, userAddress!, timestamp);
      }
    } else {
      llmMessage = await wordGame.processUserMessage(userId, id, timestamp, message, inputType);
    }

    responseUi.update(<>
      <UserChatMessage timestamp={timestamp} locale={locale} message={message} userId={userId} />
      <LlmChatMessage message={llmMessage} />
    </>);
    
    responseUi.done();
  })();

  return responseUi.value;
}