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

  private mutex: Mutex;

  constructor() {
    this.secretWord = this.selectRandomWord();
    this.history = [];
    this.gameEnded = false
    this.mutex = new Mutex();
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

  async setGameEnded(winnerAddress: string): Promise<any> {
    if(this.gameEnded) {
      return;
    }

    await this.mutex.runExclusive(() => {
      this.gameEnded = true;
      this.winnerAddress = winnerAddress;
    });
  }

  async getWinnerAddress(): Promise<string | undefined> {
    return this.winnerAddress;
  }

}

export const gameState = new GameState();