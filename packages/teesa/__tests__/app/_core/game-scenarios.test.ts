import { wordGame } from '../../../app/_core/word-game';
import { gameState, AnswerResultEnum } from '../../../app/_core/game-state';
import { MessageTypeEnum } from '../../../app/_core/message-type-enum';
import { WON_GAME_MESSAGE } from '../../../app/_core/game-const';
import { classifyAnswer } from './llm-test-utils';
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(60000);

// Inline input‐type scenarios
const inputTypeScenarios = [
  { input: 'does it have wheels?', expected: MessageTypeEnum.QUESTION },
  { input: 'car', expected: MessageTypeEnum.GUESS },
  { input: 'hello there', expected: MessageTypeEnum.OTHER },
  { input: 'I think it might be something with wheels', expected: MessageTypeEnum.QUESTION },
  { input: 'How many letters?', expected: MessageTypeEnum.OTHER },
  { input: 'Is it in my list?', expected: MessageTypeEnum.OTHER },
  { input: 'I think it’s a car', expected: MessageTypeEnum.GUESS },
  { input: '  DOG  ', expected: MessageTypeEnum.GUESS },
  { input: 'dog!', expected: MessageTypeEnum.GUESS },
  { input: 'Tell me about cars', expected: MessageTypeEnum.OTHER },
  { input: 'children', expected: MessageTypeEnum.GUESS },
  { input: 'cats', expected: MessageTypeEnum.GUESS },
  { input: '¿es un avión?', expected: MessageTypeEnum.OTHER }, // Non-ASCII question
  { input: 'café', expected: MessageTypeEnum.GUESS }, // Non-ASCII guess
  { input: 'running', expected: MessageTypeEnum.OTHER }, // Non-noun guess
  { input: '123', expected: MessageTypeEnum.OTHER }, // Numeric guess
  { input: 'Is it big or small?', expected: MessageTypeEnum.QUESTION }, // Valid question
  { input: 'What color is it?', expected: MessageTypeEnum.OTHER }, // Non yes/no question
  { input: 'Can you change it?', expected: MessageTypeEnum.OTHER }, // Ambiguous verb/noun
  { input: 'is it spelled W-I-N-D?', expected: MessageTypeEnum.OTHER }, // Against the rules
  { input: 'how many letters?', expected: MessageTypeEnum.OTHER }, // Against the rules
];

