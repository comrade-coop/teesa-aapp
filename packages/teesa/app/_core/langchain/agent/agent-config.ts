import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import { WordAnswerTool } from "../tools/word-answer-tool";
import { WordGuessTool } from "../tools/word-guess-tool";
import { TEESA_AGENT_PROMPT } from "./prompt-templates";
import { ChatOpenAI } from "@langchain/openai";

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
  const llm = new ChatOpenAI({
    model: process.env.OPENROUTER_LOGIC_MODEL || "google/gemini-2.5-flash-preview:thinking",
    temperature: 0.7,
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://teesa.ai",
        "X-Title": "Teesa Word Game",
      },
    }
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
