import 'server-only'
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";

const createLlm = (temperature: number) => new ChatAnthropic({
  model: 'claude-3-sonnet-20240229',
  temperature,
});

// Low temperature for precise tasks
const preciseLlm = createLlm(0);

// Higher temperature for creative responses
const creativeLlm = createLlm(0.8);

export async function sendMessageLlm(message: string, systemMessage?: string | undefined, isCreative: boolean = false): Promise<string> {
  const messages = [];

  if (systemMessage) {
    messages.push(new SystemMessage(systemMessage));
  }

  messages.push(new HumanMessage(message));

  const llm = isCreative ? creativeLlm : preciseLlm;
  const response = await llm.invoke(messages);

  const parser = new StringOutputParser();
  return await parser.invoke(response);
}