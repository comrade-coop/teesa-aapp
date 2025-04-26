import { wordGame } from '../../../app/_core/word-game';
import { gameState, AnswerResultEnum } from '../../../app/_core/game-state';
import { MessageTypeEnum } from '../../../app/_core/message-type-enum';
import { WON_GAME_MESSAGE } from '../../../app/_core/game-const';
import { classifyAnswer } from './llm-test-utils';
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(30000);

// Inline word‐game scenarios
const scenarios = [
  // 1. Basic Flow + Multiple Questions + Full Sentence Guesses (Correct & Incorrect)
  {
    secretWord: 'car',
    questions: [
      { input: 'does it have wheels?', expected: true },
      { input: 'is it alive?', expected: false },
    ],
    incorrectGuesses: ['Maybe it is a boat?', 'I think it might be a tree'], // Full sentence incorrect guesses
    correctGuess: 'Could the word be car?', // Question format guess
  },
  // 2. Regular Plural + Statement Incorrect Guess
  {
    secretWord: 'bird',
    questions: [{ input: 'can it fly?', expected: true }],
    incorrectGuesses: ['it is fish'],
    correctGuess: 'My final guess is birds', // Full sentence guess
  },
  // 3. Irregular Plural (Mice) + Simple Guess
  {
    secretWord: 'mouse',
    questions: [{ input: 'is it small?', expected: true }],
    incorrectGuesses: ['rat'],
    correctGuess: 'mice',
  },
  // 4. Irregular Plural (Feet) + Extracted Guess
  {
    secretWord: 'foot',
    questions: [{ input: 'do you walk on it?', expected: true }],
    incorrectGuesses: ['hand'],
    correctGuess: 'feet is my guess',
  },
    // 5. Irregular Plural (Teeth) + More complex question
  {
    secretWord: 'tooth',
    questions: [{ input: 'is it something found inside your mouth?', expected: true }],
    incorrectGuesses: ['tongue'],
    correctGuess: 'I am quite sure it is teeth', // Full sentence
  },
  // 6. Synonym (Phone/Telephone) + Question Guess
  {
    secretWord: 'phone',
    questions: [{ input: 'can you call someone with it?', expected: true }],
    incorrectGuesses: ['computer'],
    correctGuess: 'Is the word telephone?',
  },
  // 7. Synonym (House/Home) + Statement Guess + Question Incorrect Guess
  {
    secretWord: 'house',
    questions: [{ input: 'do people live in it?', expected: true }],
    incorrectGuesses: ['What about a hotel?'],
    correctGuess: 'I think the word is home',
  },
  {
    secretWord: 'car',
    questions: [{ input: 'does it drive on roads?', expected: true }],
    incorrectGuesses: ['truck'],
    correctGuess: 'automobile',
  },
  // 8. Case Insensitivity + Whitespace + Punctuation (Complex)
  {
    secretWord: 'dog',
    questions: [{ input: 'does it bark?', expected: true }],
    incorrectGuesses: ['cat'],
    correctGuess: '  could it be DOG ?? ', // Covers multiple normalization aspects
  },
  // 9. Simple Punctuation + Case variation
  {
    secretWord: 'clock',
    questions: [{ input: 'does it tell time?', expected: true }],
    incorrectGuesses: ['time'],
    correctGuess: 'ClOcK!', // Case variation + punctuation
  },
  // 10. Homograph (Wind) + Multiple Questions
  {
    secretWord: 'wind',
    questions: [
      { input: 'is it moving air?', expected: true },
      { input: 'is it a type of weather?', expected: true },
      { input: 'is it a type of music?', expected: false },
    ],
    incorrectGuesses: ['rain'],
    correctGuess: 'wind', // Simple guess for contrast
  },
  // 11. Non-ASCII / Accent (Cafe/Café)
  {
    secretWord: 'cafe',
    questions: [{ input: 'is it a place where you can drink coffee?', expected: true }],
    incorrectGuesses: ['restaurant'],
    correctGuess: 'café',
  },
  // 12. Abstract Noun (Time) + Multiple Questions
  {
    secretWord: 'time',
    questions: [
      { input: 'can you measure it?', expected: true },
      { input: 'can you hold it?', expected: false },
    ],
    incorrectGuesses: ['clock', 'day'],
    correctGuess: 'The answer must be time.', // Full sentence + punctuation
  },
  // 13. Abstract Noun (Money) + Extracted/Synonym Incorrect Guesses
  {
    secretWord: 'money',
    questions: [ 
      { input: 'can you buy things with it?', expected: true },
      { input: 'something abstract?', expected: true },
      { input: 'made from metal', expected: false }
    ],
    incorrectGuesses: ["it's change", 'probably dollar?'], // Extraction + tentative phrasing
    correctGuess: 'it should be money',
  },
  // 14. Body Part + Case Insensitive Guess Extraction (Eye)
  {
    secretWord: 'eye',
    questions: [{ input: 'do you see with it?', expected: true }],
    incorrectGuesses: ['ear', 'nose'],
    correctGuess: 'The answer must be EYE',
  },
  // 15. Food + Punctuation + Question Guess (Pizza)
  {
    secretWord: 'pizza',
    questions: [
      { input: 'is it food?', expected: true },
      { input: 'is it round?', expected: true },
    ],
    incorrectGuesses: ['pasta', 'bread'],
    correctGuess: 'Is it... pizza!?',
  },
  // 16. Natural Phenomenon + Multiple Questions + Tentative Incorrect Guess (Rain)
  {
    secretWord: 'rain',
    questions: [
      { input: 'does it fall from the sky?', expected: true },
      { input: 'is it wet?', expected: true },
      { input: 'is it solid?', expected: false },
    ],
    incorrectGuesses: ['snow', 'might be cloud'], // Tentative phrasing
    correctGuess: 'it probably is rain',
  },
  // 17. Object + Test base word after synonym incorrect (Computer)
   {
    secretWord: 'computer',
    questions: [
      { input: 'does it use electricity?', expected: true },
      { input: 'is it edible?', expected: false },
    ],
    incorrectGuesses: ['phone', 'probably tablet?'], // Tentative phrasing
    correctGuess: 'My best guess is computer.', // Full sentence
  },
   // 18. Profession + Simple Q/A
  {
    secretWord: 'doctor',
    questions: [ { input: 'do they help sick people?', expected: true } ],
    incorrectGuesses: ['nurse'],
    correctGuess: 'this is doctor',
  },
  // 19. Abstract + Simple Q/A (Music)
  {
    secretWord: 'music',
    questions: [ { input: 'can you listen to it?', expected: true } ],
    incorrectGuesses: ['song', 'sound'],
    correctGuess: 'Could it be music?', // Question format
  },
  {
    secretWord: 'game', // Abstract
    questions: [
      { input: 'can you play it?', expected: true },
      { input: 'can you eat it?', expected: false },
    ],
    incorrectGuesses: ['toy', 'sport'],
    correctGuess: 'word is game',
  },
  {
    secretWord: 'light', // Abstract/Phenomenon
    questions: [
      { input: 'does it help you see in the dark?', expected: true },
      { input: 'is it heavy?', expected: false },
    ],
    incorrectGuesses: ['should be dark', 'lamp'],
    correctGuess: 'the word is light',
  }
];

