'use client';

import { getLocaleClient, getTimestamp } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageTypeEnum } from '../_core/message-type-enum';
import { checkMessageType } from './_actions/check-message-type';
import { generateSummary } from './_actions/generate-summary';
import { getGameState } from './_actions/get-game-state';
import { getMessages } from './_actions/get-messages';
import { getNftDetails } from './_actions/get-nft-details';
import { sendMessage } from './_actions/send-message';
import { BottomPanel } from './_components/bottom-panel';
import { LlmChatMessage } from './_components/llm-chat-message';
import { MessageTabs } from './_components/message-tabs';
import { MessagesList } from './_components/messages-list';
import { SidePanel } from './_components/side-panel';
import { UserChatMessage } from './_components/user-chat-message';
import { WordSummary } from './_components/word-summary';
import { MessageUiStateModel } from './_models/message-ui-state-model';

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [messages, setMessages] = useState<MessageUiStateModel[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);
  const [showAllMessages, setShowAllMesssages] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [winnerAddress, setWinnerAddress] = useState<string | undefined>(undefined);
  const [blockchainName, setBlockchainName] = useState<string>('');
  const [blockchainExplorerUrl, setBlockchainExplorerUrl] = useState<string>('');
  const [openseaUrl, setOpenseaUrl] = useState<string>('');
  const [scrollMessagesToBottom, setScrollMessagesToBottom] = useState<boolean>(false);
  const [wordSummary, setWordSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [anonymousUserId, setAnonymousUserId] = useState<string | undefined>(undefined);
  const [showConnectWalletMessage, setShowConnectWalletMessage] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | undefined>(undefined); // Used to refresh the page when the game is restarted

  const walletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  // Initialize or retrieve anonymous user ID from local storage
  useEffect(() => {
    const ANONYMOUS_USER_ID_KEY = 'anonymousUserId';

    // Try to get the anonymous ID from localStorage
    const storedAnonymousId = localStorage.getItem(ANONYMOUS_USER_ID_KEY);

    if (storedAnonymousId) {
      setAnonymousUserId(storedAnonymousId);
    } else {
      // Create a new anonymous ID and store it
      const newAnonymousId = `0xanon-${uuidv4().substring(0, 8)}`;
      localStorage.setItem(ANONYMOUS_USER_ID_KEY, newAnonymousId);
      setAnonymousUserId(newAnonymousId);
    }
  }, []);

  useEffect(() => {
    if (walletAddress && showConnectWalletMessage) {
      setShowConnectWalletMessage(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (scrollMessagesToBottom) {
      setScrollMessagesToBottom(false);
    }
  }, [scrollMessagesToBottom]);

  useEffect((() => {
    fetchGameState();
    fetchNftDetails();
    fetchNewMessages();
    updateWordSummary();

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

    // Get new messages only if we are showing all messages
    if (showAllMessages) {
      fetchNewMessages();
    }

    const timeoutId = setTimeout(() => {
      setLastTimestamp(getTimestamp());
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [lastTimestamp, showAllMessages]);

  async function fetchGameState() {
    const { id, gameEnded, winnerAddress } = await getGameState();

    setGameEnded(gameEnded);
    setWinnerAddress(winnerAddress);

    if (gameEnded) {
      setShowAllMesssages(true);
    }

    checkGameRestarted(id);
  }

  function checkGameRestarted(currentGameId: string) {
    if (gameId != currentGameId) {
      if (gameId != undefined) {
        console.log('Game restarted');
        window.location.reload();
      }

      setGameId(currentGameId);
    }
  }

  async function fetchNftDetails() {
    const { name, explorerUrl, openseaUrl } = await getNftDetails();
    setBlockchainName(name);
    setBlockchainExplorerUrl(explorerUrl);
    setOpenseaUrl(openseaUrl);
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
            <UserChatMessage timestamp={m.timestamp} locale={getLocaleClient()} message={m.userMessage} userId={m.userId} />
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

      // Update the word summary whenever new messages are received
      updateWordSummary();
    }
  };

  async function updateWordSummary() {
    if (isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    try {
      // The server-side function now handles caching based on message count
      const summary = await generateSummary();
      setWordSummary(summary);
    } catch (error) {
      console.error('Error updating summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  }

  async function hadleChatMessage(message: string) {
    const { gameEnded } = await getGameState();
    if (gameEnded) {
      return;
    }

    setLoading(true);

    const inputType = await checkMessageType(message);

    // If user is trying to make a guess but isn't authenticated, show prompt to connect wallet
    if (inputType == MessageTypeEnum.GUESS && !walletAddress) {
      setLoading(false);
      setShowConnectWalletMessage(true);

      return;
    }

    const id = uuidv4();
    const timestamp = getTimestamp();
    const response = await sendMessage(anonymousUserId!, walletAddress, id, timestamp, message, inputType);

    setMessages(previousMessages => [
      ...previousMessages,
      {
        id: id,
        userId: anonymousUserId!,
        timestamp: timestamp,
        display: response
      }
    ]);

    setLoading(false);

    // Update the word summary after sending a message
    updateWordSummary();

    setScrollMessagesToBottom(true);
  };

  function handleTabChange(allMessages: boolean) {
    setShowAllMesssages(allMessages);

    // When switching to all messages tab, make sure to fetch latest messages and update summary
    if (allMessages) {
      fetchNewMessages();
    }
  }

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

    return uniqueMessages.filter(m => m.userId === anonymousUserId).sort((a, b) => a.timestamp - b.timestamp);
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

          <div className="flex-1 overflow-hidden flex flex-col">
            <MessagesList
              messages={getMessagesForList()}
              showingAllMessages={showAllMessages}
              scrollToBottom={scrollMessagesToBottom} />

            {showConnectWalletMessage &&
              <div className="p-4 mx-4 my-2 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <p className="text-white mb-3">🌟 Connect your wallet to make a guess and win a Teesa NFT, minted directly to your wallet address!</p>
                <button
                  onClick={() => login()}
                  className="w-full p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-xl hover:opacity-90 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-blue-600 relative"
                >
                  Connect Wallet
                </button>
              </div>
            }

            <WordSummary
              summary={wordSummary}
              className="mx-4 my-2"
            />
          </div>

          {anonymousUserId &&
            <BottomPanel
              className='mt-auto'
              gameEnded={gameEnded}
              winnerAddress={winnerAddress}
              loading={loading}
              onChatMessage={hadleChatMessage} />
          }
        </div>

        {/* Rules Panel */}
        <SidePanel
          isLoggedIn={authenticated}
          onLogout={logout}
          blockchainName={blockchainName}
          blockchainExplorerUrl={blockchainExplorerUrl}
          openseaUrl={openseaUrl}
          className="order-1 md:order-3" />
      </div>
    </div>
  );
}