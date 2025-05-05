'use server';

import { gameState, AnswerResultEnum } from '../../_core/game-state';
import { sendMessageCreativeLlm } from '../../_core/llm-client';
import { MessageTypeEnum } from '../../_core/message-type-enum';

// Cache to store the latest summary
let cachedSummary = '';
let lastMessageCount = 0;

export async function generateSummary(): Promise<string> {
  try {
    // Get all messages from the conversation
    const allMessages = await gameState.getHistory();
    
    // Filter to only include questions and guesses
    const relevantMessages = allMessages.filter(
      msg => msg.messageType === MessageTypeEnum.QUESTION || msg.messageType === MessageTypeEnum.GUESS
    );
    
    if (relevantMessages.length === 0) {
      return '';
    }

    // If the number of relevant messages hasn't changed, return the cached summary
    if (relevantMessages.length === lastMessageCount && cachedSummary) {
      return cachedSummary;
    }
    
    // Update the message count
    lastMessageCount = relevantMessages.length;

    // Extract relevant information from the messages
    const conversationText = relevantMessages.map(msg => {
      // Skip if user message is undefined
      if (!msg.userMessage) return '';
      
      let text = '';
      const userQuestion = msg.userMessage;
      
      // Use the stored answerResult if available, otherwise fall back to text parsing
      let simpleAnswer = 'Unknown';
      
      if (msg.answerResult !== undefined) {
        // Use the stored answer result
        switch(msg.answerResult) {
          case AnswerResultEnum.YES:
            simpleAnswer = 'Yes';
            break;
          case AnswerResultEnum.NO:
            simpleAnswer = 'No';
            break;
          case AnswerResultEnum.CORRECT:
            simpleAnswer = 'Correct!';
            break;
          case AnswerResultEnum.INCORRECT:
            simpleAnswer = 'Incorrect';
            break;
          default:
            simpleAnswer = 'Unknown';
        }

        // Format the Q&A pair
        if (msg.messageType === MessageTypeEnum.QUESTION) {
          text = `Question: ${userQuestion}\nAnswer: ${simpleAnswer}\n`;
        } else if (msg.messageType === MessageTypeEnum.GUESS) {
          text = `Guess: ${userQuestion}\nResult: ${simpleAnswer}\n`;
        }
      }
      
      return text;
    }).join('\n');

    const prompt = `
Based on the following Q&A about a secret word guessing game, create a concise summary of what we know about the secret word so far. 
Focus on confirmed facts (yes answers) and things that have been ruled out (no answers). Don't include any clues or hints.
Include everything we know about the secret word.
Keep it brief but comprehensive.
Make it a bullet point list with no more than 5 items.
Respond only with the summary, no other text.

Q&A History:
${conversationText}

Summary:
`;

    const summary = await sendMessageCreativeLlm(prompt);
    
    // Cache the result
    cachedSummary = summary;
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Failed to generate summary. Please try again later.';
  }
}