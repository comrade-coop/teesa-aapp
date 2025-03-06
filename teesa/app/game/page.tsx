'use client';

import { getLocaleClient, getTimestamp, stringIsNullOrEmpty } from '@/lib/utils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getEnvironments } from '../_actions/get-environments';
import { InputTypeEnum } from '../_core/input-type-enum';
import { checkMessageType } from './_actions/check-message-type';
import { generateSummary } from './_actions/generate-summary';
import { getContractInfo } from './_actions/get-contract-info';
import { getGameState } from './_actions/get-game-state';
import { getMessages } from './_actions/get-messages';
import { processPayment, ProcessPaymentResult } from './_actions/process-payment';
import { sendMessage } from './_actions/send-message';
import { BottomPanel } from './_components/bottom-panel';
import { LlmChatMessage } from './_components/llm-chat-message';
import { MessageTabs } from './_components/message-tabs';
import { MessagesList } from './_components/messages-list';
import { PaymentErrorChatMessage } from './_components/payment-error-chat-message';
import { SidePanel } from './_components/side-panel';
import { UserChatMessage } from './_components/user-chat-message';
import { WorldSummary } from './_components/world-summary';
import { MessageUiStateModel } from './_models/message-ui-state-model';

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [messages, setMessages] = useState<MessageUiStateModel[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);
  const [showAllMessages, setShowAllMesssages] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [winnerAddress, setWinnerAddress] = useState<string | undefined>(undefined);
  const [gameAbandoned, setGameAbandoned] = useState<boolean>(false);
  const [prizePool, setPrizePool] = useState<string>('0');
  const [currentFee, setCurrentFee] = useState<string>('0');
  const [prizePoolUsdc, setPrizePoolUsdc] = useState<string>('0');
  const [currentFeeUsdc, setCurrentFeeUsdc] = useState<string>('0');
  const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number>(0);
  const [scrollMessagesToBottom, setScrollMessagesToBottom] = useState<boolean>(false);
  const [worldSummary, setWorldSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  // Used to refresh the page when the game is restarted
  const [currentGameContractAddress, setCurrentGameContractAddress] = useState<string | undefined>(undefined);

  const router = useRouter();

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
    updateWorldSummary();
    checkGameRestarted();

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

    if (gameEnded) {
      setShowAllMesssages(true);
    }
  }

  async function fetchContractInfo() {
    const { prizePool, currentFee, prizePoolUsdc, currentFeeUsdc, gameAbandoned } = await getContractInfo();
    setPrizePool(prizePool);
    setCurrentFee(currentFee);
    setPrizePoolUsdc(prizePoolUsdc);
    setCurrentFeeUsdc(currentFeeUsdc);
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
    const newMessagesAsUiState = newMessages.filter(f => messagesIds.indexOf(f.id) == -1).map(m => {
      // Standart chat messages
      if (m.userMessage) {
        return {
          id: m.id,
          userId: m.userId,
          timestamp: m.timestamp,
          display: <>
            <UserChatMessage timestamp={m.timestamp} locale={getLocaleClient()} message={m.userMessage} userAddress={m.userId} />
            <LlmChatMessage message={m.llmMessage} />
          </>
        };
      }

      // LLM only messages
      return {
        id: m.id,
        userId: m.userId,
        timestamp: m.timestamp,
        display: <>
          <LlmChatMessage message={m.llmMessage} />
        </>
      };
    });

    if (newMessagesAsUiState.length > 0) {
      setMessages(previousMessages => [
        ...previousMessages,
        ...newMessagesAsUiState
      ]);
    }
  };

  async function updateWorldSummary() {
    if (isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    try {
      const summary = await generateSummary();
      setWorldSummary(summary);
    } catch (error) {
      console.error('Error updating summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  }

  async function checkGameRestarted() {
    const { gameContractAddress } = await getEnvironments();

    if (!stringIsNullOrEmpty(gameContractAddress) && currentGameContractAddress != gameContractAddress) {
      if (currentGameContractAddress != undefined) {
        console.log('Game restarted');
        window.location.reload();
      }

      setCurrentGameContractAddress(gameContractAddress);
    }
  }

  async function hadleChatMessage(message: string) {
    if (!walletAddress) {
      return;
    }

    setShowAllMesssages(false);

    const { gameEnded } = await getGameState();
    if (gameEnded) {
      return;
    }

    setLoading(true);

    const [messageWithFixedSpelling, inputType] = await checkMessageType(message);

    if (inputType == InputTypeEnum.GUESS) {
      const paymentResult = await processPayment(walletAddress, wallets);

      setLoading(false);

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
    } else {
      setLoading(false);
    }

    const id = uuidv4();
    const timestamp = getTimestamp();
    const response = await sendMessage(walletAddress, id, timestamp, messageWithFixedSpelling, inputType);

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
    // On some test environments, we were experiencing duplicate messages.
    // This is a fix to remove duplicates.
    const uniqueMessages = messages.reduce((acc, current) => {
      const exists = acc.find(item => item.id === current.id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof messages);

    if (showAllMessages) {
      return uniqueMessages.sort((a, b) => a.timestamp - b.timestamp);
    }

    return uniqueMessages.filter(m => m.userId == walletAddress).sort((a, b) => a.timestamp - b.timestamp);
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

          {showMessages ? (
            <>
              <div className="flex-1 overflow-hidden flex flex-col">
                <MessagesList
                  messages={getMessagesForList()}
                  showingAllMessages={showAllMessages}
                  scrollToBottom={scrollMessagesToBottom} />

                <WorldSummary
                  summary={worldSummary}
                  className="mx-4 my-2"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-white">Connect your wallet to start playing</p>
            </div>
          )}

          {ready && <BottomPanel
            className='mt-auto'
            gameEnded={gameEnded}
            winnerAddress={winnerAddress}
            isLoggedIn={authenticated}
            gameAbandoned={gameAbandoned}
            loading={loading}
            onLogin={login}
            onChatMessage={hadleChatMessage} />}
        </div>

        {/* Rules Panel */}
        <SidePanel
          isLoggedIn={authenticated}
          onLogout={logout}
          prizePool={prizePool}
          currentFee={currentFee}
          prizePoolUsdc={prizePoolUsdc}
          currentFeeUsdc={currentFeeUsdc}
          contractAddress={contractAddress}
          chainId={chainId}
          className="order-1 md:order-3" />
      </div>
    </div>
  );
}