import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { agentState } from "../state/agent-state";
import { Question } from "../state/types";

function formatQuestion(question: Question): string {
  return `
Question: ${question.question}
Answer: ${question.answer}
	`;
}

export const getQuestions = tool(
  async () => {
    console.log("TOOL: getQuestions");

    const questions = await agentState.getQuestions();

    return questions.map(formatQuestion).join("\n");
  },
  {
    name: "getQuestions",
    description: "Get the all the questions and their yes/no answers that have been asked so far",
    schema: z.object({})
  }
);