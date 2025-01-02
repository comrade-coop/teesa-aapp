import 'server-only'
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";

const anthropic = () => new ChatAnthropic({
  model: 'claude-3-sonnet-20240229',
  temperature: 0.1,
});

const llm = anthropic();

export async function sendMessage(message: string, systemMessage?: string | undefined): Promise<string> {
  const messages = [];

  if (systemMessage) {
    messages.push(new SystemMessage(systemMessage));
  }

  messages.push(new HumanMessage(message));

  const response = await llm.invoke(messages);

  const parser = new StringOutputParser();
  return await parser.invoke(response);
}