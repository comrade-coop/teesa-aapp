import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { generateNft, getNftContractAddress, getNetwork } from "@teesa-monorepo/nft";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
import { sendMessageLlm, sendMessageOllama } from "../llm";
import { NO_USER_ADDRESS_MESSAGE, PRIZE_AWARDED_MESSAGE, TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE, WON_GAME_MESSAGE } from "../message-const";
import { agentState, resetState } from "../state/agent-state";
import { AgentClientsEnum, HistoryEntry } from "../state/types";
import path from 'path';

require('dotenv').config({ path: path.resolve(process.cwd(), '../../.env') });

function retryWithExponentialBackoff(
  operation: () => Promise<any>,
  onSuccess?: (result?: any) => Promise<void>,
  onFailure?: (attempt: number) => Promise<void>
) {
  // Start a new task to handle retries
  (async () => {
    const initialDelayMs = 1000; // 1 second
    const maxDelayMs = 600000; // 10 minutes

    let attempt = 1;
    while(true) {
      try {
        const result = await operation();
        
        if (onSuccess) {
          await onSuccess(result);
        }

        return;
      } catch (error) {
        console.error(`Attempt ${attempt} failed.`);

        if (onFailure) {
          await onFailure(attempt);
        }
      }

      // Exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      console.log(`Retrying in ${delay / 1000}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  })();
}

export async function extractGuess(userGuessMessage: string): Promise<string> {
  const prompt = `
# TASK:
Extract the exact word being guessed from the input.
Respond on a new line with ONLY the guessed word, nothing else. Don't repeat the word - write it only once.
The guessed word should be a noun.
Respond with "NONE" if you cannot extract a specific word being guessed from the input.

# INPUT:
${userGuessMessage}

# RESPONSE:
  `;
  
  const result = await sendMessageLlm(prompt);
  const normalizedResult = result.trim().toLowerCase();

  return normalizedResult;
}

export async function check(guess: string): Promise<boolean> {
  const secretWord = agentState.getSecretWord();
  
  const prompt = `
# TASK:
Determine if Word 2 is essentially the same noun as Word 1 or it is a synonym of the same word, ignoring differences in plurality (singular/plural) and common spelling variations (e.g., US/UK English).

# EXAMPLES:
- Word 1: "dog", Word 2: "dogs" -> YES
- Word 1: "fish", Word 2: "fishes" -> YES
- Word 1: "child", Word 2: "children" -> YES
- Word 1: "color", Word 2: "colour" -> YES
- Word 1: "sheep", Word 2: "animal" -> NO
- Word 1: "tree", Word 2: "leaf" -> NO
- Word 1: "book", Word 2: "paper" -> NO
- Word 1: "chef", Word 2: "cook" -> YES
- Word 1: "chef", Word 2: "waiter" -> NO
- Word 1: "day", Word 2: "night" -> NO

# INSTRUCTIONS:
- Respond "YES" only if the words are essentially the same noun, or they are synonyms, or they are variations of the same noun (plural/singular, spelling).
- Respond "NO" in all other cases.
- Respond with ONLY YES or NO. Do not include explanations or any other text.

# WORDS TO COMPARE:
Word 1: "${secretWord}"
Word 2: "${guess}"

# RESPONSE:
`;

  const result = await sendMessageOllama(prompt);
  const normalizedResult = result.toLowerCase().replace(/[^a-z]/g, '');
  const isCorrect = normalizedResult === 'yes';
  
  return isCorrect;
}

function setWinner(userId: string, userAddress: string, timestamp: number) {
  agentState.setWinner(userAddress);

  if (process.env.ENV_MODE === 'dev') {
    console.log(`DEV MODE: NFT sent to user ${userAddress}`);
    onGenerateNftSuccess(userId, timestamp, '0');
    return;
  }

  console.log('Winner address:', userAddress);

  // Generate NFT and send it to the user
  retryWithExponentialBackoff(
    () => generateNft(userAddress, agentState.getId(), agentState.getSecretWord()),
    (nftId) => onGenerateNftSuccess(userId, timestamp, nftId),
    (attempt) => onGenerateNftFailure(attempt, userId, timestamp)
  );
}

async function onGenerateNftSuccess(userId: string, timestamp: number, nftId: string) {
  await agentState.setNftId(nftId);

  const network = getNetwork();
  const contractAddress = getNftContractAddress();
  const nftUrl = `${network.openseaUrl}/${contractAddress}/${nftId}`;

  const message: HistoryEntry = {
    id: uuidv4(),
    userId: userId,
    timestamp: timestamp + 1000,
    userMessage: undefined,
    llmMessage: `${PRIZE_AWARDED_MESSAGE}${nftUrl}`,
    agentClient: AgentClientsEnum.WEB
  };

  await agentState.addToHistory(message);

  restartGame();
}

async function onGenerateNftFailure(attempt: number, userId: string, timestamp: number) {
  if (attempt > 1) {
    return;
  }

  const message: HistoryEntry = {
    id: uuidv4(),
    userId: userId,
    timestamp: timestamp + 2000,
    userMessage: undefined,
    llmMessage: TEESA_WALLET_INSUFFICIENT_FUNDS_MESSAGE,
    agentClient: AgentClientsEnum.WEB
  };

  agentState.addToHistory(message);
}

function restartGame() {
  let timeToRestart = 30 * 60 * 1000; // 30 minutes
  if (process.env.ENV_MODE === 'dev') {
    timeToRestart = 10 * 1000; // 10 seconds
  }

  // Timeout before starting
  setTimeout(async () => {
    console.log('Restarting game');
    await resetState();
  }, timeToRestart);
}

export const toolMetadata = {
  name: "checkGuess",
  description: "Check if a guess is correct. ONLY USE THIS TOOL IF THE GUESS MEETS THE CRITERIA OF A GUESS.",
  schema: z.object({
    userGuessMessage: z.string().describe("The guess to check"),
  }),
};

export const checkGuess = tool(
  async (input: { userGuessMessage: string }, config: RunnableConfig) => {
    console.log("TOOL: checkGuess");

    const agentClient = config.configurable?.agentClient;
    const userAddress = config.configurable?.userAddress;
    
    if (agentClient == AgentClientsEnum.TWITTER) {
      return "Repond that the user can make a guess only from the game's website. This is the URL of the game's website: https://teesa.ai";
    } else if (!userAddress) {
      return `Respond only with '${NO_USER_ADDRESS_MESSAGE}'. Do not include any other text.`;
    }

    const { userGuessMessage } = input;

    const guess = await extractGuess(userGuessMessage);

    if (guess == 'none') {
      return "Respond that you are not able to understand what exactly is the player's guess. Explain how the player should properly phrase their guess based on the game rules."
    }

    const isCorrect = await check(guess);

    if (!isCorrect) {
      const messageId = config.configurable?.messageId;

      await agentState.addIncorrectGuess({
        messageId,
        guess
      });

      return `
The word is NOT what the player is guessing.
Generate a short playful comment for the INCORRECT guess.
Start by saying that the word is NOT what the player suggests.
Keep it encouraging but make it clear that the the word is not what the player guessed.
Respond with ONLY the comment, nothing else.
      `;
    }

    const userId = config.configurable?.userId;
    const timestamp = config.configurable?.timestamp;

    setWinner(userId, userAddress, timestamp);

    return `Respond only with '${WON_GAME_MESSAGE}'. Do not include any other text.`;
  },
  toolMetadata
);