import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { toolMetadata } from "../../../src/tools/answer-question";
import { addToolCall } from "../tool-tracker";

export const mockAnswerQuestion = tool(
  async (input: { question: string }, config: RunnableConfig) => {
    addToolCall(toolMetadata.name, input);
    return `TEST: Mocked tool ${toolMetadata.name}`;
  },
  toolMetadata
); 