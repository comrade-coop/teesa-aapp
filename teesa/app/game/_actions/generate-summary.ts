'use server';

import { gameState } from '../../_core/game-state';
import { sendMessageLlm } from '../../_core/llm-client';

export async function generateSummary(): Promise<string> {
  try {
    // Get all messages from the conversation
    const allMessages = await gameState.getHistory();
    const messages = allMessages.filter(msg => msg.userMessage !== undefined);
    
    if (messages.length === 0) {
      return '';
    }

    // Extract relevant information from the messages
    const conversationText = messages.map(msg => {
      let text = '';
      if (msg.userMessage) {
        text += `User: ${msg.userMessage}\n`;
      }
      if (msg.llmMessage) {
        text += `Teesa: ${msg.llmMessage}\n`;
      }
      return text;
    }).join('\n');

    const prompt = `
Based on the following conversation about a mystery word guessing game, create a concise summary of what we know about the mystery word so far. 
Focus on confirmed facts (yes answers) and things that have been ruled out (no answers). Don't include any clues or hints.
Format the summary as a sentencies - one sentence per line.
Keep it brief but comprehensive.
Respond only with the summary, no other text.

Conversation:
${conversationText}

Summary:
`;

    const summary = await sendMessageLlm(prompt);
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Failed to generate summary. Please try again later.';
  }
}