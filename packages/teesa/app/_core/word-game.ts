import 'server-only'
import { HistoryEntry, gameState } from './game-state';
import { sendMessageLlm, sendMessageOllama } from './llm-client';
import { sendMessageEliza } from './eliza-client';
import { WON_GAME_MESSAGE } from './game-const';
import { MessageTypeEnum } from './message-type-enum';
import { AnswerResultEnum } from './game-state';

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
Asking if the word is within a certain list of words is NOT allowed.
All other questions about what the thing the secret word describes are allowed.`;

  // Cache for extracted guesses to avoid duplicate LLM calls
  private extractGuessCache: Map<string, string> = new Map();

  // Method to clear the cache if needed (e.g., for testing or if memory concerns arise)
  public clearExtractGuessCache(): void {
    const cacheSize = this.extractGuessCache.size;
    this.extractGuessCache.clear();
    console.log(`Cleared extract guess cache (${cacheSize} entries)`);
  }

  private async getHistoryForPrompt() {
    const history = await gameState.getHistory();
    console.log(`Retrieved ${history.length} history entries for prompt`);
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

  private async getQuestionHistoryForPrompt() { 
    const history = await gameState.getHistory();
    console.log(`Retrieved ${history.length} history entries for prompt`);
    const questionHistory = history.filter(h => h.messageType === MessageTypeEnum.QUESTION);
    
    // Return only the user messages (questions), not the system's responses
    return questionHistory.map(h => ({
      role: 'user',
      content: h.userMessage
    }));
  }

  private async getInputType(userInput: string): Promise<MessageTypeEnum> {
    const history = await this.getQuestionHistoryForPrompt();
    const prompt = `
# TASK: 
Determine if the INPUT below is a question, guess, or neither: 
- For a "question": Must be a yes/no question about the characteristics, properties, behaviors, attributes, or the nature of what the secret word describes.
- For a "guess": Must indicate attempting to guess the word or state what they think the word is. 
- Everything else is considered "other".

# RULES:
All secret words are nouns. When determining the type:
- Single words or phrases asking about properties (e.g. "alive", "is it red", "can it move", "is it a machine") are "question"
- Direct statements or questions that name a specific noun (e.g. "is it cat", "I think it's a flower", "dog") are "guess"
- Questions about properties should be "question" even if they contain nouns (e.g. "does it eat plants", "is it bigger than a car")
- If the input is not compliant with the GAME RULES, respond with "other"
- If the input is a question that was previously asked (including rephrased versions seeking the same information), respond with "question_repeated".

# RESPONSE:
Respond with ONLY "question", "question_repeated", "guess", or "other".

# INPUT:
${userInput}

# HISTORY:
${JSON.stringify(history)}
`;

    const response = await sendMessageLlm(prompt, this.baseRules);
    const inputType = response.toLowerCase().replace(/[^a-z]/g, '');
    console.log(`Input type for "${userInput}" determined as: "${inputType}"`);

    return inputType === 'question' ? MessageTypeEnum.QUESTION
      : inputType === 'guess' ? MessageTypeEnum.GUESS
        : MessageTypeEnum.OTHER;
  }

  private async extractGuess(userInput: string): Promise<string> {
    // Check if we have a cached result for this input
    if (this.extractGuessCache.has(userInput)) {
      const cachedGuess = this.extractGuessCache.get(userInput)!;
      console.log(`Using cached extracted guess for "${userInput}": "${cachedGuess}"`);
      return cachedGuess;
    }

    const prompt = `
Extract the exact word being guessed from this input: "${userInput}"
Respond with ONLY the guessed word, nothing else.
Respond with "NONE" if you cannot extract a word from the input.`;

    const guess = await sendMessageLlm(prompt, this.baseRules);
    console.log(`Extracted guess from "${userInput}": "${guess}"`);
    
    // Cache the result
    this.extractGuessCache.set(userInput, guess);
    
    return guess;
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


  private async answerQuestion(question: string): Promise<[string, AnswerResultEnum]> {
    // Fix spelling and grammar before processing
    const correctedQuestion = await this.fixSpelling(question);
    console.log(`Original question: "${question}"`);
    console.log(`Corrected question: "${correctedQuestion}"`);
    
    // Get yes/no answer
    const isYes = await this.getAnswer(correctedQuestion);
    const yesNo = isYes ? 'Yes' : 'No';
    const answerResult = isYes ? AnswerResultEnum.YES : AnswerResultEnum.NO;

    // Get playful comment
    const comment = await this.getPlayfulComment(correctedQuestion, yesNo);

    const fullResponse = `${comment}`;
    return [fullResponse, answerResult];
  }

  private async getAnswer(question: string): Promise<boolean> {
    console.log(`Getting answer for question: "${question}"`);
    const secretWord = gameState.getSecretWord();
    // Note: Not logging the secret word
    const prompt = `
AGENT (thinks of a word and the thing it represents): ${secretWord}
USER (asks a yes/no question about it): ${question}
AGENT (answers with only "yes" or "no" based on common-sense logic): `;

    const response = await sendMessageOllama(prompt);
    const isYes = response.toLowerCase().replace(/[^a-z]/g, '') === 'yes';
    console.log(`Answer to "${question}": ${isYes ? 'yes' : 'no'}`);
    return isYes;
  }

  private async checkGuess(guess: string): Promise<boolean> {
    console.log(`Checking guess: "${guess}"`);
    const secretWord = gameState.getSecretWord();
    // Note: Not logging the secret word
    const prompt = `
