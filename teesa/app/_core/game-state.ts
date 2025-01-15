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
  private winnersAddresses: string[];

  private mutex: Mutex;

  constructor() {
    this.secretWord = process.env.NEXT_PUBLIC_ENV_MODE === 'dev' 
      ? 'car' 
      : this.selectRandomWord();
      
    this.history = [];
    this.gameEnded = false;
    this.mutex = new Mutex();
    this.winnersAddresses = [];
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

  async addWinnerAddress(winnerAddress: string): Promise<any> {
    await this.mutex.runExclusive(() => {
      this.gameEnded = true;
      this.winnersAddresses.push(winnerAddress);
    });
  }

  async getWinnersAddresses(): Promise<string[]> {
    return this.winnersAddresses;
  }

}

export const gameState = new GameState();