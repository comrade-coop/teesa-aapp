'use client';

import { sendMessage } from './_data/send-message';
import { MessageUiStateModel } from './_models/message-ui-state-model';
import { UserChatMessage } from './_components/user-chat-message';
import { getLocaleClient, getTimestamp } from '@/lib/utils';
import { MessagesList } from './_components/messages-list';
import { useEffect, useState } from 'react';
import { ChatInput } from './_components/chat-input';
import { SystemMessage } from './_components/system-message';
import { getMessages } from './_data/get-messages';
import { LlmChatMessage } from './_components/llm-chat-message';
import { v4 as uuidv4 } from 'uuid';
import MessageTabs from './_components/message-tabs';

export default function Page() {
  const [userId] = useState<string>(uuidv4());
  const [messages, setMessages] = useState<MessageUiStateModel[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);
  const [showAllMessages, setShowAllMesssages] = useState<boolean>(true);

  useEffect((() => {
    getNewMessages();

    const timeoutId = setTimeout(() => {
      setLastTimestamp(getTimestamp());
    }, 5000);

    return () => clearTimeout(timeoutId);
  }), []);

  useEffect(() => {
    if (!showAllMessages || !lastTimestamp) {
      return;
    }

    getNewMessages();

    const timeoutId = setTimeout(() => {
      setLastTimestamp(getTimestamp());
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [lastTimestamp, showAllMessages]);

  async function getNewMessages() {
    const newMessages = await getMessages();

    if (newMessages.length == 0) {
      return;
    }

    const messagesIds = messages.map(m => m.id);
    const newMessagesAsUiState = newMessages.filter(f => messagesIds.indexOf(f.id) == -1).map(m => ({
      id: m.id,
      userId: m.userId,
      timestamp: m.timestamp,
      display: <>
        <UserChatMessage timestamp={m.timestamp} locale={getLocaleClient()} message={m.userMessage} />
        <LlmChatMessage message={m.llmMessage} />
      </>
    }));

    setMessages(previousMessages => [
      ...previousMessages,
      ...newMessagesAsUiState
    ]);
  };

  async function hadleChatMessage(message: string) {
    setShowAllMesssages(false);

    const id = uuidv4();
    const timestamp = getTimestamp();
    const response = await sendMessage(userId, id, timestamp, message);

    setMessages(previousMessages => [
      ...previousMessages,
      {
        id: id,
        userId: userId,
        timestamp: timestamp,
        display: response
      }
    ]);
  };

  function handleTabChange(allMessages: boolean) {
    setShowAllMesssages(allMessages);
  }

  const systemMessage = (
    <>
      <p className="mb-2 font-bold text-md">Welcome to Teesa!</p>
      <p>I've selected a random word. Try to guess it by asking <span className='font-bold'>yes/no</span> questions.</p>
      <p>You can ask questions about the word or make a guess.</p>
    </>
  );

  const getMessagesForList = () => {
    if(showAllMessages) {
      return messages.sort(s => s.timestamp);
    }

    return messages.filter(m => m.userId == userId).sort(s => s.timestamp);
  };

  return (
    <div className="flex flex-col w-full max-w-lg pt-4 mx-auto stretch h-full">

      <SystemMessage
        message={systemMessage} />

      <MessageTabs
        showAllMessages={showAllMessages}
        onTabChange={handleTabChange} />

      <MessagesList
        messages={getMessagesForList()} />

      <ChatInput
        className='mt-auto'
        gameEnded={false}
        canSendMessages={true}
        onChatMessage={hadleChatMessage} />

    </div>
  );
}