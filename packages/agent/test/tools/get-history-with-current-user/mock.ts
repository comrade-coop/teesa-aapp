import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { toolMetadata } from "../../../src/tools/get-history-with-current-user";
import { addToolCall } from "../tool-tracker";

export const mockGetHistoryWithCurrentUser = tool(
  async (input: {}, config: RunnableConfig) => {
    addToolCall(toolMetadata.name, input);
    return `TEST: Mocked tool ${toolMetadata.name}`;
  },
  toolMetadata
); 