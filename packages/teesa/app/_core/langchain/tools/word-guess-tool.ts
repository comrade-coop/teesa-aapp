import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { gameState } from "../../game-state";
import { sendMessageOllama } from "../../llm-client";

/**
 * Tool for verifying if a guess matches the secret word
 * Uses Ollama for inference to maintain TEE security
 */
export const WordGuessTool = tool(
  async (input: { guess: string }): Promise<string> => {
    try {
      // Implementation using existing checkGuess logic
      const secretWord = gameState.getSecretWord();
      const prompt = `
Secret word: "${secretWord}".
User guess: "${input.guess}"

Check if the User guess matches the secret word exactly, or is a close synonym, plural form, or minor variation.
For example:
- "cat" matches "cats" or "kitty"
- "phone" matches "telephone" or "cellphone"
- "couch" matches "sofa"
But reject guesses that are:
- Different concepts entirely
- Too general or specific
- Only loosely related

Remember this is a guessing game and the guess should be accurate to be considered correct.
Respond with ONLY "correct" or "incorrect", nothing else.`;

      const response = await sendMessageOllama(prompt);
      const isCorrect = response.toLowerCase().replace(/[^a-z]/g, '') === 'correct';
      console.log(`Word Guess Tool - Guess: "${input.guess}", Result: ${isCorrect ? "correct" : "incorrect"}`);
      return isCorrect ? "true" : "false";
    } catch (error) {
      console.error("Error in WordGuessTool:", error);
      throw new Error(`Failed to process guess: ${error}`);
    }
  },
  {
    name: "word_guess",
    description: "Verifies if a guess matches the secret word. Use this tool when the user makes a direct guess about what the secret word is.",
    schema: z.object({
      guess: z.string().describe("The word being guessed")
    })
  }
);
