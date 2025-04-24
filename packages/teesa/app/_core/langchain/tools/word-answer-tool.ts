import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { gameState } from "../../game-state";
import { sendMessageOllama } from "../../llm-client";

/**
 * Tool for evaluating yes/no questions about the secret word
 * Uses Ollama for inference to maintain TEE security
 */
export const WordAnswerTool = tool(
  async (input: { question: string }): Promise<string> => {
    try {
      const secretWord = gameState.getSecretWord();

      const prompt = `
AGENT (thinks of a word and the thing it represents): ${secretWord}
USER (asks a yes/no question about it): ${input.question}
AGENT (answers with only "yes" or "no" based on common-sense logic): `;

      const response = await sendMessageOllama(prompt);
      const isYes = response.toLowerCase().replace(/[^a-z]/g, '') === 'yes';
      console.log(`Word Answer Tool - Question: "${input.question}", Answer: ${isYes ? "yes" : "no"}`);
      return isYes ? "true" : "false";
    } catch (error) {
      console.error("Error in WordAnswerTool:", error);
      throw new Error(`Failed to process question: ${error}`);
    }
  },
  {
    name: "word_answer",
    description: "Evaluates yes/no questions about the secret word. Use this tool when the user asks a yes/no question about the secret word.",
    schema: z.object({
      question: z.string().describe("The yes/no question about the secret word")
    })
  }
);
