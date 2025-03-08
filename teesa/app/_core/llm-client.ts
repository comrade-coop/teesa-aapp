import 'server-only'
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getEnv } from '@/lib/environments';

// Helper functions to create LLM instances
const createLlm = () => new ChatAnthropic({
  model: 'claude-3-7-sonnet-20250219',
  temperature: 0,
  anthropicExtras: {
    thinking: {
      enabled: true,
      budget_tokens: 1000,
    }
  }
});

const createOllama = (model: string) => new ChatOllama({
  model: model || "llama3",
  temperature: 0,
  maxRetries: 2,
});

// Create singleton instances
let llmInstance: ChatAnthropic | null = null;
const ollamaInstances: Record<string, ChatOllama> = {};

// Get or create the LLM instance
const getLlm = (): ChatAnthropic => {
  if (!llmInstance) {
    llmInstance = createLlm();
  }
  return llmInstance;
};

// Get or create the Ollama instance for a specific model
const getOllama = (model: string): ChatOllama => {
  if (!ollamaInstances[model]) {
    ollamaInstances[model] = createOllama(model);
  }
  return ollamaInstances[model];
};

export async function sendMessageLlm(message: string, systemMessage?: string | undefined): Promise<string> {
  const llm = getLlm();
  return await sendMessage(llm, message, systemMessage);
}

export async function sendMessageOllama(message: string, systemMessage?: string | undefined): Promise<string> {
  const model = getEnv('OLLAMA_MODEL');
  if (!model) {
    throw new Error('Missing required environment variables: OLLAMA_MODEL');
  }
  
  const llm = getOllama(model);
  return await sendMessage(llm, message, systemMessage);
}

async function sendMessage(llm: BaseChatModel, message: string, systemMessage?: string | undefined): Promise<string> {
  const messages = [];

  if (systemMessage) {
    messages.push(new SystemMessage(systemMessage));
  }

  messages.push(new HumanMessage(message));

  const response = await llm.invoke(messages);

  const parser = new StringOutputParser();
  return await parser.invoke(response);
}