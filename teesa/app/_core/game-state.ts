import 'server-only'
import { Mutex } from 'async-mutex';
import { wordsList } from './words-list';

export interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: number;
  userMessage: string | undefined;
  llmMessage: string
}

class GameState {
  private secretWord: string;
  private history: HistoryEntry[];
  private gameEnded: boolean;
  private winnerAddress: string | undefined;

  private mutex: Mutex;

  constructor() {
    this.mutex = new Mutex();

    this.secretWord = process.env.NEXT_PUBLIC_ENV_MODE === 'dev' 
      ? 'car' 
      : this.selectRandomWord();
      
    this.history = [];
    this.gameEnded = false;
    this.winnerAddress = undefined;
  }

  private selectRandomWord(): string {
    const randomIndex = Math.floor(Math.random() * wordsList().length);
    return wordsList()[randomIndex];
  }

  async getSecretWord(): Promise<string> {
    return this.secretWord;
  }

  async getHistory(): Promise<HistoryEntry[]> {
    return this.history;
  }

  async addToHistory(message: HistoryEntry): Promise<any> {
    await this.mutex.runExclusive(() => {
      this.history.push(message);
    });
  }

  async getGameEnded(): Promise<boolean> {
    return this.gameEnded;
  }

  async getWinnerAddress(): Promise<string | undefined> {
    return this.winnerAddress;
  }

  async setWinner(winnerAddress: string): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.winnerAddress = winnerAddress;
      this.gameEnded = true;
    });
  }
}

export const gameState = new GameState();