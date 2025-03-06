'use server';

import { createStreamableUI } from "ai/rsc";
import { getLocaleServer } from "../../../lib/server-utils";
import { MessageTypeEnum } from '../../_core/message-type-enum';
import { wordGame } from '../../_core/word-game';
import { LlmChatMessage } from "../_components/llm-chat-message";
import { LlmChatMessagePlaceholder } from "../_components/llm-chat-message-placeholder";
import { UserChatMessage } from "../_components/user-chat-message";
import { setWinner } from "./set-winner";

export async function sendMessage(userAddress: string, id: string, timestamp: number, message: string, inputType: MessageTypeEnum) {
  const responseUi = createStreamableUI();
  const locale = await getLocaleServer();

  responseUi.update(<>
    <UserChatMessage timestamp={timestamp} locale={locale} message={message} userAddress={userAddress} />
    <LlmChatMessagePlaceholder />
  </>);

  (async () => {
    let llmMessage = '';

    if (inputType == MessageTypeEnum.GUESS) {
      const [wonGame, response] = await wordGame.checkGuessMessage(userAddress, id, timestamp, message);

      llmMessage = response;
      
      if (wonGame) {
        setWinner(userAddress, timestamp);
      }
    } else {
      llmMessage = await wordGame.processUserMessage(userAddress, id, timestamp, message, inputType);
    }

    responseUi.update(<>
      <UserChatMessage timestamp={timestamp} locale={locale} message={message} userAddress={userAddress} />
      <LlmChatMessage message={llmMessage} />
    </>);
    
    responseUi.done();
  })();

  return responseUi.value;
}