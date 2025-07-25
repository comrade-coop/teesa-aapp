import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { toolMetadata } from "../../../src/tools/check-guess";
import { addToolCall } from "../tool-tracker";

export const mockCheckGuess = tool(
  async (input: { userGuessMessage: string }, config: RunnableConfig) => {
    addToolCall(toolMetadata.name, input);
    return `TEST: Mocked tool ${toolMetadata.name}`;
  },
  toolMetadata
); 