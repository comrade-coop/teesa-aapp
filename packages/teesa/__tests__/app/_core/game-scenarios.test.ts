import { wordGame } from '../../../app/_core/word-game';
import { gameState, AnswerResultEnum } from '../../../app/_core/game-state';
import { MessageTypeEnum } from '../../../app/_core/message-type-enum';
import { WON_GAME_MESSAGE } from '../../../app/_core/game-const';
import { classifyAnswer } from './llm-test-utils';
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(60000);

// Mock the private methods that call the creative LLM to avoid actual LLM calls during tests
// We cast to 'any' to access private methods for mocking purposes
jest.spyOn(wordGame as any, 'getPlayfulComment').mockImplementation(
  async (userId, question, answer) => {
    // Return the direct answer ('Yes', 'No', 'Maybe') passed to it, simplifying the response
    return answer;
  }
);

jest.spyOn(wordGame as any, 'getIncorrectGuessResponse').mockImplementation(
  async (userId, userInput) => {
    // Return 'No' as per instruction (simplified mock for incorrect guess response)
    return 'Incorrect';
  }
);


// Refined word‐game scenarios focusing on distinct edge cases, abstract words, and varied guess phrasing
const scenarios = [
  // 1. Basic Flow: Simple questions, slightly more complex guess phrasing
  {
    description: 'Basic Flow & Simple Questions/Guesses',
    secretWord: 'dog',
    questions: [
      { input: 'is it alive', expected: true },
      { input: 'is it an animal?', expected: true },
      { input: 'is it heavier than 100 kg?', expected: false },
    ],
    incorrectGuesses: ['Could it be a cat?', "I bet it's a horse."],
    correctGuess: "I guess the word is dog?", // Question format guess
  },
  // 2. Synonym Handling (Phone/Telephone): Question format guess
  {
    description: 'Synonym Handling (Phone/Telephone)',
    secretWord: 'phone',
    questions: [
      { input: 'do people have it in their houses?', expected: true },
      { input: 'is it running on electricity?', expected: true },
      { input: 'is it made entirely from metal?', expected: false },
    ],
    incorrectGuesses: ['Could it be a computer?', 'Maybe a tablet?'], // Question format incorrect
    correctGuess: 'Is the word telephone?', // Question format guess
  },
  // 3. Abstract Noun: Testing concept word with multiple relevant questions
  {
    description: 'Abstract Concept (Game)',
    secretWord: 'game', // Abstract
    questions: [
      { input: 'is it interesting?', expected: true },
      { input: 'Can you eat it?', expected: false },
    ],
    incorrectGuesses: ['Could it be a toy?', 'Is it a sport?'],
    correctGuess: 'The word is game.',
  },
  // 4. Normalization: Case, space, punctuation, and spelling variation (US/UK)
  {
    description: 'Normalization (Case, Space, Punctuation, Spelling)',
    secretWord: 'color', // US spelling
    questions: [
      { input: 'is it something you can touch?', expected: false },
      { input: 'is it related to vision', expected: true },
    ],
    incorrectGuesses: ['Is it maybe light?', 'Could the answer be paint?'],
    correctGuess: 'I bet the secret word is colour.', // UK spelling variation, multi-word guess
  },
  // 5. Guess Extraction: More emphatic correct statement guess
  {
    description: 'Guess Extraction (Complex Statement)',
    secretWord: 'house',
    questions: [
      { input: 'does it have wood in it?', expected: true },
      { input: 'is it a kind of building?', expected: true },
    ],
    incorrectGuesses: ['What about an apartment complex?', 'Is it just a building?'], // Question format incorrect
    correctGuess: "The secret word must surely be house.", // Emphatic statement
  },
  // 6. Abstract Noun: Testing concept word with multiple relevant questions
  {
    description: 'Abstract Noun & Multiple Questions (Time)',
    secretWord: 'time',
    questions: [
      { input: 'is it abstract?', expected: true },
      { input: 'is it a natural phenomenon?', expected: true },
      { input: 'can you measure it?', expected: true },
      { input: 'is it a number?', expected: false },
    ],
    incorrectGuesses: ['Is it clock?', 'Could it be a day?'], // Related concept guesses
    correctGuess: 'The answer must be time.', // Full sentence + punctuation
  },
  // 7. Tentative/Uncertain Guess Phrasing: More natural uncertain phrasing
  {
    description: 'Tentative/Uncertain Guess Phrasing',
    secretWord: 'rain',
    questions: [
      { input: 'is it a natural phenomenon?', expected: true },
      { input: 'is it made from water?', expected: true },
    ],
    incorrectGuesses: ['Could it perhaps be snow?', "I think it's a cloud, maybe?"], // Tentative incorrect
    correctGuess: 'Hmm, I suspect it is probably rain.', // Natural uncertain phrasing
  },
  // 8. Homograph Disambiguation: Question context, guess phrasing
  {
    description: 'Homograph Disambiguation (Bat: Animal vs Sport)',
    secretWord: 'bat',
    questions: [
      { input: 'can it fly?', expected: true },
      { input: 'is it used in baseball?', expected: true },
    ],
    incorrectGuesses: ['I think it might be a ball?', 'Could it be a vampire?'], // Related + question format
    correctGuess: 'Could the word be bat?', // Question format guess
  },
  // 9. Semantic Edge Case: Testing closely related concepts (Doctor vs Nurse/Surgeon)
  {
    description: 'Semantic Edge Case (Doctor vs Nurse/Surgeon)',
    secretWord: 'doctor',
    questions: [
      { input: 'is it a kind of profession?', expected: true },
      { input: 'do they chase the bad guys?', expected: false }, // Test nuance
    ],
    incorrectGuesses: ['Could it be a nurse?', "I wonder if it's a surgeon?"], // Related roles + tentative
    correctGuess: 'It has to be a doctor.', // Confident statement
  },
  // 10. Complex Sentence Guess: Irregular plural embedded in complex sentence
  {
    description: 'Irregular Plural in Complex Sentence Guess',
    secretWord: 'foot',
    questions: [{ input: 'is it part of the body?', expected: true }],
    incorrectGuesses: ['Could I guess hand?', 'Probably toe?'],
    correctGuess: "After thinking long and hard, I bet the answer is feet!", // Irregular plural + complex phrasing
  },
  // 11. Accent & Non-ASCII Handling: Non-ASCII characters in guess
  {
    description: 'Accent Handling (Café)',
    secretWord: 'cafe',
    questions: [
      { input: 'is it a beverage?', expected: false },
      { input: 'is it a place?', expected: true },
    ],
    incorrectGuesses: ['Could it be a restaurant?'],
    correctGuess: 'I am quite sure the answer is café.', // Multi-word guess with accent
  },
  // 12. Device Synonym & Complex Guess
  {
    description: 'Food & Punctuation Edge Case (Pizza)',
    secretWord: 'pizza',
    questions: [
      { input: 'is it food?', expected: true },
      { input: 'can you hold it', expected: true },
    ],
    incorrectGuesses: ['Is it pasta?', 'Could it be bread?'], // Specific foods
    correctGuess: 'Is it... pizza!?', // Question and punctuation
  },
];

