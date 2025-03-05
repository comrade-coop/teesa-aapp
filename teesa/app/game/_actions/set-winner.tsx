import 'server-only';
import { PRIZE_AWARDED_MESSAGE, TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE } from '@/app/_core/game-const';
import { retryWithExponentialBackoff } from '@/lib/server-utils';
import { v4 as uuidv4 } from 'uuid';
import { executeContractActionServer } from '../../_contracts/execute-contract-action-server';
import { gameState, HistoryEntry } from '../../_core/game-state';
import { transferTeesaFundsToContract } from './transfer-teesa-funds-to-contract';

export function setWinner(userAddress: string, timestamp: number) {
  if (process.env.NEXT_PUBLIC_ENV_MODE === 'dev') {
    console.log('DEV MODE: Winner added:', userAddress);
    console.log('DEV MODE: Prize awarded');

    addAwardPrizeSuccessMessage(userAddress, timestamp);

    return;
  }

  console.log('Setting winner:', userAddress);

  retryWithExponentialBackoff(
    () => executeContractActionServer('setWinner', [userAddress]),
    () => awardPrize(userAddress, timestamp),
    (attempt) => onSetWinnerFailure(attempt, userAddress, timestamp)
  );
}

async function onSetWinnerFailure(attempt: number, userAddress: string, timestamp: number) {
  if (attempt > 1) {
    return;
  }

  const message: HistoryEntry = {
    id: uuidv4(),
    userId: userAddress,
    timestamp: timestamp + 1000,
    userMessage: undefined,
    llmMessage: TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE
  };

  gameState.addToHistory(message);
}

async function awardPrize(userAddress: string, timestamp: number) {
  console.log('Awarding prize');

  retryWithExponentialBackoff(
    () => executeContractActionServer('awardPrize', []),
    () => onAwardPrizeSuccess(userAddress, timestamp)
  );
}

async function onAwardPrizeSuccess(userAddress: string, timestamp: number) {
  await addAwardPrizeSuccessMessage(userAddress, timestamp);

  transferTeesaFundsToContract();
}

async function addAwardPrizeSuccessMessage(userAddress: string, timestamp: number) {
  const message: HistoryEntry = {
    id: uuidv4(),
    userId: userAddress,
    timestamp: timestamp + 1000,
    userMessage: undefined,
    llmMessage: PRIZE_AWARDED_MESSAGE
  };

  gameState.addToHistory(message);
}