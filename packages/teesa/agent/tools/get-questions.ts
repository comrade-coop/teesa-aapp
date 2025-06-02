import 'server-only';

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { gameState, Question } from "../game-state";

function formatQuestion(question: Question): string {
  return `
Question: ${question.question}
Answer: ${question.answer}
	`;
}

export const getQuestions = tool(
  async () => {
    console.log("TOOL: getQuestions");

    const questions = await gameState.getQuestions();

    return questions.map(formatQuestion).join("\n");
  },
  {
    name: "getQuestions",
    description: "Get the all the questions and their yes/no answers that have been asked so far",
    schema: z.object({})
  }
);