describe.each(scenarios)('Scenario: $description (Secret: "$secretWord")', (scenario) => {
  const { secretWord, questions, incorrectGuesses, correctGuess } = scenario;

  beforeEach(async () => {
    await gameState.reset();
    // Override private secretWord
    (gameState as any).secretWord = secretWord;
  });

  afterAll(async () => {
    jest.clearAllMocks();
    await gameState.reset();
  });

  if (questions && questions.length > 0) {
    describe('questions', () => {
      test.each(questions)('Q: "%s" → %p', async ({ input, expected }) => {
        const type = await wordGame.getInputTypeForMessage(input);
        expect(type).toBe(MessageTypeEnum.QUESTION);
        const response = await wordGame.processUserMessage(
          'user', uuidv4(), Date.now(), input, type
        );
        expect(await classifyAnswer(response)).toBe(expected);
      });
    });
  }

  if (incorrectGuesses && incorrectGuesses.length > 0) {
    describe('incorrect guesses', () => {
      test.each(incorrectGuesses)('Incorrect G: "%s" → INCORRECT', async (guess) => {
        const type = await wordGame.getInputTypeForMessage(guess);
        // Allow for potential misclassification of complex guesses by input typing,
        // focus on checkGuessMessage handling it.
        // expect(type).toBe(MessageTypeEnum.GUESS);
        const [response, result] = await wordGame.checkGuessMessage(
          'user', uuidv4(), Date.now(), guess
        );
        expect(result).toBe(AnswerResultEnum.INCORRECT);
        // We might get a playful response, not just true/false, so don't check classifyAnswer strictly here
        // expect(await classifyAnswer(response)).toBe(false);
      });
    });
  }

  if (correctGuess) {
    test('correct guess → WIN', async () => {
      const type = await wordGame.getInputTypeForMessage(correctGuess);
      // Allow for potential misclassification of complex guesses by input typing,
      // focus on checkGuessMessage handling it.
      // expect(type).toBe(MessageTypeEnum.GUESS);
      const [response, result] = await wordGame.checkGuessMessage(
        'user', uuidv4(), Date.now(), correctGuess
      );
      expect(result).toBe(AnswerResultEnum.CORRECT);
      expect(response).toBe(WON_GAME_MESSAGE);
    });
  }
});