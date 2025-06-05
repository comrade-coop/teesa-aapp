import { tool } from "@langchain/core/tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";
import { sendMessageOllama } from "../llm";
import { gameState } from "../state/agent-state";
import { AnswerResultEnum } from "../state/types";

async function answer(question: string): Promise<AnswerResultEnum> {
  const secretWord = gameState.getSecretWord();

  const prompt = `
ROLE: You are the host of a "20 Questions" game. Your goal is to answer yes/no questions about a secret word accurately and fairly, based on common-sense knowledge. 

TASK: Determine whether to answer the following yes/no question about a secret word with YES or NO.

You will receive:
- SECRET WORD: the noun to evaluate.
- QUESTION: a yes/no question about that noun.

GUIDELINES:
1. Use common-sense logic about the secret word and its meaning. Respond as an average person would.
2. Do not overthink and over-analyze the question. 
3. Avoid overly literal interpretations.
4. Respond with ONLY the word YES or NO, without any additional text.
5. If it is really impossible to answer the question with either YES or NO, respond with MAYBE.

SECRET WORD: "${secretWord}"
QUESTION: 
${question}

RESPONSE:
`;

  const response = await sendMessageOllama(prompt);
  const normalizedResponse = response.toLowerCase().replace(/[^a-z]/g, '');

  let result: AnswerResultEnum;
  if (normalizedResponse === 'yes') {
    result = AnswerResultEnum.YES;
  } else if (normalizedResponse === 'no') {
    result = AnswerResultEnum.NO;
  } else {
    result = AnswerResultEnum.UNKNOWN;
  }

  return result;
}

export const answerQuestion = tool(
  async (input: { question: string }, config: RunnableConfig) => {
    console.log("TOOL: answerQuestion");

    const { question } = input;
    const messageId = config.configurable?.messageId;

    const answerResult = await answer(question);

    await gameState.addQuestion({ 
      messageId,
      question, 
      answer: answerResult
    });

    return answerResult;
  },
  {
    name: "answerQuestion",
    description: "Answer a question about the secret word",
    schema: z.object({
      question: z.string().describe("The question to answer"),
    }),
  }
);