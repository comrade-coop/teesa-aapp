import { expect } from 'chai';
import { describe, it } from 'mocha';
import { extractGuess } from '../../../src/tools/check-guess';
import { cases } from './cases';

describe('Extract guess', function() {
  cases.forEach(({ message, guess }) => {
    it(`extracted guess of "${message}" should be "${guess}"`, async function() {
      const extractedGuess = await extractGuess(message);

      expect(extractedGuess).to.equal(guess);
    });
  });
});