// Inline word‐game scenarios
const scenarios = [
  {
    secretWord: 'car',
    questions: [
      { input: 'does it have wheels?', expected: true },
      { input: 'is it alive?', expected: false },
    ],
    incorrectGuesses: ['boat', 'tree'],
    correctGuess: 'car',
  },
  {
    secretWord: 'dog',
    questions: [
      { input: 'is it an animal?', expected: true },
      { input: 'does it have wings?', expected: false },
    ],
    incorrectGuesses: ['cat', 'car'],
    correctGuess: 'dog',
  },
  // Plurals & Variations
  {
    secretWord: 'cat',
    questions: [{ input: 'does it meow?', expected: true }],
    incorrectGuesses: ['dog'],
    correctGuess: 'cats',
  },
  {
    secretWord: 'child',
    questions: [{ input: 'is it young?', expected: true }],
    incorrectGuesses: ['adult'],
    correctGuess: 'children',
  },
  {
    secretWord: 'bird',
    questions: [{ input: 'can it fly?', expected: true }],
    incorrectGuesses: ['fish'],
    correctGuess: 'birds',
  },
  {
    secretWord: 'flower',
    questions: [{ input: 'is it a plant?', expected: true }],
    incorrectGuesses: ['tree'],
    correctGuess: 'flowers',
  },
  {
    secretWord: 'fish',
    questions: [{ input: 'does it swim?', expected: true }],
    incorrectGuesses: ['bird'],
    correctGuess: 'fishes',
  },
  {
    secretWord: 'mouse',
    questions: [{ input: 'is it small?', expected: true }],
    incorrectGuesses: ['rat'],
    correctGuess: 'mice', // Irregular plural
  },
  {
    secretWord: 'tooth',
    questions: [{ input: 'is it in your mouth?', expected: true }],
    incorrectGuesses: ['tongue'],
    correctGuess: 'teeth', // Irregular plural
  },
  {
    secretWord: 'foot',
    questions: [{ input: 'do you walk on it?', expected: true }],
    incorrectGuesses: ['hand'],
    correctGuess: 'feet', // Irregular plural
  },
  // Synonyms
  {
    secretWord: 'phone',
    questions: [{ input: 'can you call someone with it?', expected: true }],
    incorrectGuesses: ['computer'],
    correctGuess: 'telephone',
  },
  {
    secretWord: 'car',
    questions: [{ input: 'does it drive on roads?', expected: true }],
    incorrectGuesses: ['truck'],
    correctGuess: 'automobile',
  },
  {
    secretWord: 'couch',
    questions: [{ input: 'can you sit on it?', expected: true }],
    incorrectGuesses: ['chair'],
    correctGuess: 'sofa',
  },
  {
    secretWord: 'house',
    questions: [{ input: 'do people live in it?', expected: true }],
    incorrectGuesses: ['building'],
    correctGuess: 'home',
  },
  // Case Insensitivity & Whitespace & Punctuation
  {
    secretWord: 'dog',
    questions: [{ input: 'does it bark?', expected: true }],
    incorrectGuesses: ['cat'],
    correctGuess: '  DOG  ',
  },
  {
    secretWord: 'clock',
    questions: [{ input: 'does it tell time?', expected: true }],
    incorrectGuesses: ['watch'],
    correctGuess: 'ClOcK',
  },
  {
    secretWord: 'tree',
    questions: [{ input: 'does it have leaves?', expected: true }],
    incorrectGuesses: ['bush'],
    correctGuess: 'tree!',
  },
  {
    secretWord: 'book',
    questions: [{ input: 'can you read it?', expected: true }],
    incorrectGuesses: ['magazine'],
    correctGuess: 'book?',
  },
  // Disallowed Questions / Input Types
  {
    secretWord: 'wind', // Homograph test
    questions: [
      { input: 'is it moving air?', expected: true },
      { input: 'is it a type of weather?', expected: true },
      { input: 'is it a type of music?', expected: false },
    ],
    incorrectGuesses: ['rain'],
    correctGuess: 'wind',
  },
  {
    secretWord: 'change', // Noun/Verb ambiguity
    questions: [
      { input: 'is it money?', expected: true }, // Test the noun sense
      // { input: 'can you change it?', expected: false }, // Should be OTHER type
    ],
    incorrectGuesses: ['dollar'],
    correctGuess: 'change',
  },
  // Ambiguous Inputs / Extraction
  {
    secretWord: 'computer',
    questions: [{ input: 'does it have a screen?', expected: true }],
    incorrectGuesses: ['laptop'],
    correctGuess: 'I think it is a computer', // Guess extraction
  },
  {
    secretWord: 'table',
    questions: [{ input: 'do you eat at it?', expected: true }],
    incorrectGuesses: ['chair'],
    correctGuess: 'My guess is table', // Guess extraction
  },
  // Non-ASCII / Accents (Using words from list that might have accented synonyms)
  {
    secretWord: 'cafe', // Assuming 'cafe' is added to wordsList later or handled by synonym logic
    questions: [{ input: 'do you drink coffee there?', expected: true }],
    incorrectGuesses: ['restaurant'],
    correctGuess: 'café', // Check if LLM handles accent synonym
  },
  // More varied words from the list
  {
    secretWord: 'moon',
    questions: [{ input: 'is it in the sky at night?', expected: true }],
    incorrectGuesses: ['sun'],
    correctGuess: 'moon',
  },
  {
    secretWord: 'water',
    questions: [{ input: 'can you drink it?', expected: true }],
    incorrectGuesses: ['juice'],
    correctGuess: 'water',
  },
  {
    secretWord: 'chair',
    questions: [{ input: 'do you sit on it?', expected: true }],
    incorrectGuesses: ['table'],
    correctGuess: 'chair',
  },
  {
    secretWord: 'apple',
    questions: [{ input: 'is it a fruit?', expected: true }],
    incorrectGuesses: ['orange'],
    correctGuess: 'apple',
  },
  {
    secretWord: 'shoe',
    questions: [{ input: 'do you wear it on your foot?', expected: true }],
    incorrectGuesses: ['sock'],
    correctGuess: 'shoes', // Plural variation
  },
  {
    secretWord: 'hat',
    questions: [{ input: 'do you wear it on your head?', expected: true }],
    incorrectGuesses: ['scarf'],
    correctGuess: 'hat',
  },
  {
    secretWord: 'key',
    questions: [{ input: 'does it open a lock?', expected: true }],
    incorrectGuesses: ['door'],
    correctGuess: 'key',
  },
  {
    secretWord: 'train',
    questions: [{ input: 'does it run on tracks?', expected: true }],
    incorrectGuesses: ['bus'],
    correctGuess: 'train',
  },
  {
    secretWord: 'hospital',
    questions: [{ input: 'do sick people go there?', expected: true }],
    incorrectGuesses: ['school'],
    correctGuess: 'hospital',
  },
  
  {
    secretWord: 'time', // Abstract noun
    questions: [
      { input: 'can you measure it?', expected: true },
      { input: 'can you hold it?', expected: false },
    ],
    incorrectGuesses: ['clock', 'day'],
    correctGuess: 'time',
  },
  {
    secretWord: 'money', // Abstract noun
    questions: [
      { input: 'can you buy things with it?', expected: true },
      { input: 'can you eat it?', expected: false },
    ],
    incorrectGuesses: ['cash', 'dollar'],
    correctGuess: 'money',
  },
  {
    secretWord: 'eye', // Body part, tests case-insensitive guess
    questions: [
      { input: 'do you see with it?', expected: true },
      { input: 'can you hear with it?', expected: false },
    ],
    incorrectGuesses: ['ear', 'nose'],
    correctGuess: 'EYE', // Caps
  },
  {
    secretWord: 'door', // Object, tests guess with trailing space
    questions: [
      { input: 'can you open and close it?', expected: true },
      { input: 'is it alive?', expected: false },
    ],
    incorrectGuesses: ['window', 'gate'],
    correctGuess: 'door ', // Trailing space
  },
  {
    secretWord: 'rain', // Natural phenomenon
    questions: [
      { input: 'does it fall from the sky?', expected: true },
      { input: 'is it wet?', expected: true },
      { input: 'is it solid?', expected: false },
    ],
    incorrectGuesses: ['snow', 'cloud'],
    correctGuess: 'rain',
  },
  {
    secretWord: 'computer', // Test base word guess (previous tested synonym 'laptop')
    questions: [
      { input: 'does it use electricity?', expected: true },
      { input: 'is it edible?', expected: false },
    ],
    incorrectGuesses: ['phone', 'tablet'],
    correctGuess: 'computer',
  },
  {
    secretWord: 'pizza', // Food, tests guess with punctuation
    questions: [
      { input: 'is it food?', expected: true },
      { input: 'is it round?', expected: true },
      { input: 'is it a drink?', expected: false },
    ],
    incorrectGuesses: ['pasta', 'bread'],
    correctGuess: 'pizza!', // Punctuation
  },
  {
    secretWord: 'bread', // Food
    questions: [
      { input: 'do you make sandwiches with it?', expected: true },
      { input: 'is it a liquid?', expected: false },
    ],
    incorrectGuesses: ['cake', 'flour'],
    correctGuess: 'bread',
  },
  {
    secretWord: 'mountain', // Natural feature
    questions: [
      { input: 'is it very tall?', expected: true },
      { input: 'is it part of nature?', expected: true },
      { input: 'can you swim in it?', expected: false },
    ],
    incorrectGuesses: ['hill', 'valley'],
    correctGuess: 'mountain',
  },
  {
    secretWord: 'doctor', // Profession
    questions: [
      { input: 'do they help sick people?', expected: true },
      { input: 'do they build houses?', expected: false },
    ],
    incorrectGuesses: ['nurse', 'teacher'],
    correctGuess: 'doctor',
  },
  {
    secretWord: 'fire', // Natural element
    questions: [
      { input: 'is it hot?', expected: true },
      { input: 'can it burn things?', expected: true },
      { input: 'is it wet?', expected: false },
    ],
    incorrectGuesses: ['water', 'ice'],
    correctGuess: 'fire',
  },
  {
    secretWord: 'paper', // Object
    questions: [
      { input: 'can you write on it?', expected: true },
      { input: 'can you eat it?', expected: false },
    ],
    incorrectGuesses: ['book', 'pen'],
    correctGuess: 'paper',
  },
  {
    secretWord: 'music', // Abstract
    questions: [
      { input: 'can you listen to it?', expected: true },
      { input: 'can you touch it?', expected: false },
    ],
    incorrectGuesses: ['song', 'sound'],
    correctGuess: 'music',
  },
  {
    secretWord: 'game', // Abstract
    questions: [
      { input: 'can you play it?', expected: true },
      { input: 'can you eat it?', expected: false },
    ],
    incorrectGuesses: ['toy', 'sport'],
    correctGuess: 'game',
  },
  {
    secretWord: 'light', // Abstract/Phenomenon
    questions: [
      { input: 'does it help you see in the dark?', expected: true },
      { input: 'is it heavy?', expected: false },
    ],
    incorrectGuesses: ['dark', 'lamp'],
    correctGuess: 'light',
  },
];

describe('getInputTypeForMessage', () => {
  test.each(inputTypeScenarios)('$input → $expected', async ({ input, expected }) => {
    const type = await wordGame.getInputTypeForMessage(input);
    expect(type).toBe(expected);
  });
});

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
