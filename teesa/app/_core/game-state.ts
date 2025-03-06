import 'server-only'
import { Mutex } from 'async-mutex';
import { wordsList } from './words-list';
import fs from 'fs';
import path from 'path';
import { getEnv } from '@/lib/environments';

const stateFilePath = getEnv('GAME_STATE_FILE_PATH') || path.join(process.cwd(), 'game-state.json');

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
  private mutex: Mutex;

  private secretWord: string;
  private history: HistoryEntry[];
  private gameEnded: boolean;
  private winnerAddress: string | undefined;

  constructor() {
    this.mutex = new Mutex();
    
    // Load state from file or initialize new state
    const state = this.loadState();
    this.secretWord = state.secretWord;
    this.history = state.history;
    this.gameEnded = state.gameEnded;
    this.winnerAddress = state.winnerAddress;
  }

  private loadState(): GameStateData {
    try {
      if (fs.existsSync(stateFilePath)) {
        const data = fs.readFileSync(stateFilePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
    
    // Create default state
    const defaultState = this.createDefaultState();

    // Create the file with default state
    try {
      fs.writeFileSync(stateFilePath, JSON.stringify(defaultState, null, 2));
    } catch (error) {
      console.error('Error creating game state file:', error);
    }
    
    return defaultState;
  }

  private createDefaultState(): GameStateData {
    return {
      secretWord: process.env.NEXT_PUBLIC_ENV_MODE === 'dev' ? 'car' : this.selectRandomWord(),
      history: [],
      gameEnded: false,
      winnerAddress: undefined
    };
  }

  async saveState(): Promise<void> {
    try {
      const state: GameStateData = {
        secretWord: this.secretWord,
        history: this.history,
        gameEnded: this.gameEnded,
        winnerAddress: this.winnerAddress
      };
      await fs.promises.writeFile(stateFilePath, JSON.stringify(state, null, 2));
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

  async reset() {
    // Delete the state file first
    if (fs.existsSync(stateFilePath)) {
      await fs.promises.unlink(stateFilePath);
    }
    
    const defaultState = this.createDefaultState();
    
    this.secretWord = defaultState.secretWord;
    this.history = defaultState.history;
    this.gameEnded = defaultState.gameEnded;
    this.winnerAddress = defaultState.winnerAddress;
    
    await this.saveState();
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

export async function resetState() {
  if (typeof window !== 'undefined') {
    throw new Error('GameState should only be used on the server');
  }
  
  try {
    await gameState.reset();
  } catch (error) {
    console.error('Error resetting game state:', error);
    throw error;
  }
};