import { sendMessageLlm } from '../../../app/_core/llm-client';

/**
 * Classifies whether a given response expresses a positive affirmation or a negative response.
 * Returns true for positive, false for negative.
 */
export async function classifyAnswer(answer: string): Promise<boolean> {

  // Try trivial classification first
  const normalizedAnswer = answer.toLowerCase().replace(/[^a-z]/g, '');
  if (normalizedAnswer === 'yes' || normalizedAnswer === 'correct') {
    return true;
  } else if (normalizedAnswer === 'no' || normalizedAnswer === 'incorrect') {
    return false;
  } else if (normalizedAnswer === 'maybe' || normalizedAnswer === 'unknown') {
    throw new Error(`Cannot classify ambiguous answer: "${answer}". Expected clear positive or negative.`);
  }

  const prompt = `
TASK: You are a classification system that determines whether a statement represents a positive or negative response to a yes/no question.

INSTRUCTIONS:
- Determine if it expresses a positive affirmation (YES) or a negative response (NO)
- Do not overthink and over-analyze it. Respond as an average person would.

RESPONSE FORMAT:
- Respond with only YES or NO
- Do not include any explanation or additional text

STATEMENT TO CLASSIFY:
${answer}

`;
  const response = await sendMessageLlm(prompt);
  const normalized = response.toLowerCase().replace(/[^a-z]/g, '');
  return normalized === 'yes';
} 