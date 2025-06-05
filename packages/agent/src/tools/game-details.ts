import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { gameState } from "../state/agent-state";

export const gameDetails = tool(
  async () => {
    console.log("TOOL: gameDetails");

    const questions = await gameState.getQuestions();
    const incorrectGuesses = await gameState.getIncorrectGuesses();

    return `
- The game is currently in progress.
- The players have asked ${questions.length} questions.
- The players have made the following incorrect guesses: ${incorrectGuesses.map(g => g.guess).join(", ")}
  `;
  },
  {
    name: "gameDetails",
    description: "Get the details for the current game",
    schema: z.object({})
  }
);