import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { toolMetadata } from "../../../src/tools/nft-details";
import { addToolCall } from "../tool-tracker";

export const mockNftDetails = tool(
  async (input: {}, config: RunnableConfig) => {
    addToolCall(toolMetadata.name, input);
    return `TEST: Mocked tool ${toolMetadata.name}`;
  },
  toolMetadata
); 