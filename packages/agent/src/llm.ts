import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  model: process.env.OPENROUTER_MODEL,
  temperature: 0.4,
  maxTokens: 1024,
  openAIApiKey: process.env.OPENROUTER_API_KEY || 'x-ai/grok-3-beta',
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://teesa.ai",
      "X-Title": "Teesa LangGraph Agent",
    },
  },
});

export const ollama = new ChatOllama({
  model: process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct-q4_K_M',
  temperature: 0,
  maxRetries: 3,
  baseUrl: "http://localhost:11434",
});

export async function sendMessageLlm(message: string, systemMessage: string | undefined = undefined): Promise<string> {
  return await sendMessage(llm, message, systemMessage);
}

export async function sendMessageOllama(message: string, systemMessage: string | undefined = undefined): Promise<string> {
  return await sendMessage(ollama, message, systemMessage);
}

async function sendMessage(model: BaseChatModel, message: string, systemMessage: string | undefined = undefined): Promise<string> {
  const llmInput = [];

  if (systemMessage) {
    llmInput.push(new SystemMessage(systemMessage));
  }

  llmInput.push(new HumanMessage(message));

  const llmResult = await model.invoke(llmInput);

  const parser = new StringOutputParser();
  const parsedResult = await parser.invoke(llmResult);

  return parsedResult;
}