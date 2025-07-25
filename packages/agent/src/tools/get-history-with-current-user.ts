import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { agentState } from "../state/agent-state";
import { AgentClientsEnum, HistoryEntry } from "../state/types";

function formatHistoryMessage(history: HistoryEntry): string {
  return `
User: ${history.userMessage}
Teesa: ${history.llmMessage}
	`;
}

export const toolMetadata = {
  name: "getHistoryWithCurrentUser",
  description: "Get the chat history with the current user",
  schema: z.object({})
};

export const getHistoryWithCurrentUser = tool(
  async (config: RunnableConfig) => {
    console.log("TOOL: getHistoryWithCurrentUser");

    const userId = config.configurable?.userId;

    const history = (await agentState.getHistory()).filter(f => f.userId == userId && f.agentClient == AgentClientsEnum.WEB);

    return history.map(h => formatHistoryMessage(h)).join("\n");
  },
  toolMetadata
);