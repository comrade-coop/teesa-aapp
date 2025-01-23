import 'server-only'
import { Mutex } from 'async-mutex';
import { wordsList } from './words-list';

export interface LlmMessage {
  id: string;
  userId: string;
  timestamp: number;
  userMessage: string;
  llmMessage: string
}

class GameState {
  private secretWord: string;
  private history: LlmMessage[];
  private gameEnded: boolean;
  private winnerAddress: string | undefined;
  private gameAbandoned: boolean;

  private mutex: Mutex;

  constructor() {
    this.mutex = new Mutex();

    this.secretWord = process.env.NEXT_PUBLIC_ENV_MODE === 'dev' 
      ? 'car' 
      : this.selectRandomWord();
      
    this.history = [];
    this.gameEnded = false;
    this.gameAbandoned = false;
    this.winnerAddress = undefined;
  }

  private selectRandomWord(): string {
    const randomIndex = Math.floor(Math.random() * wordsList().length);
    return wordsList()[randomIndex];
  }

  async getSecretWord(): Promise<string> {
    return this.secretWord;
  }

  async getHistory(): Promise<LlmMessage[]> {
    return this.history;
  }

  async addToHistory(message: LlmMessage): Promise<any> {
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

  async getGameAbandoned(): Promise<boolean> {
    return this.gameAbandoned;
  }

  async setGameAbandoned(): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.gameAbandoned = true;
      this.gameEnded = true;
    });
  }
}

export const gameState = new GameState();