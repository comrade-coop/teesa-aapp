import { sendMessageLlm } from "./llm";
import path from 'path';
import { gameRules, guessDescription } from "./agent";

require('dotenv').config({ path: path.resolve(process.cwd(), '../../.env') });

export async function isMessageGuess(message: string): Promise<boolean> {
  const trimmedMessage = message.trim();

  const prompt = `
# ROLE:
You are the host of a "20 Questions" game where the players try to guess a secret word by asking yes/no questions about what it describes.

${gameRules}

# TASK:
Your goal is to classify if the INPUT from the player is a GUESS.

${guessDescription}

# RESPONSE FORMAT:
Respond on a new line with ONLY one of: TRUE or FALSE.

# INPUT:
${trimmedMessage}

# RESPONSE:
  `;

  const result = await sendMessageLlm(prompt);
  const normalizedResult = result.toLowerCase().replace(/[^a-z]/g, '');

  return normalizedResult == 'true';
}