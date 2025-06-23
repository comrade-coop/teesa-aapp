import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileLock } from './file-lock';
import { AgentStateData, HistoryEntry, IncorrectGuess, Question } from './types';
import { wordsList } from './words-list';

require('dotenv').config({ path: path.resolve(process.cwd(), '../../.env') });

export const STATE_FILE_PATH = process.env.DOCKER_CLOUD_VOLUME_PATH ?
  path.join(process.env.DOCKER_CLOUD_VOLUME_PATH, 'agent', 'agent-state.json') :
  path.join(process.cwd(), '../agent', 'agent-state.json');

class AgentState {
  private lastModified: number = 0;
  private fileLock: FileLock;

  private state: AgentStateData;

  constructor() {
    this.fileLock = new FileLock(STATE_FILE_PATH);

    // Load state from file or initialize new state
    this.state = this.loadState();
    this.updateLastModified();
  }

  private updateLastModified(): void {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const stats = fs.statSync(STATE_FILE_PATH);
        this.lastModified = stats.mtime.getTime();
      }
    } catch (error) {
      console.error('Error getting file stats:', error);
    }
  }

  private checkForExternalChanges(): void {
    try {
      if (fs.existsSync(STATE_FILE_PATH)) {
        const stats = fs.statSync(STATE_FILE_PATH);
        const currentModified = stats.mtime.getTime();
        
        if (currentModified > this.lastModified) {
          // File was modified by another process, reload state
          const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
          this.state = JSON.parse(data);
          this.lastModified = currentModified;
        }
      }
    } catch (error) {
      console.error('Error checking for external changes:', error);
    }
  }

  private async withFileLock<T>(operation: () => Promise<T>): Promise<T> {
    return this.fileLock.withLock(async () => {
      // Check for external changes before performing operation
      this.checkForExternalChanges();
      const result = await operation();
      return result;
    });
  }

  private loadState(): AgentStateData {
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

  private createDefaultState(): AgentStateData {
    return {
      id: uuidv4(),
      secretWord: process.env.ENV_MODE === 'dev' ? 'car' : this.selectRandomWord(),
      gameEnded: false,
      winnerAddress: undefined,
      nftId: undefined,
      history: [],
      questions: [],
      incorrectGuesses: [],
      twitterPosts: []
    };
  }

  async saveState(): Promise<void> {
    try {
      // Ensure the directory exists before writing the file
      const stateDir = path.dirname(STATE_FILE_PATH);
      if (!fs.existsSync(stateDir)) {
        await fs.promises.mkdir(stateDir, { recursive: true });
      }
      
      await fs.promises.writeFile(STATE_FILE_PATH, JSON.stringify(this.state, null, 2));
      this.updateLastModified();
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }

  private selectRandomWord(): string {
    const randomIndex = Math.floor(Math.random() * wordsList().length);
    return wordsList()[randomIndex];
  }

  getId(): string {
    this.checkForExternalChanges();
    return this.state.id;
  }

  getSecretWord(): string {
    this.checkForExternalChanges();
    return this.state.secretWord;
  }

  async getHistory(): Promise<HistoryEntry[]> {
    this.checkForExternalChanges();
    return this.state.history;
  }

  async addToHistory(message: HistoryEntry): Promise<any> {
    await this.withFileLock(async () => {
      this.state.history.push(message);
      await this.saveState();
    });
  }

  async getQuestions(): Promise<Question[]> {
    this.checkForExternalChanges();
    return this.state.questions;
  }

  async addQuestion(question: Question): Promise<any> {
    await this.withFileLock(async () => {
      this.state.questions.push(question);
      await this.saveState();
    });
  }

  async getIncorrectGuesses(): Promise<IncorrectGuess[]> {
    this.checkForExternalChanges();
    return this.state.incorrectGuesses;
  }

  async addIncorrectGuess(incorrectGuess: IncorrectGuess): Promise<any> {
    await this.withFileLock(async () => {
      this.state.incorrectGuesses.push(incorrectGuess);
      await this.saveState();
    });
  }

  async getGameEnded(): Promise<boolean> {
    this.checkForExternalChanges();
    return this.state.gameEnded;
  }

  async getWinnerAddress(): Promise<string | undefined> {
    this.checkForExternalChanges();
    return this.state.winnerAddress;
  }

  async setWinner(winnerAddress: string): Promise<void> {
    await this.withFileLock(async () => {
      this.state.winnerAddress = winnerAddress;
      this.state.gameEnded = true;
      await this.saveState();
    });
  }

  async getNftId(): Promise<string | undefined> {
    this.checkForExternalChanges();
    return this.state.nftId;
  }

  async setNftId(nftId: string): Promise<void> {
    await this.withFileLock(async () => {
      this.state.nftId = nftId;
      await this.saveState();
    });
  }

  async getTwitterPosts(): Promise<string[]> {
    this.checkForExternalChanges();
    return this.state.twitterPosts;
  }

  async addTwitterPost(post: string): Promise<void> {
    await this.withFileLock(async () => {
      this.state.twitterPosts.push(post);
      await this.saveState();
    });
  }

  async reset() {
    await this.withFileLock(async () => {
      // Delete the state file first
      if (fs.existsSync(STATE_FILE_PATH)) {
        await fs.promises.unlink(STATE_FILE_PATH);
      }
      
      // Also remove lock file if it exists
      this.fileLock.removeLockFile();

      const defaultState = this.createDefaultState();
      this.state = defaultState;

      await this.saveState();
    });
  }
}

const globalState = globalThis as unknown as {
  _agentState?: AgentState;
};

export const agentState = (() => {
  if (typeof window !== 'undefined') {
    throw new Error('AgentState should only be used on the server');
  }

  if (!globalState._agentState) {
    globalState._agentState = new AgentState();
  }

  return globalState._agentState;
})();

export async function resetState() {
  if (typeof window !== 'undefined') {
    throw new Error('AgentState should only be used on the server');
  }

  try {
    await agentState.reset();
  } catch (error) {
    console.error('Error resetting agent state:', error);
    throw error;
  }
};