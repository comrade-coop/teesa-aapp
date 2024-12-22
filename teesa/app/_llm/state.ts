import 'server-only'
import { Mutex } from 'async-mutex';
import { wordsList } from './words-list';

export class LlmMessage {
  constructor(
    public userId: string,
    public timestamp: number,
    public role: 'user' | 'assistant',
    public content: string
  ) { }
}

class LlmState {
  private secretWord: string;
  private history: LlmMessage[];
  private gameEnded: boolean;

  private mutex: Mutex;

  constructor() {
    this.secretWord = this.selectRandomWord();
    this.history = [];
    this.gameEnded = false
    this.mutex = new Mutex();
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

  async addToHistory(userMessage: LlmMessage, assistantMessage: LlmMessage): Promise<any> {
    await this.mutex.runExclusive(() => {
      this.history.push(userMessage);
      this.history.push(assistantMessage);
    });
  }

  async getGameEnded(): Promise<boolean> {
    return this.gameEnded;
  }

  async setGameEnded(): Promise<any> {
    await this.mutex.runExclusive(() => {
      this.gameEnded = true;
    });
  }

}

export const llmState = new LlmState();