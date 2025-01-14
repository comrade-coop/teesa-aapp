import 'server-only'
import { ethers } from 'ethers';
import { Mutex } from 'async-mutex';
import GameContract from '../../_contracts/Game.json';

const mutex = new Mutex();
const transactionsQueue: (() => Promise<void>)[] = [];
let isProcessing = false;
let awardPrizeTimerStarted = false;

async function processTransactionsQueue() {
  const canProcess = await mutex.runExclusive(() => {
    if (isProcessing) return false;

    isProcessing = true;
    return true;
  });

  if (!canProcess) {
    return;
  }

  try {
    while (transactionsQueue.length > 0) {
      const transaction = transactionsQueue[0];

      try {
        await transaction();
      } catch (error) {
        console.error('Transaction failed:', error);
      }
      
      await mutex.runExclusive(() => {
        transactionsQueue.shift();
      });
    }
  } finally {
    isProcessing = false;
  }
}

async function setAwardPrizeTimer() {
  const timerStarted = await mutex.runExclusive(() => {
    if (awardPrizeTimerStarted) return true;

    awardPrizeTimerStarted = true;
    return false;
  });

  if(timerStarted) {
    return;
  }

  console.log('Award prize timer started');

  setTimeout(async () => {
      try {
        await awardPrize();
      } catch (error) {
        console.error('Failed to award prize after timeout:', error);
      }
  }, 60000); // 60 seconds
}

async function awardPrize() {
  const gameContract = getGameContract();

  try {
    const awardPrizeTransaction = await gameContract.awardPrize();
    await awardPrizeTransaction.wait(1);

    console.log('Prizes awarded');
  } catch (error) {
    console.error('Error awarding prize:', error);
    throw error;
  }
}

export async function addWinner(userAddress: string) {
  return new Promise<void>((resolve, reject) => {
    const transaction = async () => {
      const gameContract = getGameContract();

      try {
        const addWinnerTransaction = await gameContract.addWinner(userAddress);
        await addWinnerTransaction.wait(1);

        console.log('Winner added:', userAddress);

        // Start the timer after we add the first winner
        await setAwardPrizeTimer();

        resolve();
      } catch (error) {
        console.error('Error adding winner:', error);
        reject(error);
      }
    };

    mutex.runExclusive(() => {
      transactionsQueue.push(transaction);
      processTransactionsQueue();
    }).catch(reject);
  });
}

function getGameContract() {
  if (!process.env.RPC_URL) {
    throw new Error('RPC_URL environment variable is not set');
  }

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, provider);
  
  const gameContract = new ethers.Contract(
    process.env.GAME_CONTRACT_ADDRESS!,
    GameContract.abi,
    wallet
  );

  return gameContract;
}