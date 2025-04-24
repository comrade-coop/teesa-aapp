import { sendMessageLlm, sendMessageOllama } from '../../../app/_core/llm-client';

/**
 * Classifies whether a given response expresses a positive affirmation or a negative response.
 * Returns true for positive, false for negative.
 */
export async function classifyAnswer(answer: string): Promise<boolean> {
  const prompt = `
TASK: You are a classification system that determines whether a statement represents a positive or negative response to a yes/no question.

INSTRUCTIONS:
- Analyze the statement below carefully
- Determine if it expresses a positive affirmation (YES) or a negative response (NO)
- Consider context, tone, and implicit meaning
- Ignore any irrelevant information in the statement
- If the statement is ambiguous, use your best judgment based on the overall sentiment

RESPONSE FORMAT:
- Respond with ONLY "yes" or "no"
- Do not include any explanation or additional text

Statement to classify:
${answer}
`;
  const response = await sendMessageLlm(prompt);
  const normalized = response.toLowerCase().replace(/[^a-z]/g, '');
  return normalized === 'yes';
} 