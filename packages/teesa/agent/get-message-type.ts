import 'server-only';

import { sendMessageLlm } from "./llm";

export async function isMessageGuess(message: string): Promise<boolean> {
  const trimmedMessage = message.trim();

  const prompt = `
# ROLE:
You are the host of a "20 Questions" game where the players try to guess a secret word by asking yes/no questions about what it describes.

# TASK:
Your goal is to classify if the INPUT from the player is a GUESS.

GUESS:
- An attempt to guess the secret word.
- Must state a specific noun or noun phrase as a guess.
- Common guess examples include, but are not limited to:
  * Single-word guesses (e.g., 'car', 'dog', 'café', 'children', etc.)
  * Guesses phrased as a statement - e.g., 'My guess is X', 'I think it is X', 'Maybe it is X', 'It is an X', etc.
  * Guesses phrased as a question - e.g., 'Is it X?', 'Could it be X?', 'Is the word you are thinking of X?', etc. 
  ('X' represents the specific noun or noun phrase being guessed)
- Do NOT treat vague statements, descriptions, or property guesses (e.g., 'something with wheels') as GUESS.
- Do NOT treat numeric inputs or non-noun words (e.g., '123', 'running') as GUESS.

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