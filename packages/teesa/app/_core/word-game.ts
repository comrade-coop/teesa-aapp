import 'server-only'
import { HistoryEntry, gameState } from './game-state';
import { sendMessageLlm, sendMessageCreativeLlm, sendMessageOllama } from './llm-client';
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
- Questions and guesses in languages other than English are not allowed.
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
Classify the player's input into one of three categories: GUESS, QUESTION, or OTHER.

GUESS:
- The player is attempting to guess the secret word.
- It must state the word they think it is, as a specific noun or noun phrase.
- Common guess patterns include:
  * Single-word guesses (e.g., 'car', 'dog', 'café', 'children')
  * Phrases like 'I think it is X', 'Maybe it is X', 'It is X', 'Is it an X', or 'Is the word you are thinking of X?'.
- Do NOT treat vague statements, descriptions, or property guesses (e.g., 'something with wheels') as GUESS.
- Do NOT treat numeric inputs or non-noun words (e.g., '123', 'running') as GUESS.

QUESTION:
- A yes/no question about the secret thing's characteristics, properties, behavior, attributes, or nature.
- It must be answerable with YES or NO.
- Typically starts with yes/no words: is, are, can, could, would, should, does, do, will, did, has, have.
- Must NOT violate game rules: no questions about spelling, letters, word length, list membership, or name details.
- Single-word questions (e.g., 'Heavy?') are valid if they're clearly yes/no.
- Do NOT treat other question types ('what', 'where', 'why', 'how') as QUESTION.

OTHER:
- Any input not matching GUESS or QUESTION.
- Includes greetings, non-English text, nonsensical inputs, disallowed questions, ambiguous phrasing, and generic descriptions.

# RESPONSE:
Respond with ONLY one of: GUESS, QUESTION, or OTHER.

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
Respond with "NONE" if you cannot extract a specific word being guessed from the input.`;

    const guess = await sendMessageLlm(prompt, this.baseRules);
    console.log(`Extracted guess from "${userInput}": "${guess}"`);

    return guess;
  }

  private async fixSpelling(text: string): Promise<string> {
    const prompt = `
Fix the spelling, grammar, and punctuation of the text below.
Do not include any other words or explanation.
---
${text}`;

    return sendMessageLlm(prompt);
  }

  private async answerQuestion(question: string): Promise<[string, AnswerResultEnum]> {    
    // Get yes/no answer
    const isYes = await this.getAnswer(question);
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
ROLE: You are the host of a "20 Questions" game. Your goal is to answer yes/no questions about a secret word accurately and fairly, based on common-sense knowledge. 

TASK: Determine whether to answer the following yes/no question about a secret word with YES or NO.

You will receive:
- SECRET WORD: the noun to evaluate.
- QUESTION: a yes/no question about that noun.

GUIDELINES:
1. Use common-sense logic about the secret word and its meaning. Respond as an average person would.
2. Do not overthink and over-analyze the question. 
3. Avoid overly literal interpretations.
4. Respond with ONLY the word YES or NO, without any additional text.
5. If it is really impossible to answer the question with either YES or NO, respond with MAYBE.

SECRET WORD: "${secretWord}"
QUESTION: "${question}"

RESPONSE:
`;

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
# TASK:
Determine if Word 2 is essentially the same noun as Word 1 or it is a synonym of the same word, ignoring differences in plurality (singular/plural) and common spelling variations (e.g., US/UK English).

# EXAMPLES:
- Word 1: "dog", Word 2: "dogs" -> YES
- Word 1: "fish", Word 2: "fishes" -> YES
- Word 1: "child", Word 2: "children" -> YES
- Word 1: "color", Word 2: "colour" -> YES
- Word 1: "sheep", Word 2: "animal" -> NO
- Word 1: "tree", Word 2: "leaf" -> NO
- Word 1: "book", Word 2: "paper" -> NO
- Word 1: "chef", Word 2: "cook" -> YES
- Word 1: "chef", Word 2: "waiter" -> NO
- Word 1: "day", Word 2: "night" -> NO

