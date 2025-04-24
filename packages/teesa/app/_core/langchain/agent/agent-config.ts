import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import { WordAnswerTool } from "../tools/word-answer-tool";
import { WordGuessTool } from "../tools/word-guess-tool";
import { TEESA_AGENT_PROMPT } from "./prompt-templates";

/**
 * Creates and configures the Teesa agent with appropriate tools and memory
 */
export async function createTeesaAgent() {
  // Create tools
  const tools = [
    WordAnswerTool,
    WordGuessTool
  ];

  // Create LLM
  const llm = new ChatAnthropic({
    model: "claude-3-7-sonnet-20250219",
    temperature: 0.7
  });

  // Create memory
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "input"
  });

  // Create agent
  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt: TEESA_AGENT_PROMPT
  });

  // Create agent executor
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    memory,
    verbose: true
  });

  return agentExecutor;
}
