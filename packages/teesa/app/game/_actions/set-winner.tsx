import 'server-only';
import { PRIZE_AWARDED_MESSAGE, TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE } from '@/app/_core/game-const';
import { MessageTypeEnum } from '@/app/_core/message-type-enum';
import { retryWithExponentialBackoff } from '@/lib/server-utils';
import { generateNft } from '@teesa-monorepo/nft/src/generate-nft';
import { v4 as uuidv4 } from 'uuid';
import { AnswerResultEnum, gameState, HistoryEntry, resetState } from '../../_core/game-state';
import { getNetwork } from '@teesa-monorepo/nft/src/networks';
import { getNftContractAddress } from '@teesa-monorepo/nft/src/get-nft-contract-address';

export function setWinner(userId: string, userAddress: string, timestamp: number) {
  gameState.setWinner(userAddress);

  if (process.env.ENV_MODE === 'dev') {
    console.log(`DEV MODE: NFT sent to user ${userAddress}`);
    onGenerateNftSuccess(userId, timestamp, '0');
    return;
  }

  console.log('Winner address:', userAddress);

  // Generate NFT and send it to the user
  retryWithExponentialBackoff(
    () => generateNft(userAddress, gameState.getId(), gameState.getSecretWord()),
    (nftId) => onGenerateNftSuccess(userId, timestamp, nftId),
    (attempt) => onGenerateNftFailure(attempt, userId, timestamp)
  );
}

async function onGenerateNftSuccess(userId: string, timestamp: number, nftId: string) {
  await gameState.setNftId(nftId);

  const network = getNetwork();
  const contractAddress = getNftContractAddress();
  const nftUrl = `${network.openseaUrl}/${contractAddress}/${nftId}`;

  const message: HistoryEntry = {
    id: uuidv4(),
    userId: userId,
    timestamp: timestamp + 1000,
    messageType: MessageTypeEnum.SYSTEM,
    userMessage: undefined,
    llmMessage: `${PRIZE_AWARDED_MESSAGE}${nftUrl}`,
    answerResult: AnswerResultEnum.UNKNOWN
  };

  await gameState.addToHistory(message);

  restartGame();
}

async function onGenerateNftFailure(attempt: number, userId: string, timestamp: number) {
  if (attempt > 1) {
    return;
  }

  const message: HistoryEntry = {
    id: uuidv4(),
    userId: userId,
    timestamp: timestamp + 2000,
    messageType: MessageTypeEnum.SYSTEM,
    userMessage: undefined,
    llmMessage: TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE,
    answerResult: AnswerResultEnum.UNKNOWN
  };

  gameState.addToHistory(message);
}

function restartGame() {
  let timeToRestart = 30 * 60 * 1000; // 30 minutes
  if (process.env.ENV_MODE === 'dev') {
    timeToRestart = 10 * 1000; // 10 seconds
  }

  // Timeout before starting
  setTimeout(async () => {
    console.log('Restarting game');
    await resetState();
  }, timeToRestart);
}