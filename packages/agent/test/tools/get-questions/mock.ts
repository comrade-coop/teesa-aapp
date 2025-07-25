import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { toolMetadata } from "../../../src/tools/get-questions";
import { addToolCall } from "../tool-tracker";

export const mockGetQuestions = tool(
  async (input: {}, config: RunnableConfig) => {
    addToolCall(toolMetadata.name, input);
    return `TEST: Mocked tool ${toolMetadata.name}`;
  },
  toolMetadata
); 