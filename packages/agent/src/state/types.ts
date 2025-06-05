export enum AnswerResultEnum {
  YES,
  NO,
  UNKNOWN
}

export interface Question {
  messageId: string;
  question: string;
  answer: AnswerResultEnum;
}

export interface IncorrectGuess {
  messageId: string;
  guess: string;
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

export interface AgentStateData {
  id: string;
  secretWord: string;
  history: HistoryEntry[];
  questions: Question[];
  incorrectGuesses: IncorrectGuess[];
  gameEnded: boolean;
  winnerAddress: string | undefined;
  nftId: string | undefined;
}