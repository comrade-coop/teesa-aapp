import fs from 'fs';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from '@langchain/openai';

class GameConfig {
  base_rules: string;
  character_traits: string;

  constructor() {
    this.base_rules = `
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

    this.character_traits = `
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
  }
}

class ChatInterface {
  private chat: any;

  constructor() {
    this.chat = this.anthropic();
  }

  private anthropic() {
    return new ChatAnthropic({
      model: 'claude-3-sonnet-20240229',
      temperature: 0.1,
    });
  }

  private openai() {
    return new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.1,
    });
  }

  async ask(prompt: string, systemContent: string | undefined = undefined) {
    const messages = [];

    if (systemContent) {
      messages.push(new SystemMessage(systemContent));
    }

    messages.push(new HumanMessage(prompt));

    const response = await this.chat.invoke(messages);

    const parser = new StringOutputParser();
    return await parser.invoke(response);
  }
}

class WordGuessingGame {
  private config: GameConfig;
  private chat: ChatInterface;
  private wordList: string[];
  private secretWord: string;
  private conversationHistory: any[];

  constructor() {
    this.config = new GameConfig();
    this.chat = new ChatInterface();

    // Load the words and select a random one
    this.wordList = this.loadWords();
    this.secretWord = this.selectRandomWord();

    // Keep conversation history
    this.conversationHistory = [];
  }

  private loadWords() {
    const contents = fs.readFileSync('word_list.txt', 'utf-8');
    return contents.split('\n').map((w) => w.trim()).filter(Boolean);
  }

  private selectRandomWord() {
    const randomIndex = Math.floor(Math.random() * this.wordList.length);
    return this.wordList[randomIndex];
  }

  private getSystemRules(includeCharacter = false) {
    if (includeCharacter) {
      return this.config.base_rules + this.config.character_traits;
    }

    return this.config.base_rules;
  }

  private async fixSpelling(text: string) {
    const prompt = `
    Fix the spelling and grammar of the text below. 
    Translate it to English if it's in another language. 
    Do not include any other words or explanation.
    ---
    ${text}
    `;

    return this.chat.ask(prompt);
  }

  private async getInputType(userInput: string) {
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

    const response = await this.chat.ask(prompt, this.getSystemRules());
    return response.toLowerCase();
  }

  private async getRandomResponse(userInput: string) {
    const prompt = `
    Previous conversation:
    ${JSON.stringify(this.conversationHistory)}

    Player's input:
    ${userInput}

    ---
    Generate a short snarky response to an irrelevant or nonsensical player input.
    Make it clear they should ask a proper question or make a guess.
    Respond with ONLY the comment, nothing else.
    `;

    return this.chat.ask(prompt, this.getSystemRules(true));
  }

  private async extractGuess(userInput: string) {
    const prompt = `
    Extract the exact word being guessed from this input: "${userInput}"
    Respond with ONLY the guessed word, nothing else.
    Respond with "NONE" if you cannot extract a word from the input.
    `;

    return this.chat.ask(prompt, this.getSystemRules());
  }

  private async validateQuestion(question: string) {
    const prompt = `
    Previous conversation: 
    ${JSON.stringify(this.conversationHistory)}

    Player's question:
    "${question}"
    
    ---
    Is this a valid yes/no question trying to guess 
    characteristics, properties, behaviors, attributes, or the nature 
    of what the secret word describes?
    
    The question should be rejected ONLY if it:
    - It's not a question
    - It's not about the secret word and what it represents
    - Asks about the spelling of the word
    - Asks about the length of the word
    
    If none of these apply, respond with ONLY "yes", nothing else.
    If any of these apply, respond with "no" and explain which rule it violates.
    `;

    const response = await this.chat.ask(prompt, this.getSystemRules());
    return [response.toLowerCase().startsWith('yes'), response];
  }

  private async answerQuestion(question: string) {
    // Get yes/no answer with explanation
    const isYes = await this.getAnswer(question);
    const yesNo = isYes ? 'Yes' : 'No';

    // Get playful comment
    const comment = await this.getPlayfulComment(question, yesNo);

    const fullResponse = `${yesNo}! ${comment}`;
    this.conversationHistory.push({ question, answer: fullResponse });

    return fullResponse;
  }

  private async getAnswer(question: string) {
    // Step 1: get a detailed explanation
    const explanationPrompt = `
    The secret word is "${this.secretWord}".
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

    const explanation = await this.chat.ask(explanationPrompt, this.getSystemRules());
    // console.log(`Explanation: ${explanation}`);

    // Step 2: get a final yes/no
    const yesNoPrompt = `
    Player's question: 
    ${question}

    Answer explanation:
    ${explanation}

    ---
    Based on the explanation respond with ONLY "yes" or "no", nothing else.
    `;
    const yesNo = await this.chat.ask(yesNoPrompt, this.getSystemRules());

    return yesNo.toLowerCase() === 'yes';
  }

  private async getPlayfulComment(question: string, answer: string) {
    const prompt = `
    Previous conversation: 
    ${JSON.stringify(this.conversationHistory)}

    A player asked: 
    ${question}

    The answer is: ${answer}
    
    Generate a short comment in your typical style to add after the answer response.
    DO NOT include Yes/No in your response - just the comment. DO NOT include any other words or explanation.
    `;

    return this.chat.ask(prompt, this.getSystemRules(true));
  }

  private async checkGuess(guess: string) {
    const prompt = `
    The secret word is "${this.secretWord}".
    The user guessed: "${guess}"
    
    Determine if this guess is correct, allowing for close synonyms or similar words with a little leeway.
    Remember this is a guessing game and the guess should be accurate to be considered correct.
    Respond with ONLY "correct" or "incorrect", nothing else.
    `;

    const response = await this.chat.ask(prompt, this.getSystemRules());
    return response.toLowerCase() === 'correct';
  }

  private async getIncorrectGuessResponse() {
    const prompt = `
    Generate a short response in your typical style for an incorrect guess.
    Keep it encouraging but make it clear they haven't guessed correctly.
    DO NOT include any other explanation.
    `;

    return this.chat.ask(prompt, this.getSystemRules(true));
  }

  async processUserInput(input: string) {
    const userInput = (await this.fixSpelling(input)).trim();
    const inputType = await this.getInputType(userInput);

    if (inputType === 'question') {
      const answer = await this.answerQuestion(userInput);
      console.log(`Teesa: ${answer}`);
    } else if (inputType === 'guess') {
      const guessedWord = await this.extractGuess(userInput);
      if (await this.checkGuess(guessedWord)) {
        console.log("Congratulations! You've guessed the word correctly!");
      } else {
        const response = await this.getIncorrectGuessResponse();
        console.log(`Teesa: ${response}`);
      }
    } else {
      const response = await this.getRandomResponse(userInput);
      console.log(`Teesa: ${response}`);
    }
  }
}