'use client';

import { sendMessage } from './_data/send-message';
import { MessageUiStateModel } from './_models/message-ui-state-model';
import { UserChatMessage } from './_components/user-chat-message';
import { getLocaleClient, getTimestamp } from '@/lib/utils';
import { MessagesList } from './_components/messages-list';
import { useEffect, useState } from 'react';
import { ChatInput } from './_components/chat-input';
import { getMessages } from './_data/get-messages';
import { LlmChatMessage } from './_components/llm-chat-message';
import { v4 as uuidv4 } from 'uuid';
import MessageTabs from './_components/message-tabs';
import { usePrivy } from '@privy-io/react-auth';
import { RulesPanel } from './_components/rules-panel';
import { processPayment, ProcessPaymentResult } from './_data/process-payment';
import { PaymentErrorChatMessage } from './_components/payment-error-chat-message';
import { getGameEnded } from './_data/get-game-ended';

export default function Page() {
  const { ready, authenticated, user, login } = usePrivy();
  const [messages, setMessages] = useState<MessageUiStateModel[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);
  const [showAllMessages, setShowAllMesssages] = useState<boolean>(true);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);

  const walletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  useEffect((() => {
    getGameEndedState();
    getNewMessages();

    const timeoutId = setTimeout(() => {
      setLastTimestamp(getTimestamp());
    }, 5000);

    return () => clearTimeout(timeoutId);
  }), []);

  useEffect(() => {
    // Skip on first loading
    if (!lastTimestamp) {
      return;
    }

    getGameEndedState();

    // Get new messages only if we are not showing all messages
    if(showAllMessages) {
      getNewMessages();
    }

    const timeoutId = setTimeout(() => {
      setLastTimestamp(getTimestamp());
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [lastTimestamp, showAllMessages]);

  async function getGameEndedState() {
    const gameEnded = await getGameEnded();
    setGameEnded(gameEnded);
  }

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
    if(!walletAddress) {
      return;
    }

    setShowAllMesssages(false);

    setPaymentProcessing(true);
    const paymentResult = await processPayment(walletAddress);
    setPaymentProcessing(false);

    if(paymentResult != ProcessPaymentResult.Success) {
      setMessages(previousMessages => [
        ...previousMessages,
        {
          id: uuidv4(),
          userId: walletAddress,
          timestamp: getTimestamp(),
          display: <PaymentErrorChatMessage error={paymentResult} />
        }
      ]);
      return;
    }

    const id = uuidv4();
    const timestamp = getTimestamp();
    const response = await sendMessage(walletAddress, id, timestamp, message);

    setMessages(previousMessages => [
      ...previousMessages,
      {
        id: id,
        userId: walletAddress,
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
      <h2 className="text-xl font-bold mb-4 text-white">How to Play</h2>
      <div className="space-y-4">
        <p>Welcome to Teesa! I've selected a random word for you to guess.</p>
        <div>
          <p className="font-semibold mb-2">Rules:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Ask <span className="font-bold">yes/no</span> questions about the word</li>
            <li>Questions should be about characteristics or properties</li>
            <li>Make a direct guess at any time</li>
            <li>No asking about spelling or word length</li>
            <li>No repeating questions</li>
          </ul>
        </div>
      </div>
    </>
  );

  const showMessages = (ready && authenticated) || showAllMessages;

  const getMessagesForList = () => {
    if(showAllMessages) {
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    }

    return messages.filter(m => m.userId == walletAddress).sort((a, b) => a.timestamp - b.timestamp);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full gap-4 p-4">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full max-w-2xl mx-auto w-full">
        <MessageTabs
          showAllMessages={showAllMessages}
          onTabChange={handleTabChange} />

        {showMessages ?
         <MessagesList
          messages={getMessagesForList()} />
        :
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-white">Connect your wallet to start playing</p>
        </div>}

        {ready && <ChatInput
          className='mt-auto'
          gameEnded={gameEnded}
          isLoggedIn={authenticated}
          loading={paymentProcessing}
          onLogin={login}
          onChatMessage={hadleChatMessage} />}
      </div>

      {/* Rules Panel */}
      <RulesPanel>
        {systemMessage}
      </RulesPanel>
    </div>
  );
}