# INSTRUCTIONS:
- Respond "YES" only if the words are essentially the same noun, or they are synonyms, or they are variations of the same noun (plural/singular, spelling).
- Respond "NO" in all other cases.
- Respond with ONLY YES or NO. Do not include explanations or any other text.

# WORDS TO COMPARE:
Word 1: "${secretWord}"
Word 2: "${guess}"

# RESPONSE:
`;

    const response = await sendMessageOllama(prompt);
    const isCorrect = response.toLowerCase().replace(/[^a-z]/g, '') === 'yes';
    console.log(`Guess "${guess}" check result: ${isCorrect ? 'correct' : 'incorrect'}`);
    return isCorrect;
  }

  private async getRandomResponse(userInput: string): Promise<string> {
    const history = await this.getHistoryForPrompt();
    const prompt = `
# CONTEXT:

Player wrote:
${userInput}

# TASK:
Generate a short playful comment to what the player wrote. This exchange is not part of the game.
The comment should be relevant to what the player wrote and the current game state.
Remind the player about the game.
The player has NOT guessed correctly the secret word yet.

DO NOT include any other words, explanation, or special formatting.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageCreativeLlm(prompt, this.baseRules + this.characterTraits);
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

    return sendMessageCreativeLlm(prompt, this.characterTraits);
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

    return sendMessageCreativeLlm(prompt, this.characterTraits);
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

    const originalInput = this.trimInput(input); // Keep original for history
    let correctedInput = originalInput; // Default to original
    let response: string = '';
    let answerResult: AnswerResultEnum = AnswerResultEnum.UNKNOWN;

    try {
      correctedInput = await this.fixSpelling(originalInput);
      console.log(`Original input: "${originalInput}"`);
      console.log(`Corrected input: "${correctedInput}"`);

      if (inputType == MessageTypeEnum.QUESTION) {
        [response, answerResult] = await this.answerQuestion(correctedInput); // Use corrected input
      } else {
        response = await this.getRandomResponse(correctedInput); // Use corrected input
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
      userMessage: originalInput,
      llmMessage: response,
      answerResult: answerResult
    };

    gameState.addToHistory(message);
    console.log(`Message processed and added to history`);

    return response;
  }

  public async checkGuessMessage(userId: string, messageId: string, timestamp: number, input: string): Promise<[string, AnswerResultEnum]> {
    console.log(`Checking guess message from user: ${userId}, message ID: ${messageId}`);

    const originalInput = this.trimInput(input); // Keep original for history
    let correctedInput = originalInput; // Default to original
    let response: string = '';
    let answerResult: AnswerResultEnum = AnswerResultEnum.INCORRECT;

    try {
      // Fix spelling at the beginning
      correctedInput = await this.fixSpelling(originalInput);
      console.log(`Original input: "${originalInput}"`);
      console.log(`Corrected input: "${correctedInput}"`);

      const guessedWord = await this.extractGuess(correctedInput);

      if (guessedWord.toLowerCase().replace(/[^a-z]/g, '') === 'none') {
        console.log(`Could not extract a specific guess from "${correctedInput}"`);
        const prompt = `
# TASK:
Respond that you are not able to understand what exactly is the player's guess. Explain how the player should properly phrase their guess based on the game rules.

Player wrote:
${correctedInput}

# RESPONSE:
`;
        response = await sendMessageCreativeLlm(prompt, this.baseRules + this.characterTraits);
        answerResult = AnswerResultEnum.INCORRECT;
      } else {
        const isCorrect = await this.checkGuess(guessedWord);
        if (isCorrect) {
          console.log(`CORRECT GUESS! User ${userId} has won the game!`);
          response = WON_GAME_MESSAGE;
          answerResult = AnswerResultEnum.CORRECT;
        } else {
          response = await this.getIncorrectGuessResponse(correctedInput); // Use corrected input
          answerResult = AnswerResultEnum.INCORRECT;
        }
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
      userMessage: originalInput,
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
