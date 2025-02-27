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
- You MUST NOT use descriptions in *asterisks* to indicate actions/gestures
- You MUST NOT describe physical movements or actions
- You MUST focus on direct dialogue without stage directions like *laughs* or *smiles*
- Keep responses natural and conversational, like a real chat
- Be concise and clear in your communication
- Maintain consistent voice and personality throughout
- You can be fun, playful, and engaging without describing your actions in *asterisks*
- Always respond in English
`;

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
- "alive" -> "question" (asking about a property)
- "flower" -> "guess" (direct noun)
- "door?" -> "guess" (direct noun)
- "is it a plant" -> "question" (asking about category since using indefinite article "a")
- "is it car" -> "guess" (direct noun, not asking about category or property)
- "does it grow in gardens?" -> "question" (asking about behavior/property)
- "is it made of metal" -> "question" (asking about material property)
- "is it abstract" -> "question" (asking about abstract property)
- "is your word about the future of economy" -> "question" (asking about abstract concepts and categories)
- "do humans use it in their everyday lives" -> "question" (asking about usage)

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

    const fullResponse = `${comment}`;
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
Generate a short playful comment to an irrelevant or nonsensical player input.
Respond to what the player asks or says, but also remind them about the game. 
DO NOT include example questions or guesses.
DO NOT include any other words, explanation, or special formatting.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, this.baseRules + '\n\n' + this.characterTraits);
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
Respond to the player's question starting with the direct answer "${answer}".
Continue with a short playful comment relevant to what the player asked and the current game state.
DO NOT include any other words, explanation, or special formatting. 
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, this.characterTraits);
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
The word is not what the player is guessing.
Generate a short playful comment for the incorrect guess.
Start by saying that the word is not what the player guessed.
Keep it encouraging but make it clear that the the word is not what the player guessed.
DO NOT include any other words, explanation, or special formatting in your response.
Respond with ONLY the comment, nothing else.

# TEESA RESPONSE:`;

    return sendMessageEliza(prompt, this.characterTraits);
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
