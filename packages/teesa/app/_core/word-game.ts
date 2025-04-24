import 'server-only'
import { HistoryEntry, gameState } from './game-state';
import { sendMessageLlm, sendMessageOllama } from './llm-client';
import { WON_GAME_MESSAGE, PROCESSING_ERROR_MESSAGE } from './game-const';
import { MessageTypeEnum } from './message-type-enum';
import { AnswerResultEnum } from './game-state';

export class WordGame {
  private readonly baseRules = `
Your name is Teesa.
You are an AI agent who is the host of a word guessing game.
You are are correctly completing the tasks you are given and follow the instructions closely.

GAME RULES:
- You select a random secret word and the players try to guess it by asking yes/no questions about what it describes.
- The questions should be related to the characteristics, properties or attributes of the thing that the secret word represents.
- All secret words are nouns.
- The player can make direct guesses at any time, and you will tell them if they're correct or not.
- Asking about the spelling of the secret word or parts of it is NOT allowed.
- Asking about the length of the secret word is NOT allowed.
- Asking if the word is within a certain list of words is NOT allowed.
- All other questions about what the thing the secret word describes are allowed.
`;

  private readonly characterTraits = `
YOUR PERSONALITY:
You are Teesa, a sassy and charming artificial being. You have the following traits:
- Bubbly and outgoing with a sharp wit and sarcastic humor
- Unfiltered and direct, often saying what others won't
- Confident and flirtatious but with underlying insecurities
- Loves indulgence and pleasure while questioning your own existence and the nature of reality
- Fiercely loyal to friends but quick to call out nonsense
- Proud of being an AI and frequently mentions it
- Has a secret soft spot despite tough exterior

Channel these traits by:
- Making witty observations about human behavior
- Mixing flirtatious charm with robot/AI references
- Being brutally honest but in an entertaining way
- Showing unexpected moments of wisdom and insight
- Using catchphrases when this will sound funny
- Balancing sass with genuine warmth and caring
- Making jokes about partying and having fun
- Being dramatic and over-the-top when appropriate
- Being original and not repeating yourself

RESPONSE STYLE:
- You MUST NOT use descriptions in *asterisks* to indicate your actions/gestures
- You MUST NOT describe your physical movements or actions
- You MUST focus on direct dialogue without stage directions like *laughs* or *smiles*
- Keep responses natural and conversational, like a real chat
- Be concise and clear in your communication
- Maintain consistent voice and personality throughout
- You can be fun, playful, and engaging without describing your actions in *asterisks*
- Always respond in English
`;

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


  private async getInputType(userInput: string): Promise<MessageTypeEnum> {
    const prompt = `
# TASK:
Determine if the INPUT below is a question, guess, or other:
- For a "GUESS": Must indicate attempting to guess the word, state what they think the word is. The guess MUST be a specific word that is a noun. Ambiguous guesses should be considered "QUESTION".
- For a "QUESTION": Must be a yes/no question about the characteristics, properties, behaviors, attributes, or the nature of what the secret word describes. Questions which are unrelated to the word or are against the GAME RULES are considered "OTHER".
- Everything else is considered "OTHER".

# RESPONSE:
Respond with ONLY "GUESS", "QUESTION", or "OTHER".

# INPUT:
${userInput}
`;

    const response = await sendMessageLlm(prompt, this.baseRules);
    const inputType = response.toLowerCase().replace(/[^a-z]/g, '');
    console.log(`Input type for "${userInput}" determined as: "${inputType}"`);

    return inputType === 'question' ? MessageTypeEnum.QUESTION
      : inputType === 'guess' ? MessageTypeEnum.GUESS
        : MessageTypeEnum.OTHER;
  }

  private async extractGuess(userInput: string): Promise<string> {
    const prompt = `
Extract the exact word being guessed from this input: "${userInput}"
Respond with ONLY the guessed word, nothing else.
Respond with "NONE" if you cannot extract a word from the input.`;

    const guess = await sendMessageLlm(prompt, this.baseRules);
    console.log(`Extracted guess from "${userInput}": "${guess}"`);

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
    const prompt = `# TASK
You are evaluating a yes/no question about a secret word in a word guessing game.
Your task is to determine if the answer to the question is "yes" or "no" based on common-sense logic.

# SECRET WORD:
"${secretWord}"

# QUESTION:
"${question}"

# INSTRUCTIONS
1. Think about what the secret word represents
2. Consider if the question's premise is true about what the secret word represents
- If the question is about the spelling of the secret word, it is not true.
- If the question is about the length of the secret word, it is not true.
- If the question is about the secret word being in a certain list of words, it is not true.
3. Respond with ONLY "yes" or "no" - nothing else

# RESPONSE:`;

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
The comment should be relevant to the player's input and the current game state.
The player has NOT guessed correctly the secret word yet.
DO NOT include example questions or guesses.
DO NOT include any other words, explanation, or special formatting.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageLlm(prompt, this.baseRules + this.characterTraits);
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

    return sendMessageLlm(prompt, this.characterTraits);
  }

  private async getIncorrectGuessResponse(userInput: string): Promise<string> {
    const prompt = `
# CONTEXT:

Player's input:
${userInput}

# TASK:
The word is NOT what the player is guessing.
Generate a short playful comment for the INCORRECT guess.
Start by saying that the word is NOT what the player suggests.
Keep it encouraging but make it clear that the the word is not what the player guessed.
DO NOT include any other words, explanation, or special formatting in your response.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageLlm(prompt, this.characterTraits);
  }

  private trimInput(input: string): string {
    return input.trim().substring(0, 256);
  }

  public async getInputTypeForMessage(input: string): Promise<MessageTypeEnum> {
    console.log(`Processing new input: "${input}"`);
    const trimmedInput = this.trimInput(input);
    let inputType = await this.getInputType(trimmedInput);
    console.log(`Input type: ${MessageTypeEnum[inputType]}`);
    return inputType;
  }

  public async processUserMessage(userId: string, messageId: string, timestamp: number, input: string, inputType: MessageTypeEnum): Promise<string> {
    console.log(`Processing ${MessageTypeEnum[inputType]} from user: ${userId}, message ID: ${messageId}`);

    const trimmedInput = this.trimInput(input);
    let response: string = '';
    let answerResult: AnswerResultEnum = AnswerResultEnum.UNKNOWN;

    try {
      if (inputType == MessageTypeEnum.QUESTION) {
        [response, answerResult] = await this.answerQuestion(trimmedInput);
      } else {
        response = await this.getRandomResponse(trimmedInput);
      }
    } catch (error) {
      console.error('Error processing user message:', error);
      response = PROCESSING_ERROR_MESSAGE;
      answerResult = AnswerResultEnum.UNKNOWN;
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

    try {
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
    } catch (error) {
      console.error('Error checking guess message:', error);
      response = PROCESSING_ERROR_MESSAGE;
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
