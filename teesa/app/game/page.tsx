'use client';

import { sendMessage } from './send-message-action';
import { MessageUiStateModel } from './_models/message-ui-state-model';
import { UserChatMessage } from './_components/user-chat-message';
import { getTimestamp, isNullOrWhiteSpace } from '@/lib/utils';
import { MessagesList } from './_components/messages-list';
import { useState } from 'react';
import { ChatInput } from './_components/chat-input';
import { SystemMessage } from './_components/system-message';
const { v4: uuidv4 } = require('uuid');

export default function Page() {
  const [messages, setMessages] = useState<MessageUiStateModel[]>([]);

  const systemMessage = (
    <>
      <p className="mb-2 font-bold text-md">Welcome to Teesa!</p>
      <p>I've selected a random noun. Try to guess it by asking <span className='font-bold'>yes/no</span> questions.</p>
      <p>You can ask questions about the word or make a guess.</p>
    </>
  );

  async function hadleChatMessage(message: string) {
    const timestamp = getTimestamp();

    setMessages(previousMessages => [
      ...previousMessages,
      {
        id: uuidv4(),
        role: 'user',
        display: <UserChatMessage timestamp={timestamp} message={message} />
      }
    ]);

    try {
      const response = await sendMessage(timestamp, message);

      setMessages(previousMessages => [
        ...previousMessages,
        {
          id: uuidv4(),
          role: 'assistant',
          display: response
        }
      ]);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-lg pt-4 mx-auto stretch h-full">

      <SystemMessage
        message={systemMessage} />

      <MessagesList
        messages={messages} />

      <ChatInput
        className='mt-auto'
        gameEnded={false}
        canSendMessages={true}
        onChatMessage={hadleChatMessage} />

    </div>
  );
}