describe.each(scenarios)('WordGame scenarios for secret="%s"', (scenario) => {
  const { secretWord, questions, incorrectGuesses, correctGuess } = scenario;

  beforeEach(async () => {
    await gameState.reset();
    // Override private secretWord
    (gameState as any).secretWord = secretWord;
  });

  afterAll(async () => {
    await gameState.reset();
  });

  describe('questions', () => {
    test.each(questions)('%s → %p', async ({ input, expected }) => {
      const type = await wordGame.getInputTypeForMessage(input);
      expect(type).toBe(MessageTypeEnum.QUESTION);
      const response = await wordGame.processUserMessage(
        'user', uuidv4(), Date.now(), input, type
      );
      expect(await classifyAnswer(response)).toBe(expected);
    });
  });

  describe('incorrect guesses', () => {
    test.each(incorrectGuesses)('%s → INCORRECT', async (guess) => {
      const type = await wordGame.getInputTypeForMessage(guess);
      expect(type).toBe(MessageTypeEnum.GUESS);
      const [response, result] = await wordGame.checkGuessMessage(
        'user', uuidv4(), Date.now(), guess
      );
      expect(result).toBe(AnswerResultEnum.INCORRECT);
      expect(await classifyAnswer(response)).toBe(false);
    });
  });

  test('correct guess → WIN', async () => {
    const type = await wordGame.getInputTypeForMessage(correctGuess);
    expect(type).toBe(MessageTypeEnum.GUESS);
    const [response, result] = await wordGame.checkGuessMessage(
      'user', uuidv4(), Date.now(), correctGuess
    );
    expect(result).toBe(AnswerResultEnum.CORRECT);
    expect(response).toBe(WON_GAME_MESSAGE);
  });
});
