import 'server-only'
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import OpenAI from 'openai';

// Helper functions to create OpenRouter instances
const createLogicLlm = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('Missing required environment variable: OPENROUTER_API_KEY');
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://teesa.ai',
      'X-Title': 'Teesa Word Game',
    },
  });
};

const createCreativeLlm = () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('Missing required environment variable: OPENROUTER_API_KEY');
  }

  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://teesa.ai',
      'X-Title': 'Teesa Word Game',
    },
  });
};

const createOllama = (model: string) => new ChatOllama({
  model: model || "llama3.2",
  temperature: 0,
  maxRetries: 3,
  baseUrl: "http://localhost:11434",
});

// Create singleton instances
let logicLlmInstance: OpenAI | null = null;
let creativeLlmInstance: OpenAI | null = null;
const ollamaInstances: Record<string, ChatOllama> = {};

// Get or create the logic LLM instance (Gemini 2.5 Flash Thinking)
const getLogicLlm = (): OpenAI => {
  if (!logicLlmInstance) {
    logicLlmInstance = createLogicLlm();
  }
  return logicLlmInstance;
};

// Get or create the creative LLM instance (Grok 3)
const getCreativeLlm = (): OpenAI => {
  if (!creativeLlmInstance) {
    creativeLlmInstance = createCreativeLlm();
  }
  return creativeLlmInstance;
};

// Get or create the Ollama instance for a specific model
const getOllama = (model: string): ChatOllama => {
  if (!ollamaInstances[model]) {
    ollamaInstances[model] = createOllama(model);
  }
  return ollamaInstances[model];
};

export async function sendMessageLlm(message: string, systemMessage?: string | undefined): Promise<string> {
  const llm = getLogicLlm();
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }

  messages.push({ role: 'user', content: message });

  const logicModel = process.env.OPENROUTER_LOGIC_MODEL || 'google/gemini-2.5-flash-preview:thinking';

  const response = await llm.chat.completions.create({
    model: logicModel,
    temperature: 0,
    messages: messages,
    include_reasoning: false,
    reasoning: {
      // effort: "high",
      // max_tokens: 2000,
      exclude: true
    }
  } as any);

  var content = response.choices[0].message.content || '';

  // Mitigate the issue of OpenRouter returning the reasoning tokens in the response
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim() !== '');
  if (nonEmptyLines.length > 0) {
    content = nonEmptyLines[nonEmptyLines.length - 1];
  } else {
    content = '';
  }

  return content;
}

export async function sendMessageCreativeLlm(message: string, systemMessage?: string | undefined): Promise<string> {
  const llm = getCreativeLlm();
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }

  messages.push({ role: 'user', content: message });

  const creativeModel = process.env.OPENROUTER_CREATIVE_MODEL || 'x-ai/grok-3-beta';

  const response = await llm.chat.completions.create({
    model: creativeModel,
    temperature: 0.7, // Slightly higher temperature for more creative responses
    messages: messages,
  });

  return response.choices[0].message.content || '';
}

export async function sendMessageOllama(message: string, systemMessage?: string | undefined): Promise<string> {
  const model = process.env.OLLAMA_MODEL;
  if (!model) {
    throw new Error('Missing required environment variables: OLLAMA_MODEL');
  }

  const llm = getOllama(model);
  return await sendMessageWithLangChain(llm, message, systemMessage);
}

async function sendMessageWithLangChain(llm: BaseChatModel, message: string, systemMessage?: string | undefined): Promise<string> {
  const messages = [];

  if (systemMessage) {
    messages.push(new SystemMessage(systemMessage));
  }

  messages.push(new HumanMessage(message));

  const response = await llm.invoke(messages);

  const parser = new StringOutputParser();
  return await parser.invoke(response);
}