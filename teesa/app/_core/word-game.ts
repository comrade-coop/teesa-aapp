import 'server-only'
import { HistoryEntry, gameState } from './game-state';
import { sendMessageLlm, sendMessageOllama } from './llm-client';
import { sendMessageEliza } from './eliza-client';
import { WON_GAME_MESSAGE } from './game-const';

export class WordGame {
  private readonly baseRules = `
Your name is Teesa.
You are an AI agent who is the host of a word guessing game. 
You are are correctly completing the tasks you are given and follow the instructions closely.
                                
GAME RULES:
You select a random secret word and the players try to guess it by asking yes/no questions about what it describes. 
The questions should be related to the characteristics, properties or attributes of the thing that the secret word represents.
All secret words are nouns.
The player can make direct guesses at any time, and you will tell them if they're correct or not. 
Asking about the spelling of the secret word or parts of it is NOT allowed.
Asking about the length of the secret word is NOT allowed.
Asking the same question multiple times is NOT allowed.
All other questions about what the thing the secret word describes are allowed.`;

  private async getHistoryForPrompt() {
    const history = await gameState.getHistory();
    return history.flatMap(h => {
      const userMessage = {
        role: 'user',
        content: h.userMessage
      };
      const llmMessage = {
        role: 'assistant',
        content: h.llmMessage
      };
      return [userMessage, llmMessage];
    });
  }

  private async fixSpelling(text: string): Promise<string> {
    const prompt = `
Fix the spelling and grammar of the text below. 
Translate it to English if it's in another language. 
Do not include any other words or explanation.
---
${text}`;

    return sendMessageLlm(prompt);
  }

  private async getInputType(userInput: string): Promise<string> {
    const prompt = `
# TASK: 
Determine if the INPUT below is a question, guess, or neither: 
- For a "question": Must be a yes/no question about the characteristics, properties, behaviors, attributes, or the nature of what the secret word describes.
- For a "guess": Must indicate attempting to guess the word or state what they think the word is. 
- Everything else is considered "other".

# RULES:
All secret words are nouns. When determining the type:
- Single words or phrases asking about properties (e.g. "alive", "is it red", "can it move") are "question"
- Direct statements or questions that name a specific noun (e.g. "is it a cat", "I think it's a flower", "dog") are "guess"
- Questions about properties should be "question" even if they contain nouns (e.g. "does it eat plants", "is it bigger than a car")

# EXAMPLES:
- "does it grow in gardens" -> "question" (asking about behavior/property)
- "is it made of metal" -> "question" (asking about material property)
- "is it abstract" -> "question" (asking about abstract property)
- "is it a plant" -> "question" (asking about category)
- "is your word about the future of economy" -> "question" (asking about abstract concepts and categories)
- "is it car" -> "guess" (direct noun, not asking about category or property)
- "flower" -> "guess" (direct noun)
- "alive" -> "question" (asking about a property)


# RESPONSE:
Respond with ONLY "question", "guess", or "other".

# INPUT:
${userInput}`;

    const response = await sendMessageLlm(prompt, this.baseRules);
    return response.toLowerCase().replace(/[^a-z]/g, '');
  }

  private async extractGuess(userInput: string): Promise<string> {
    const prompt = `
Extract the exact word being guessed from this input: "${userInput}"
Respond with ONLY the guessed word, nothing else.
Respond with "NONE" if you cannot extract a word from the input.`;

    return sendMessageLlm(prompt, this.baseRules);
  }

  private async answerQuestion(question: string): Promise<string> {
    // Get yes/no answer
    const isYes = await this.getAnswer(question);
    const yesNo = isYes ? 'Yes' : 'No';

    // Get playful comment
    const comment = await this.getPlayfulComment(question, yesNo);

    const fullResponse = `${yesNo}! ${comment}`;
    return fullResponse;
  }

  private async getAnswer(question: string): Promise<boolean> {
    const secretWord = await gameState.getSecretWord();
    const prompt = `
AGENT (thinks of a word and the thing it represents): ${secretWord}
USER (asks a yes/no question about it): ${question}
AGENT (answers with only "yes" or "no" based on common-sense logic): `;

    const response = await sendMessageOllama(prompt);
    return response.toLowerCase().replace(/[^a-z]/g, '') === 'yes';
  }

  private async checkGuess(guess: string): Promise<boolean> {
    const secretWord = await gameState.getSecretWord();
    const prompt = `
Secret word: "${secretWord}".
User guess: "${guess}"

Check if the User guess matches the Secret word exactly, or is a close synonym, plural form, or minor variation.
For example:
- "cat" matches "cats" or "kitty"
- "phone" matches "telephone" or "cellphone"
- "couch" matches "sofa"
But reject guesses that are:
- Different concepts entirely
- Too general or specific
- Only loosely related

Remember this is a guessing game and the guess should be accurate to be considered correct.
Respond with ONLY "correct" or "incorrect", nothing else.`;

    const response = await sendMessageOllama(prompt);
    return response.toLowerCase().replace(/[^a-z]/g, '') === 'correct';
  }

  private async getRandomResponse(userInput: string): Promise<string> {
    const history = await this.getHistoryForPrompt();
    const prompt = `
# CONTEXT:
Previous conversation:
${JSON.stringify(history)}

Player's input:
${userInput}

# TASK:
Generate a short comment to an irrelevant or nonsensical player input.
You might decide to respond to what the player asks or says, but also make it clear they should ask a proper question or make a guess. DO NOT include example questions or guesses.
DO NOT include any other words, explanation, or special formatting.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, this.baseRules);
  }

  private async getPlayfulComment(question: string, answer: string): Promise<string> {
    const history = await this.getHistoryForPrompt();
    const prompt = `
# CONTEXT:
Previous conversation: 
${JSON.stringify(history)}

A player asked: 
${question}

The answer is: ${answer}

# TASK:
Generate a short comment to add after the answer response. The comment should be relevent to the answer.
DO NOT include Yes/No in your response - just the comment. DO NOT include any other words, explanation, or special formatting. Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, this.baseRules);
  }

  private async getIncorrectGuessResponse(userInput: string): Promise<string> {
    const history = await this.getHistoryForPrompt();
    const prompt = `
# CONTEXT:
Previous conversation: 
${JSON.stringify(history)}

Player's input:
${userInput}

# TASK:
Generate a short comment for an incorrect guess.
Keep it encouraging but make it clear they haven't guessed correctly.
DO NOT include any other words, explanation, or special formatting.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, this.baseRules);
  }

  public async processUserInput(userAddress: string, messageId: string, timestamp: number, input: string): Promise<[boolean, string]> {
    const userInput = (await this.fixSpelling(input)).trim();
    const inputType = await this.getInputType(userInput);

    let wonGame = false;
    let response: string = '';

    if (inputType == 'question') {
      response = await this.answerQuestion(userInput);
    } else if (inputType == 'guess') {
      const guessedWord = await this.extractGuess(userInput);

      if (await this.checkGuess(guessedWord)) {
        gameState.setWinner(userAddress);
        wonGame = true;
        response = WON_GAME_MESSAGE;
      } else {
        response = await this.getIncorrectGuessResponse(userInput);
      }
    } else {
      response = await this.getRandomResponse(userInput);
    }

    const message: HistoryEntry = {
      id: messageId,
      userId: userAddress,
      timestamp: timestamp,
      userMessage: input,
      llmMessage: response
    };

    gameState.addToHistory(message);

    return [wonGame, response];
  }
}

// Export singleton instance
export const wordGame = new WordGame();
