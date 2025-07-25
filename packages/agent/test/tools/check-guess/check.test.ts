import { expect } from 'chai';
import { describe, it } from 'mocha';
import { check } from '../../../src/tools/check-guess';
import { setSecretWord } from '../set-secret-word';
import { cases } from './cases';

describe('Check guess', function () {
  cases.forEach(({ secretWord, message, guess, isCorrect }) => {
    it(`guess of "${message}" for "${secretWord}" should be "${isCorrect}"`, async function () {
      await setSecretWord(secretWord);

      const isCorrect = await check(guess);

      expect(isCorrect).to.equal(isCorrect);
    });
  });
});