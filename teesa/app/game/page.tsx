'use client';

import { getLocaleClient, getTimestamp, stringIsNullOrEmpty } from '@/lib/utils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getEnvironments } from '../_actions/get-environments';
import { MessageTypeEnum } from '../_core/message-type-enum';
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
import { WordSummary } from './_components/word-summary';
import { MessageUiStateModel } from './_models/message-ui-state-model';

// Add Ethereum provider interface
interface EthereumProvider {
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
  request(args: { method: string, params?: any[] }): Promise<any>;
}

// Extend Window interface
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [messages, setMessages] = useState<MessageUiStateModel[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(undefined);
  const [showAllMessages, setShowAllMesssages] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [previousGameEnded, setPreviousGameEnded] = useState<boolean>(false);
  const [winnerAddress, setWinnerAddress] = useState<string | undefined>(undefined);
  const [gameAbandoned, setGameAbandoned] = useState<boolean>(false);
  const [prizePool, setPrizePool] = useState<string>('0');
  const [currentFee, setCurrentFee] = useState<string>('0');
  const [prizePoolUsdc, setPrizePoolUsdc] = useState<string>('0');
  const [currentFeeUsdc, setCurrentFeeUsdc] = useState<string>('0');
  const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number>(0);
  const [scrollMessagesToBottom, setScrollMessagesToBottom] = useState<boolean>(false);
  const [wordSummary, setWordSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null);
  const previousAuthState = useRef<boolean | null>(null);

  // Used to refresh the page when the game is restarted
  const [currentGameContractAddress, setCurrentGameContractAddress] = useState<string | undefined>(undefined);

  const router = useRouter();

  const walletAddress = (ready && authenticated) ? user?.wallet?.address : undefined;

  // Initialize or retrieve anonymous user ID from local storage
  useEffect(() => {
    // Only run this on the client side
    if (typeof window !== 'undefined') {
      // Try to get the anonymous ID from localStorage
      const storedAnonymousId = localStorage.getItem('anonymousUserId');
      
      if (storedAnonymousId) {
        setAnonymousUserId(storedAnonymousId);
      } else {
        // Create a new anonymous ID and store it
        const newAnonymousId = `0xanon-${uuidv4().substring(0, 8)}`;
        localStorage.setItem('anonymousUserId', newAnonymousId);
        setAnonymousUserId(newAnonymousId);
      }
    }
  }, []);

  useEffect(() => {
    if (scrollMessagesToBottom) {
      setScrollMessagesToBottom(false);
    }
  }, [scrollMessagesToBottom]);

  // Add effect to detect when wallet is disconnected manually (outside the app)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Listen for account changes in MetaMask
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0 && authenticated) {
          // MetaMask was disconnected manually
          console.log('MetaMask disconnected externally');
          // Force logout in Privy to sync the state
          logout();
        }
      };

      const ethereum = window.ethereum;
      ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Periodically check if the wallet is still connected
      const checkWalletConnection = async () => {
        if (authenticated && ethereum) {
          try {
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) {
              console.log('Wallet disconnected but app state not updated');
              logout();
            }
          } catch (err) {
            console.error('Error checking wallet connection:', err);
          }
        }
      };
      
      // Check every 10 seconds
      const intervalId = setInterval(checkWalletConnection, 10000);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        clearInterval(intervalId);
      };
    }
  }, [authenticated, logout]);

  // Add effect to track wallet authentication changes
  useEffect(() => {
    if (!ready) return; // Skip if not ready yet
    
    // If this is the first time the component mounts, just store the current auth state
    if (previousAuthState.current === null) {
      previousAuthState.current = authenticated;
      return;
    }
    
    // If user just disconnected their wallet (was authenticated, now is not)
    if (previousAuthState.current === true && authenticated === false) {
      if (typeof window !== 'undefined') {
        // Create a new anonymous ID when user disconnects
        const newAnonymousId = `0xanon-${uuidv4().substring(0, 8)}`;
        localStorage.setItem('anonymousUserId', newAnonymousId);
        setAnonymousUserId(newAnonymousId);
      }
    }
    
    // Update previous state
    previousAuthState.current = authenticated;
  }, [authenticated, ready]);

  useEffect((() => {
    fetchGameState();
    fetchContractInfo();
    fetchNewMessages();
    fetchEnvironments();
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
    fetchContractInfo();
    updateWordSummary();
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

  // Add new useEffect hook to watch gameEnded state changes
  useEffect(() => {
    if (gameEnded) {
      // Clear messages when the current game ends
      const timeoutId = setTimeout(() => {
        setMessages([]);
      }, 10000); // Clear messages after 10 seconds to let the user see who won
      
      return () => clearTimeout(timeoutId);
    }
  }, [gameEnded]);

  useEffect(() => {
    if (authenticated && walletAddress) {
      // Remove the wallet connection system message when the user connects
      setMessages((prevMessages: MessageUiStateModel[]) => 
        prevMessages.filter(msg => {
          // Check if this is a system message with a login button
          const msgAny = msg as any;
          
          // First check if it has isSystemMessage flag (not in interface but used in code)
          if (msgAny.isSystemMessage === true) {
            // Then check if it contains a connect wallet button
            if (msg.display && typeof msg.display === 'object') {
              const displayProps = (msg.display as any).props;
              const hasConnectWalletButton = 
                displayProps?.className?.includes('bg-blue-900/30') && 
                displayProps?.children?.some?.((child: any) => 
                  child?.props?.onClick?.toString?.().includes('login')
                );
              
              return !hasConnectWalletButton;
            }
          }
          
          return true;
        })
      );
    }
  }, [authenticated, walletAddress]);

  async function fetchGameState() {
    const { gameEnded, winnerAddress } = await getGameState();
    
    // Check if transitioning from ended game to new game
    if (previousGameEnded && !gameEnded) {
      console.log('New game started after previous game ended');
      setMessages([]);
    }
    
    setPreviousGameEnded(gameEnded);
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

  async function checkGameRestarted() {
    const { gameContractAddress } = await getEnvironments();

    if (!stringIsNullOrEmpty(gameContractAddress) && currentGameContractAddress != gameContractAddress) {
      if (currentGameContractAddress != undefined) {
        console.log('Game restarted');
        // Clear messages when game restarts
        setMessages([]);
        window.location.reload();
      }

      setCurrentGameContractAddress(gameContractAddress);
    }
  }

  async function hadleChatMessage(message: string) {
    // Use stored anonymous ID if wallet is not connected
    const userId = walletAddress || anonymousUserId || `0xanon-${uuidv4().substring(0, 8)}`;

    const { gameEnded } = await getGameState();
    if (gameEnded) {
      return;
    }

    // Truncate message to 256 symbols before processing
    const truncatedMessage = message;

    setLoading(true);

    const [messageWithFixedSpelling, inputType] = await checkMessageType(truncatedMessage);

    // If user is trying to make a guess but isn't authenticated, show prompt to connect wallet
    if (inputType == MessageTypeEnum.GUESS && !walletAddress) {
      setLoading(false);
      
      // Add a message prompting the user to connect their wallet to guess
      setMessages(previousMessages => [
        ...previousMessages,
        {
          id: uuidv4(),
          userId: userId,
          timestamp: getTimestamp(),
          isSystemMessage: true,
          display: (
            <div className="p-4 my-2 bg-blue-900/30 border border-blue-500/50 rounded-lg">
              <p className="text-white mb-3">🌟 To make a guess and compete for the prize pool, you need to connect your wallet first.</p>
              <button
                onClick={() => login()}
                className="w-full p-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-xl hover:opacity-90 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:from-blue-500 hover:to-blue-600 relative"
              >
                Connect Wallet
              </button>
            </div>
          )
        }
      ]);
      return;
    }

    if (inputType == MessageTypeEnum.GUESS && walletAddress) {
      const paymentResult = await processPayment(walletAddress, wallets);

      setLoading(false);

      if (paymentResult != ProcessPaymentResult.Success) {
        setMessages(previousMessages => [
          ...previousMessages,
          {
            id: uuidv4(),
            userId: userId,
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
    const response = await sendMessage(userId, id, timestamp, messageWithFixedSpelling, inputType);

    setMessages(previousMessages => [
      ...previousMessages,
      {
        id: id,
        userId: userId,
        timestamp: timestamp,
        display: response
      }
    ]);
    
    // Update the word summary after sending a message
    updateWordSummary();
    
    setScrollMessagesToBottom(true);
  };

  function handleTabChange(allMessages: boolean) {
    setShowAllMesssages(allMessages);
    
    // When switching to all messages tab, make sure to fetch latest messages and update summary
    if (allMessages) {
      fetchNewMessages();
      updateWordSummary();
    }
  }

  const showMessages = true; // Always show messages, even for unauthenticated users

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

    return uniqueMessages.filter(m => m.userId === walletAddress).sort((a, b) => a.timestamp - b.timestamp);
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

                <WordSummary
                  summary={wordSummary}
                  className="mx-4 my-2"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-white">Connect your wallet to start playing</p>
            </div>
          )}

          <BottomPanel
            className='mt-auto'
            gameEnded={gameEnded}
            winnerAddress={winnerAddress}
            isLoggedIn={authenticated}
            gameAbandoned={gameAbandoned}
            loading={loading}
            onLogin={login}
            onChatMessage={hadleChatMessage} />
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