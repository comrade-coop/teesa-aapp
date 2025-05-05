import { AnswerResultEnum, gameState } from '../../../app/_core/game-state';
import { WON_GAME_MESSAGE, PROCESSING_ERROR_MESSAGE } from '../../../app/_core/game-const';
import { wordGame, WordGame } from '../../../app/_core/word-game';
import { MessageTypeEnum } from '../../../app/_core/message-type-enum';
import { classifyAnswer } from './llm-test-utils';

describe('WordGame', () => {
  jest.setTimeout(60000);

  beforeEach(async () => {
    await gameState.reset();
  });

  afterAll(async () => {
    await gameState.reset();
  });

  describe('getInputTypeForMessage', () => {
    it('should correctly identify a question', async () => {
      const result = await wordGame.getInputTypeForMessage('is it alive?');
      expect(result).toBe(MessageTypeEnum.QUESTION);
    });

    it('should correctly identify a guess', async () => {
      const result = await wordGame.getInputTypeForMessage('car');
      expect(result).toBe(MessageTypeEnum.GUESS);
    });

    it('should correctly identify a general question as a "other"', async () => {
      const result = await wordGame.getInputTypeForMessage('hello there, I was wondering if you could tell me more about this game');
      expect(result).toBe(MessageTypeEnum.OTHER);
    });

    it('should identify guess patterns correctly', async () => {
      const result = await wordGame.getInputTypeForMessage('I think it\'s a bicycle');
      expect(result).toBe(MessageTypeEnum.GUESS);
    });
  });

  describe('processUserMessage', () => {
    it('should process a question and return the response', async () => {
      const userId = 'user123';
      const messageId = 'msg123';
      const timestamp = Date.now();
      const input = 'does it have wheels?';

      const response = await wordGame.processUserMessage(
        userId,
        messageId,
        timestamp,
        input,
        MessageTypeEnum.QUESTION
      );

      // Verify the response expresses a positive answer
      expect(await classifyAnswer(response)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user123';
      const messageId = 'msg123';
      const timestamp = Date.now();
      const input = 'does it have wheels?';

      // Cast to any to simulate error in answerQuestion
      const originalAnswerQuestion = (wordGame as any).answerQuestion;
      (wordGame as any).answerQuestion = jest.fn().mockRejectedValue(new Error('Test error'));

      const response = await wordGame.processUserMessage(
        userId,
        messageId,
        timestamp,
        input,
        MessageTypeEnum.QUESTION
      );

      expect(response).toBe(PROCESSING_ERROR_MESSAGE);

      // Restore the original answerQuestion method
      (wordGame as any).answerQuestion = originalAnswerQuestion;
    });
  });

  describe('checkGuessMessage', () => {
    it('should correctly identify a correct guess', async () => {
      const userId = 'user123';
      const messageId = 'msg123';
      const timestamp = Date.now();
      const input = 'car';

      const [response, answerResult] = await wordGame.checkGuessMessage(
        userId,
        messageId,
        timestamp,
        input
      );

      expect(answerResult).toBe(AnswerResultEnum.CORRECT);
      expect(response).toBe(WON_GAME_MESSAGE);
    });

    it('should correctly identify an incorrect guess', async () => {
      const userId = 'user123';
      const messageId = 'msg123';
      const timestamp = Date.now();
      const input = 'boat';

      const [response, answerResult] = await wordGame.checkGuessMessage(
        userId,
        messageId,
        timestamp,
        input
      );

      expect(answerResult).toBe(AnswerResultEnum.INCORRECT);
      expect(await classifyAnswer(response)).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user123';
      const messageId = 'msg123';
      const timestamp = Date.now();
      const input = 'car';

      // Cast to any to simulate error in checkGuess
      const originalCheckGuess = (wordGame as any).checkGuess;
      (wordGame as any).checkGuess = jest.fn().mockRejectedValue(new Error('Test error'));

      const [response, answerResult] = await wordGame.checkGuessMessage(
        userId,
        messageId,
        timestamp,
        input
      );

      expect(response).toBe(PROCESSING_ERROR_MESSAGE);
      expect(answerResult).toBe(AnswerResultEnum.INCORRECT);

      // Restore the original checkGuess method
      (wordGame as any).checkGuess = originalCheckGuess;
    });
  });
});
