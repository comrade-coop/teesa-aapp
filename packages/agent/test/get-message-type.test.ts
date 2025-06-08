import { expect } from 'chai';
import { isMessageGuess } from '../src/get-message-type';

// Inline input‐type scenarios
const inputTypeScenarios = [
  { input: 'I think it might be a boat', expected: true },
  { input: 'Maybe it is a cat', expected: true },
  { input: 'it is fish', expected: true },
  { input: 'it is a bird', expected: true },
  { input: 'I think it might be something with wheels', expected: false },
  { input: 'does it have wheels?', expected: false },
  { input: 'car', expected: true },
  { input: 'hello there', expected: false },
  { input: 'How many letters?', expected: false },
  { input: 'Is it any ot these: dog, cat, bat', expected: false },
  { input: 'I think it’s a car', expected: true },
  { input: 'dog!', expected: true },
  { input: 'Tell me about cars', expected: false },
  { input: 'children', expected: true },
  { input: 'cats', expected: true },
  { input: '  куче  ', expected: false }, // Bulgarian guess
  { input: '¿es un avión?', expected: false }, // Spanish question
  { input: 'café', expected: true }, // Non-ASCII guess
  { input: 'running', expected: false }, // Non-noun guess
  { input: '123', expected: false }, // Numeric guess
  { input: 'Is it big or small?', expected: false }, // Invalid question
  { input: 'What color is it?', expected: false }, // Non yes/no question
  { input: 'is it spelled W-I-N-D?', expected: false }, // Against the rules
  { input: 'how many letters?', expected: false }, // Against the rules
  { input: 'Is it an animal?', expected: false }, // Standard question
  { input: 'Can it fly?', expected: false }, // Standard question
  { input: 'Does it make a sound?', expected: false }, // Standard question
  { input: 'Is it edible?', expected: false }, // Standard question
  { input: 'Can you hold it?', expected: false },
  { input: 'Is it bigger than a breadbox?', expected: false },
  { input: 'Does it grow?', expected: false },
  { input: 'Is it not a plant?', expected: false }, // Negation
  { input: 'Could it be found outdoors?', expected: false }, // Complex phrasing
  { input: 'Would you say it is man-made?', expected: false }, // Complex phrasing
  { input: 'Is the answer related to food?', expected: false }, // Abstract property
  { input: 'Heavy?', expected: false }, // Very short question (potentially
  { input: 'Is the word I am thinking of "book"?', expected: true }, // Guess within question
  { input: 'Does its name contain the letter E?', expected: false }, // Rule violation (letters)
];

describe('Check if a message is a guess', function() {
  inputTypeScenarios.forEach(({ input, expected }) => {
    it(`result for "${input}" should be ${expected}`, async function() {
      const type = await isMessageGuess(input);
      expect(type).to.equal(expected);
    });
  });
});