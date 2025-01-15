'use client';

import { sendMessage } from './_actions/send-message';
import { MessageUiStateModel } from './_models/message-ui-state-model';
import { UserChatMessage } from './_components/user-chat-message';
import { getLocaleClient, getTimestamp } from '@/lib/utils';
import { MessagesList } from './_components/messages-list';
import { useEffect, useState } from 'react';
import { ChatInput } from './_components/chat-input';
import { getMessages } from './_actions/get-messages';
import { LlmChatMessage } from './_components/llm-chat-message';
import { v4 as uuidv4 } from 'uuid';
import { MessageTabs } from './_components/message-tabs';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { SidePanel } from './_components/side-panel';
import { PaymentErrorChatMessage } from './_components/payment-error-chat-message';
import { getGameEnded } from './_actions/get-game-ended';
import { processPayment } from './_actions/process-payment';
import { ProcessPaymentResult } from './_actions/process-payment';

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [messages, setMessages] = useState<MessageUiStateModel[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);
  const [showAllMessages, setShowAllMesssages] = useState<boolean>(true);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [winnersAddresses, setWinnersAddresses] = useState<string[]>([]);
  const walletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  // Logout and make the user to reconnect their wallet if no wallets are found
  // We noticed an issue with the Privy.io `useWallets` hook - sometimes returns empty wallets array
  // This is a workaround to force the user to reconnect their wallet
  useEffect(() => {
    if (ready && authenticated && wallets.length == 0) {
      //logout();
    }
  }, [ready, authenticated, wallets]);

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
    if (showAllMessages) {
      getNewMessages();
    }

    const timeoutId = setTimeout(() => {
      setLastTimestamp(getTimestamp());
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [lastTimestamp, showAllMessages]);

  async function getGameEndedState() {
    const [gameEnded, winnersAddresses] = await getGameEnded();
    setGameEnded(gameEnded);
    setWinnersAddresses(winnersAddresses);
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
        <UserChatMessage timestamp={m.timestamp} locale={getLocaleClient()} message={m.userMessage} userAddress={m.userId} />
        <LlmChatMessage message={m.llmMessage} />
      </>
    }));

    setMessages(previousMessages => [
      ...previousMessages,
      ...newMessagesAsUiState
    ]);
  };

  async function hadleChatMessage(message: string) {
    if (!walletAddress) {
      return;
    }

    setShowAllMesssages(false);

    setPaymentProcessing(true);
    const paymentResult = await processPayment(walletAddress, wallets);
    setPaymentProcessing(false);

    if (paymentResult != ProcessPaymentResult.Success) {
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
            <li>You can ask questions about the word to help you guess it</li>
            <li>When making a guess, you must clearly indicate that you are attempting to guess by saying "I guess..." or "The word is..." or similar explicit statement</li>
          </ul>
        </div>
      </div>
    </>
  );

  const showMessages = (ready && authenticated) || showAllMessages;

  const getMessagesForList = () => {
    if (showAllMessages) {
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    }

    return messages.filter(m => m.userId == walletAddress).sort((a, b) => a.timestamp - b.timestamp);
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      {/* Fixed width container for chat and panel */}
      <div className="flex flex-col md:flex-row w-full h-full max-w-[1800px] mx-auto">
        {/* Main Chat Area */}
        <div className="w-full md:w-[512px] flex flex-col h-full order-2 md:order-1 px-4">
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
            winnersAddresses={winnersAddresses}
            isLoggedIn={authenticated}
            loading={paymentProcessing}
            onLogin={login}
            onChatMessage={hadleChatMessage} />}
        </div>

        {/* Rules Panel */}
        <SidePanel
          isLoggedIn={authenticated}
          onLogout={logout}
          className="order-1 md:order-3">
          {systemMessage}
        </SidePanel>
      </div>
    </div>
  );
}