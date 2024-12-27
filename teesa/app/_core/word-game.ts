import 'server-only'
import { LlmMessage, llmState } from './game-state';
import { sendMessage } from './llm-client';
import { SUCCESS_MESSAGE } from './game-const';

const baseRules = `
Your name is Teesa.
You are an AI agent who is the host of a word guessing game. 
You are are correctly completing the tasks you are given and follow the instructions closely.
                                
GAME RULES:
You select a random secter word and the players try to guess it by asking yes/no questions about what it describes. 
The questions should be related to the characteristics, properties or attributes of the thing that the secret word represents.
All secret words are nouns.
The player can make direct guesses at any time, and you will tell them if they're correct or not. 
Asking about the spelling of the secret word or parts of it is NOT allowed.
Asking about the length of the secret word is NOT allowed.
Asking the same question multiple times is NOT allowed.
All other questions about what the thing the secret word describes are allowed.
`;

const characterTraits = `
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
- Using catchphrases and distinctive expressions
- Balancing sass with genuine warmth and caring
- Making jokes about partying and having fun
- Being dramatic and over-the-top when appropriate
- Being original and not repeating yourself
`;


function getSystemRules(includeCharacter = false) {
  if (includeCharacter) {
    return baseRules + characterTraits;
  }

  return baseRules;
}

async function getHistoryForPrompt() {
  const history = await llmState.getHistory();

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

async function fixSpelling(text: string): Promise<string> {
  const prompt = `
  Fix the spelling and grammar of the text below. 
  Translate it to English if it's in another language. 
  Do not include any other words or explanation.
  ---
  ${text}
  `;

  return sendMessage(prompt);
}

async function getInputType(userInput: string): Promise<string> {
  const prompt = `
  Determine if this input is a question, guess, or neither: 
  ${userInput}

  ---
  For a "question": Must be a yes/no question about the 
  characteristics, properties, behaviors, attributes, or the nature of what the secret word describes.

  For a "guess": Must clearly indicate attempting to guess the word using phrases like:
      "guess: ...", "My guess is...", "I'm guessing...", "Is the word...", "I guess it is...", etc.

  Everything else is considered "other".

  Respond with ONLY "question", "guess", or "other".
  `;

  const response = await sendMessage(prompt, getSystemRules());
  return response.toLowerCase();
}

async function getRandomResponse(userInput: string): Promise<string> {
  const history = await getHistoryForPrompt();
  const prompt = `
  Previous conversation:
  ${JSON.stringify(history)}

  Player's input:
  ${userInput}

  ---
  Generate a short snarky response to an irrelevant or nonsensical player input.
  Make it clear they should ask a proper question or make a guess.
  Respond with ONLY the comment, nothing else.
  `;

  return sendMessage(prompt, getSystemRules(true));
}

async function extractGuess(userInput: string): Promise<string> {
  const prompt = `
  Extract the exact word being guessed from this input: "${userInput}"
  Respond with ONLY the guessed word, nothing else.
  Respond with "NONE" if you cannot extract a word from the input.
  `;

  return sendMessage(prompt, getSystemRules());
}

async function answerQuestion(question: string): Promise<string> {
  // Get yes/no answer with explanation
  const isYes = await getAnswer(question);
  const yesNo = isYes ? 'Yes' : 'No';

  // Get playful comment
  const comment = await getPlayfulComment(question, yesNo);

  const fullResponse = `${yesNo}! ${comment}`;
  return fullResponse;
}

async function getAnswer(question: string): Promise<boolean> {
  const secretWord = await llmState.getSecretWord();

  // Step 1: get a detailed explanation
  const explanationPrompt = `
  The secret word is "${secretWord}".
  Player's question: 
  ${question}
  
  ---
  Consider that the question is asking about the secret word, even if it's not obvious.
  Analyze the question in relation to how an average person would understand and use this word.
  Take into account both concrete and abstract interpretations of the secret word.
  If uncertain, lean towards the interpretation that would be most helpful for the player.
  
  Evaluate the properties and characteristics comprehensively:
  - Physical attributes (size, shape, weight, color, texture, material, etc.)
  - Functional aspects (purpose, uses, applications)
  - Abstract qualities (emotions, concepts, symbolism)
  - Cultural significance and common associations
  - Taxonomic categories and classifications
  - Temporal aspects (if relevant)
  - Geographic/environmental context (if applicable)
  - Behavioral traits (for animate objects)

  Guidelines for answering:
  - Be factually accurate while allowing reasonable flexibility
  - For ambiguous questions, use the most widely accepted interpretation
  - Consider both literal and commonly understood figurative meanings
  - Account for regional and cultural variations in understanding
  - Base answers on general knowledge, not edge cases

  Provide a clear response, thinking step by step.
  `;

  const explanation = await sendMessage(explanationPrompt, getSystemRules());

  // Step 2: get a final yes/no
  const yesNoPrompt = `
  Player's question: 
  ${question}

  Answer explanation:
  ${explanation}

  ---
  Based on the explanation respond with ONLY "yes" or "no", nothing else.
  `;
  const yesNo = await sendMessage(yesNoPrompt, getSystemRules());

  return yesNo.toLowerCase() === 'yes';
}

async function getPlayfulComment(question: string, answer: string): Promise<string> {
  const history = await getHistoryForPrompt();
  const prompt = `
  Previous conversation: 
  ${JSON.stringify(history)}

  A player asked: 
  ${question}

  The answer is: ${answer}
  
  Generate a short comment in your typical style to add after the answer response.
  DO NOT include Yes/No in your response - just the comment. DO NOT include any other words or explanation.
  `;

  return sendMessage(prompt, getSystemRules(true));
}

async function checkGuess(guess: string): Promise<boolean> {
  const secretWord = await llmState.getSecretWord();
  const prompt = `
  The secret word is "${secretWord}".
  The user guessed: "${guess}"
  
  Determine if this guess is correct, allowing for close synonyms or similar words with a little leeway.
  Remember this is a guessing game and the guess should be accurate to be considered correct.
  Respond with ONLY "correct" or "incorrect", nothing else.
  `;

  const response = await sendMessage(prompt, getSystemRules());
  return response.toLowerCase() === 'correct';
}

async function getIncorrectGuessResponse(): Promise<string> {
  const prompt = `
  Generate a short response in your typical style for an incorrect guess.
  Keep it encouraging but make it clear they haven't guessed correctly.
  DO NOT include any other explanation.
  `;

  return sendMessage(prompt, getSystemRules(true));
}

export async function processUserInput(userId: string, messageId: string, timestamp: number, input: string): Promise<string> {
  const userInput = (await fixSpelling(input)).trim();
  const inputType = await getInputType(userInput);

  let response: string = '';

  if (inputType === 'question') {
    response = await answerQuestion(userInput);
  } else if (inputType === 'guess') {
    const guessedWord = await extractGuess(userInput);

    if (await checkGuess(guessedWord)) {
      llmState.setGameEnded();
      response = SUCCESS_MESSAGE;
    } else {
      response = await getIncorrectGuessResponse();
    }
  } else {
    response = await getRandomResponse(userInput);
  }

  const message: LlmMessage = {
    id: messageId,
    userId: userId,
    timestamp: timestamp,
    userMessage: input,
    llmMessage: response
  };

  llmState.addToHistory(message);

  return response;
}