'use server';

import { sendMessageLlm } from '@/agent/llm';
import { gameState, AnswerResultEnum } from '@/agent/game-state';

// Cache to store the latest summary
let cachedSummary = '';
let lastMessageCount = 0;

export async function generateSummary(): Promise<string> {

  return '';
  try {
    // Get all messages from the conversation
    const questions = await gameState.getQuestions();
    
    if (questions.length === 0) {
      return '';
    }

    // If the number of relevant messages hasn't changed, return the cached summary
    if (questions.length === lastMessageCount && cachedSummary) {
      return cachedSummary;
    }
    
    // Update the message count
    lastMessageCount = questions.length;

    // Extract relevant information from the messages
    const conversationText = questions.map(question => {
      // Skip if user message is undefined
      if (!question.question) return '';
      
      let text = '';
      const userQuestion = question.question;
      
      // Use the stored answerResult if available, otherwise fall back to text parsing
      let simpleAnswer = 'Unknown';
      
      if (question.answer !== undefined) {
        // Use the stored answer result
        switch(question.answer) {
          case AnswerResultEnum.YES:
            simpleAnswer = 'Yes';
            break;
          case AnswerResultEnum.NO:
            simpleAnswer = 'No';
            break;
          default:
            simpleAnswer = 'Unknown';
        }

        // Format the Q&A pair
        text = `Question: ${userQuestion}\nAnswer: ${simpleAnswer}\n`;
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

    const summary = await sendMessageLlm(prompt);
    
    // Cache the result
    cachedSummary = summary;
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Failed to generate summary. Please try again later.';
  }
}