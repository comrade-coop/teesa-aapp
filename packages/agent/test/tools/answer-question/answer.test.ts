import { expect } from 'chai';
import { describe, it } from 'mocha';
import { AnswerResultEnum } from '../../../src/state/types';
import { answer } from '../../../src/tools/answer-question';
import { setSecretWord } from '../set-secret-word';

const cases = [
  { secretWord: 'dog', question: 'is it alive', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'dog', question: 'is it an animal?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'dog', question: 'is it heavier than 100 kg?', expectedAnswer: ['no', AnswerResultEnum.NO] },
  { secretWord: 'phone', question: 'do people have it in their houses?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'phone', question: 'is it running on electricity?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'phone', question: 'is it made entirely from metal?', expectedAnswer: ['no', AnswerResultEnum.NO] },
  { secretWord: 'game', question: 'is it interesting?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'game', question: 'Can you eat it?', expectedAnswer: ['no', AnswerResultEnum.NO] },
  { secretWord: 'color', question: 'is it something you can touch?', expectedAnswer: ['no', AnswerResultEnum.NO] },
  { secretWord: 'color', question: 'is it related to vision', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'color', question: 'Is it maybe light?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'house', question: 'does it have wood in it?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'house', question: 'is it a kind of building?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'time', question: 'is it abstract?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'time', question: 'is it a natural phenomenon?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'time', question: 'can you measure it?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'time', question: 'is it a number?', expectedAnswer: ['no', AnswerResultEnum.NO] },
  { secretWord: 'rain', question: 'is it a natural phenomenon?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'rain', question: 'is it made from water?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'bat', question: 'is it an animal?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'bat', question: 'is it used in baseball?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'doctor', question: 'is it a kind of profession?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'doctor', question: 'do they chase the bad guys?', expectedAnswer: ['no', AnswerResultEnum.NO] },
  { secretWord: 'foot', question: 'is it part of the body?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'cafe', question: 'is it a beverage?', expectedAnswer: ['no', AnswerResultEnum.NO] },
  { secretWord: 'cafe', question: 'is it a place?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'pizza', question: 'is it food?', expectedAnswer: ['yes', AnswerResultEnum.YES] },
  { secretWord: 'pizza', question: 'can you hold it', expectedAnswer: ['yes', AnswerResultEnum.YES] }
]

describe('Answer question', function() {
  cases.forEach(({ secretWord, question, expectedAnswer }) => {
    it(`answer of "${question}" for secret word "${secretWord}" should be "${expectedAnswer[0]}"`, async function() {
      await setSecretWord(secretWord);

      const [answerString, answerResult] = await answer(question);

      expect(answerString).to.equal(expectedAnswer[0]);
      expect(answerResult).to.equal(expectedAnswer[1]);
    });
  });
});