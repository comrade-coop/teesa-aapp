'use server';

import { createStreamableUI } from "ai/rsc";
import { LlmChatMessage } from "../_components/llm-chat-message";
import { wordGame } from '../../_core/word-game';
import { InputTypeEnum } from '../../_core/input-type-enum';
import { getLocaleServer } from "../../../lib/server-utils";
import { UserChatMessage } from "../_components/user-chat-message";
import { LlmChatMessagePlaceholder } from "../_components/llm-chat-message-placeholder";
import { setWinner } from "./set-winner";

export async function sendMessage(userAddress: string, id: string, timestamp: number, message: string, inputType: InputTypeEnum) {
  const responseUi = createStreamableUI();
  const locale = await getLocaleServer();

  responseUi.update(<>
    <UserChatMessage timestamp={timestamp} locale={locale} message={message} userAddress={userAddress} />
    <LlmChatMessagePlaceholder />
  </>);

  (async () => {
    let llmMessage = '';

    if (inputType == InputTypeEnum.GUESS) {
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