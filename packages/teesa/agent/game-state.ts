import 'server-only';

import { Mutex } from 'async-mutex';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { wordsList } from './words-list';

const STATE_FILE_PATH = process.env.DOCKER_CLOUD_VOLUME_PATH ? 
                          path.join(process.env.DOCKER_CLOUD_VOLUME_PATH, "game-state.json") : 
                          path.join(process.cwd(), "game-state.json");

// Define possible answer results
export enum AnswerResultEnum {
  YES,
  NO,
  UNKNOWN
}

export interface Question {
  question: string;
  answer: AnswerResultEnum;
}

export enum AgentClientsEnum {
  WEB,
  TWITTER
}

export interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: number;
  agentClient: AgentClientsEnum;
  userMessage: string | undefined;
  llmMessage: string;
}

interface GameStateData {
  id: string;
  secretWord: string;
  history: HistoryEntry[];
  questions: Question[];
  incorrectGuesses: string[];
  gameEnded: boolean;
  winnerAddress: string | undefined;
  nftId: string | undefined;
}

class GameState {
  private mutex: Mutex;

  private id: string;
  private secretWord: string;
  private history: HistoryEntry[];
  private questions: Question[];
  private incorrectGuesses: string[];
  private gameEnded: boolean;
  private winnerAddress: string | undefined;
  private nftId: string | undefined;

  constructor() {
    this.mutex = new Mutex();

    // Load state from file or initialize new state
    const state = this.loadState();
    this.id = state.id;
    this.secretWord = state.secretWord;
    this.history = state.history;
    this.questions = state.questions;
    this.incorrectGuesses = state.incorrectGuesses;
    this.gameEnded = state.gameEnded;
    this.winnerAddress = state.winnerAddress;
    this.nftId = state.nftId;
  }

  private loadState(): GameStateData {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }

    // Create default state
    const defaultState = this.createDefaultState();

    return defaultState;
  }

  private createDefaultState(): GameStateData {
    return {
      id: uuidv4(),
      secretWord: process.env.ENV_MODE === 'dev' ? 'car' : this.selectRandomWord(),
      history: [],
      questions: [],
      incorrectGuesses: [],
      gameEnded: false,
      winnerAddress: undefined,
      nftId: undefined
    };
  }

  async saveState(): Promise<void> {
    try {
      const state: GameStateData = {
        id: this.id,
        secretWord: this.secretWord,
        history: this.history,
        questions: this.questions,
        incorrectGuesses: this.incorrectGuesses,
        gameEnded: this.gameEnded,
        winnerAddress: this.winnerAddress,
        nftId: this.nftId
      };
      await fs.promises.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }

  private selectRandomWord(): string {
    const randomIndex = Math.floor(Math.random() * wordsList().length);
    return wordsList()[randomIndex];
  }

  getId(): string {
    return this.id;
  }

  getSecretWord(): string {
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

  async getQuestions(): Promise<Question[]> {
    return this.questions;
  }

  async addQuestion(question: Question): Promise<any> {
    await this.mutex.runExclusive(async () => {
      this.questions.push(question);
      await this.saveState();
    });
  }

  async getIncorrectGuesses(): Promise<string[]> {
    return this.incorrectGuesses;
  }

  async addIncorrectGuess(guess: string): Promise<any> {
    await this.mutex.runExclusive(async () => {
      this.incorrectGuesses.push(guess);
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

  async getNftId(): Promise<string | undefined> {
    return this.nftId;
  }

  async setNftId(nftId: string): Promise<void> {
    await this.mutex.runExclusive(async () => {
      this.nftId = nftId;
      await this.saveState();
    });
  }

  async reset() {
    // Delete the state file first
    if (fs.existsSync(STATE_FILE_PATH)) {
      await fs.promises.unlink(STATE_FILE_PATH);
    }

    const defaultState = this.createDefaultState();
    this.id = defaultState.id;
    this.secretWord = defaultState.secretWord;
    this.history = defaultState.history;
    this.questions = defaultState.questions;
    this.incorrectGuesses = defaultState.incorrectGuesses;
    this.gameEnded = defaultState.gameEnded;
    this.winnerAddress = defaultState.winnerAddress;
    this.nftId = defaultState.nftId;

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