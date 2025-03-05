import 'server-only'
import { Mutex } from 'async-mutex';
import { wordsList } from './words-list';
import fs from 'fs';
import path from 'path';
import { getEnv } from '@/lib/environments';

export interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: number;
  userMessage: string | undefined;
  llmMessage: string
}

interface GameStateData {
  secretWord: string;
  history: HistoryEntry[];
  gameEnded: boolean;
  winnerAddress: string | undefined;
}

class GameState {
  private secretWord: string;
  private history: HistoryEntry[];
  private gameEnded: boolean;
  private winnerAddress: string | undefined;
  private mutex: Mutex;
  private stateFilePath: string;

  constructor() {
    this.mutex = new Mutex();
    this.stateFilePath = getEnv('GAME_STATE_FILE_PATH') || path.join(process.cwd(), 'game-state.json');
    
    // Load state from file or initialize new state
    const state = this.loadState();
    this.secretWord = state.secretWord;
    this.history = state.history;
    this.gameEnded = state.gameEnded;
    this.winnerAddress = state.winnerAddress;
  }

  private loadState(): GameStateData {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
    
    // Create default state
    const defaultState: GameStateData = {
      secretWord: process.env.NEXT_PUBLIC_ENV_MODE === 'dev' ? 'car' : this.selectRandomWord(),
      history: [],
      gameEnded: false,
      winnerAddress: undefined
    };

    // Create the file with default state
    try {
      fs.writeFileSync(this.stateFilePath, JSON.stringify(defaultState, null, 2));
    } catch (error) {
      console.error('Error creating game state file:', error);
    }
    
    return defaultState;
  }

  private async saveState(): Promise<void> {
    try {
      const state: GameStateData = {
        secretWord: this.secretWord,
        history: this.history,
        gameEnded: this.gameEnded,
        winnerAddress: this.winnerAddress
      };
      await fs.promises.writeFile(this.stateFilePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
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
    await this.mutex.runExclusive(async () => {
      this.history.push(message);
      await this.saveState();
    });
  }

  async getGameEnded(): Promise<boolean> {
    return this.gameEnded;
  }

  async getWinnerAddress(): Promise<string | undefined> {
    return this.winnerAddress;
  }

  async setWinner(winnerAddress: string): Promise<void> {
    await this.mutex.runExclusive(async () => {
      this.winnerAddress = winnerAddress;
      this.gameEnded = true;
      await this.saveState();
    });
  }
}

const globalState = globalThis as unknown as {
  _gameState?: GameState;
};

export const gameState = (() => {
  if (typeof window !== 'undefined') {
    throw new Error('GameState should only be used on the server');
  }

  if (!globalState._gameState) {
    globalState._gameState = new GameState();
  }
  
  return globalState._gameState;
})();