Secret word: "${secretWord}".
User guess: "${guess}"

Check if the User guess matches the secret word exactly, or is a close synonym, plural form, or minor variation.
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
    const isCorrect = response.toLowerCase().replace(/[^a-z]/g, '') === 'correct';
    console.log(`Guess "${guess}" check result: ${isCorrect ? 'correct' : 'incorrect'}`);
    return isCorrect;
  }

  private async getRandomResponse(userInput: string): Promise<string> {
    const history = await this.getHistoryForPrompt();
    const prompt = `
# CONTEXT:

Player's input:
${userInput}

# TASK:
Generate a short playful comment to an irrelevant or nonsensical player input.
Respond to what the player asks or says, but also remind them about the game. 
DO NOT include example questions or guesses.
DO NOT include any other words, explanation, or special formatting.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, this.baseRules);
  }

  private async getPlayfulComment(question: string, answer: string): Promise<string> {
    const history = await this.getHistoryForPrompt();
    const prompt = `
# CONTEXT:

A player asked: 
${question}

The answer is: ${answer}

# TASK:
Respond to the player's question starting with the direct answer "${answer}".
Continue with a short playful comment relevant to what the player asked and the current game state.
DO NOT include any other words, explanation, or special formatting. 
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, "");
  }

  private async getIncorrectGuessResponse(userInput: string): Promise<string> {
    const prompt = `
# CONTEXT:

Player's input:
${userInput}

# TASK:
The word is not what the player is guessing.
Generate a short playful comment for the incorrect guess.
Start by saying that the word is not what the player guessed.
Keep it encouraging but make it clear that the the word is not what the player guessed.
DO NOT include any other words, explanation, or special formatting in your response.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, "");
  }

  private trimInput(input: string): string {
    return input.trim().substring(0, 256);
  }

  public async getInputTypeForMessage(input: string): Promise<MessageTypeEnum> {
    console.log(`Processing new input: "${input}"`);
    const trimmedInput = this.trimInput(input);

    let inputType = await this.getInputType(trimmedInput);

    // If initially classified as a guess, verify that we can extract a word
    if (inputType === MessageTypeEnum.GUESS) {
      const guessedWord = await this.extractGuess(trimmedInput);
      
      if (guessedWord === "NONE") {
        console.log(`Input initially classified as guess but no word detected. Reclassifying as a question: "${trimmedInput}"`);
        // Reclassify as a question if no guessable word found
        inputType = MessageTypeEnum.QUESTION;
      }
    }

    console.log(`Final input type: ${MessageTypeEnum[inputType]}`);
    return inputType;
  }

  public async processUserMessage(userId: string, messageId: string, timestamp: number, input: string, inputType: MessageTypeEnum): Promise<string> {
    console.log(`Processing ${MessageTypeEnum[inputType]} from user: ${userId}, message ID: ${messageId}`);

    const trimmedInput = this.trimInput(input);

    let response: string = '';
    let answerResult: AnswerResultEnum = AnswerResultEnum.UNKNOWN;

    if (inputType == MessageTypeEnum.QUESTION) {
      [response, answerResult] = await this.answerQuestion(trimmedInput);
    } else {
      response = await this.getRandomResponse(trimmedInput);
    }

    const message: HistoryEntry = {
      id: messageId,
      userId: userId,
      timestamp: timestamp,
      messageType: inputType,
      userMessage: input,
      llmMessage: response,
      answerResult: answerResult
    };

    gameState.addToHistory(message);
    console.log(`Message processed and added to history`);

    return response;
  }

  public async checkGuessMessage(userId: string, messageId: string, timestamp: number, input: string): Promise<[string, AnswerResultEnum]> {
    console.log(`Checking guess message from user: ${userId}, message ID: ${messageId}`);

    const trimmedInput = this.trimInput(input);

    let response: string = '';
    let answerResult: AnswerResultEnum = AnswerResultEnum.INCORRECT;

    const guessedWord = await this.extractGuess(trimmedInput);
    const isCorrect = await this.checkGuess(guessedWord);

    if (isCorrect) {
      console.log(`CORRECT GUESS! User ${userId} has won the game!`);
      response = WON_GAME_MESSAGE;
      answerResult = AnswerResultEnum.CORRECT;
    } else {
      response = await this.getIncorrectGuessResponse(trimmedInput);
      answerResult = AnswerResultEnum.INCORRECT;
    }

    const message: HistoryEntry = {
      id: messageId,
      userId: userId,
      timestamp: timestamp,
      messageType: MessageTypeEnum.GUESS,
      userMessage: input,
      llmMessage: response,
      answerResult: answerResult
    };

    gameState.addToHistory(message);
    console.log(`Guess checked (won: ${answerResult == AnswerResultEnum.CORRECT}) and added to history`);

    return [response, answerResult];
  }
}

// Export singleton instance
export const wordGame = new WordGame();
