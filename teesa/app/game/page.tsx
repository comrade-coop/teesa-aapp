'use client';

import { sendMessage } from './_actions/send-message';
import { MessageUiStateModel } from './_models/message-ui-state-model';
import { UserChatMessage } from './_components/user-chat-message';
import { getLocaleClient, getTimestamp } from '@/lib/utils';
import { MessagesList } from './_components/messages-list';
import { useEffect, useState } from 'react';
import { BottomPanel } from './_components/bottom-panel';
import { getMessages } from './_actions/get-messages';
import { LlmChatMessage } from './_components/llm-chat-message';
import { v4 as uuidv4 } from 'uuid';
import { MessageTabs } from './_components/message-tabs';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { SidePanel } from './_components/side-panel';
import { PaymentErrorChatMessage } from './_components/payment-error-chat-message';
import { getGameState } from './_actions/get-game-state';
import { processPayment } from './_actions/process-payment';
import { ProcessPaymentResult } from './_actions/process-payment';
import { getContractInfo } from './_actions/get-contract-info';
import { getEnvironments } from '../_actions/get-environments';

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [messages, setMessages] = useState<MessageUiStateModel[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);
  const [showAllMessages, setShowAllMesssages] = useState<boolean>(true);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [winnerAddress, setWinnerAddress] = useState<string | undefined>(undefined);
  const [gameAbandoned, setGameAbandoned] = useState<boolean>(false);
  const [prizePool, setPrizePool] = useState<string>('0');
  const [currentFee, setCurrentFee] = useState<string>('0');
  const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number>(0);
  const [scrollMessagesToBottom, setScrollMessagesToBottom] = useState<boolean>(false);

  const walletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  useEffect(() => {
    if (scrollMessagesToBottom) {
      setScrollMessagesToBottom(false);
    }
  }, [scrollMessagesToBottom]);

  useEffect((() => {
    fetchGameState();
    fetchContractInfo();
    fetchNewMessages();
    fetchEnvironments();

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

    fetchGameState();
    fetchContractInfo();

    // Get new messages only if we are not showing all messages
    if (showAllMessages) {
      fetchNewMessages();
    }

    const timeoutId = setTimeout(() => {
      setLastTimestamp(getTimestamp());
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [lastTimestamp, showAllMessages]);

  async function fetchGameState() {
    const { gameEnded, winnerAddress } = await getGameState();
    setGameEnded(gameEnded);
    setWinnerAddress(winnerAddress);
  }

  async function fetchContractInfo() {
    const { prizePool, currentFee, gameAbandoned } = await getContractInfo();
    setPrizePool(prizePool);
    setCurrentFee(currentFee);
    setGameAbandoned(gameAbandoned);
  }

  async function fetchEnvironments() {
    const { gameContractAddress, chainId } = await getEnvironments();
    setContractAddress(gameContractAddress);
    setChainId(chainId);
  }

  async function fetchNewMessages() {
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

    setScrollMessagesToBottom(true);
  };

  function handleTabChange(allMessages: boolean) {
    setShowAllMesssages(allMessages);
  }

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
        <div className="w-full md:w-[512px] flex flex-col h-full order-2 md:order-1">
          <MessageTabs
            showAllMessages={showAllMessages}
            onTabChange={handleTabChange} />

          {showMessages ?
            <MessagesList
              messages={getMessagesForList()}
              scrollToBottom={scrollMessagesToBottom} />
            :
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-white">Connect your wallet to start playing</p>
            </div>}

          {ready && <BottomPanel
            className='mt-auto'
            gameEnded={gameEnded}
            winnerAddress={winnerAddress}
            isLoggedIn={authenticated}
            gameAbandoned={gameAbandoned}
            walletAddress={walletAddress}
            loading={paymentProcessing}
            onLogin={login}
            onChatMessage={hadleChatMessage} />}
        </div>

        {/* Rules Panel */}
        <SidePanel
          isLoggedIn={authenticated}
          onLogout={logout}
          prizePool={prizePool}
          currentFee={currentFee}
          contractAddress={contractAddress}
          chainId={chainId}
          className="order-1 md:order-3" />
      </div>
    </div>
  );
}