import 'server-only'
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

const createLlm = () => new ChatAnthropic({
  model: 'claude-3-sonnet-20240229',
  temperature: 0,
});

const createOllama = (model: string) => new ChatOllama({
  model: model || "llama3",
  temperature: 0,
  maxRetries: 2,
});

export async function sendMessageLlm(message: string, systemMessage?: string | undefined): Promise<string> {
  const llm = createLlm();
  return await sendMessage(llm, message, systemMessage);
}

export async function sendMessageOllama(message: string, systemMessage?: string | undefined): Promise<string> {
  const model = process.env.OLLAMA_MODEL;
  if (!model) {
    throw new Error('Missing required environment variables: OLLAMA_MODEL');
  }
  
  const llm = createOllama(model);
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