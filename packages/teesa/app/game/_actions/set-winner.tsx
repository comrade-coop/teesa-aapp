import 'server-only';
import { PRIZE_AWARDED_MESSAGE, TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE } from '@/app/_core/game-const';
import { retryWithExponentialBackoff } from '@/lib/server-utils';
import { v4 as uuidv4 } from 'uuid';
import { AnswerResultEnum, gameState, HistoryEntry, resetState } from '../../_core/game-state';
import { MessageTypeEnum } from '@/app/_core/message-type-enum';

export function setWinner(userId: string, userAddress: string, timestamp: number) {
  gameState.setWinner(userAddress);

  if (process.env.ENV_MODE === 'dev') {
    console.log(`DEV MODE: NFT minted to user ${userId}`);
    onMintNftSuccess(userId, timestamp);
    return;
  }

  console.log('Winner address:', userAddress);

  retryWithExponentialBackoff(
    () => mintNft(userAddress),
    () => onMintNftSuccess(userId, timestamp),
    (attempt) => onMintNftFailure(attempt, userId, timestamp)
  );
}

async function mintNft(userAddress: string) {
  await new Promise(resolve => setTimeout(resolve, 10000));
  return
}


async function onMintNftSuccess(userId: string, timestamp: number) {
  const message: HistoryEntry = {
    id: uuidv4(),
    userId: userId,
    timestamp: timestamp + 1000,
    messageType: MessageTypeEnum.SYSTEM,
    userMessage: undefined,
    llmMessage: PRIZE_AWARDED_MESSAGE,
    answerResult: AnswerResultEnum.UNKNOWN
  };

  await gameState.addToHistory(message);

  restartGame();
}

async function onMintNftFailure(attempt: number, userId: string, timestamp: number) {
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
  let timeToRestart = 5 * 60 * 1000; // 5 minutes
  if (process.env.ENV_MODE === 'dev') {
    timeToRestart = 10 * 1000; // 10 seconds
  }

  // Timeout before starting
  setTimeout(async () => {
    console.log('Restarting game');
    await resetState();
  }, timeToRestart);
}