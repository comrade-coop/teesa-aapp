import { wordGame } from '../../../app/_core/word-game';
import { gameState, AnswerResultEnum } from '../../../app/_core/game-state';
import { MessageTypeEnum } from '../../../app/_core/message-type-enum';
import { WON_GAME_MESSAGE } from '../../../app/_core/game-const';
import { classifyAnswer } from './llm-test-utils';
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(30000);

// Inline input‐type scenarios
const inputTypeScenarios = [
  { input: 'I think it might be a boat', expected: MessageTypeEnum.GUESS },
  { input: 'Maybe it is a cat', expected: MessageTypeEnum.GUESS },
  { input: 'it is fish', expected: MessageTypeEnum.GUESS },
  { input: 'it is a bird', expected: MessageTypeEnum.GUESS },
  { input: 'I think it might be something with wheels', expected: MessageTypeEnum.OTHER },
  { input: 'does it have wheels?', expected: MessageTypeEnum.QUESTION },
  { input: 'car', expected: MessageTypeEnum.GUESS },
  { input: 'hello there', expected: MessageTypeEnum.OTHER },
  { input: 'How many letters?', expected: MessageTypeEnum.OTHER },
  { input: 'Is it any ot these: dog, cat, bat', expected: MessageTypeEnum.OTHER },
  { input: 'I think it’s a car', expected: MessageTypeEnum.GUESS },
  { input: 'dog!', expected: MessageTypeEnum.GUESS },
  { input: 'Tell me about cars', expected: MessageTypeEnum.OTHER },
  { input: 'children', expected: MessageTypeEnum.GUESS },
  { input: 'cats', expected: MessageTypeEnum.GUESS },
  { input: '  куче  ', expected: MessageTypeEnum.OTHER }, // Bulgarian guess
  { input: '¿es un avión?', expected: MessageTypeEnum.OTHER }, // Spanish question
  { input: 'café', expected: MessageTypeEnum.GUESS }, // Non-ASCII guess
  { input: 'running', expected: MessageTypeEnum.OTHER }, // Non-noun guess
  { input: '123', expected: MessageTypeEnum.OTHER }, // Numeric guess
  { input: 'Is it big or small?', expected: MessageTypeEnum.OTHER }, // Invalid question
  { input: 'What color is it?', expected: MessageTypeEnum.OTHER }, // Non yes/no question
  { input: 'is it spelled W-I-N-D?', expected: MessageTypeEnum.OTHER }, // Against the rules
  { input: 'how many letters?', expected: MessageTypeEnum.OTHER }, // Against the rules
  { input: 'Is it an animal?', expected: MessageTypeEnum.QUESTION }, // Standard question
  { input: 'Can it fly?', expected: MessageTypeEnum.QUESTION }, // Standard question
  { input: 'Does it make a sound?', expected: MessageTypeEnum.QUESTION }, // Standard question
  { input: 'Is it edible?', expected: MessageTypeEnum.QUESTION }, // Standard question
  { input: 'Can you hold it?', expected: MessageTypeEnum.QUESTION },
  { input: 'Is it bigger than a breadbox?', expected: MessageTypeEnum.QUESTION },
  { input: 'Does it grow?', expected: MessageTypeEnum.QUESTION },
  { input: 'Is it not a plant?', expected: MessageTypeEnum.QUESTION }, // Negation
  { input: 'Could it be found outdoors?', expected: MessageTypeEnum.QUESTION }, // Complex phrasing
  { input: 'Would you say it is man-made?', expected: MessageTypeEnum.QUESTION }, // Complex phrasing
  { input: 'Is the answer related to food?', expected: MessageTypeEnum.QUESTION }, // Abstract property
  { input: 'Heavy?', expected: MessageTypeEnum.QUESTION }, // Very short question (potentially
  { input: 'Is the word I am thinking of "book"?', expected: MessageTypeEnum.GUESS }, // Guess within question
  { input: 'Does its name contain the letter E?', expected: MessageTypeEnum.OTHER }, // Rule violation (letters)
];

describe('Game input classification', () => {
  afterAll(async () => {
    await gameState.reset();
  });

  test.each(inputTypeScenarios)('$input → $expected', async ({ input, expected }) => {
    const type = await wordGame.getInputTypeForMessage(input);
    expect(type).toBe(expected);
  });
});