import { AnswerResultEnum } from '../../../app/_core/game-state';
import { WON_GAME_MESSAGE } from '../../../app/_core/game-const';
import { WordGame } from '../../../app/_core/word-game';
import { MessageTypeEnum } from '../../../app/_core/message-type-enum';

describe('WordGame', () => {
  // Set timeout to 30 seconds for all tests in this file
  jest.setTimeout(30000);

  let wordGame: WordGame;

  beforeEach(() => {
    // Create a new instance of WordGame for each test
    wordGame = new WordGame();

    // Clear mock calls
    jest.clearAllMocks();
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

      expect(response).toBe('Yes, it has wheels.');
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user123';
      const messageId = 'msg123';
      const timestamp = Date.now();
      const input = 'does it have wheels?';

      // Force an error by making the agent throw
      const originalInvoke = wordGame['agent'].invoke;
      wordGame['agent'].invoke = jest.fn().mockRejectedValue(new Error('Test error'));

      const response = await wordGame.processUserMessage(
        userId,
        messageId,
        timestamp,
        input,
        MessageTypeEnum.QUESTION
      );

      expect(response).toBe("I'm sorry, I'm having trouble processing your message. Please try again.");

      // Restore the original invoke method
      wordGame['agent'].invoke = originalInvoke;
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

      expect(response).toBe(WON_GAME_MESSAGE);
      expect(answerResult).toBe(AnswerResultEnum.CORRECT);
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

      expect(response).toBe("Sorry, that's not the word I'm thinking of.");
      expect(answerResult).toBe(AnswerResultEnum.INCORRECT);
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user123';
      const messageId = 'msg123';
      const timestamp = Date.now();
      const input = 'car';

      // Force an error by making the agent throw
      const originalInvoke = wordGame['agent'].invoke;
      wordGame['agent'].invoke = jest.fn().mockRejectedValue(new Error('Test error'));

      const [response, answerResult] = await wordGame.checkGuessMessage(
        userId,
        messageId,
        timestamp,
        input
      );

      expect(response).toBe("I'm sorry, I'm having trouble processing your guess. Please try again.");
      expect(answerResult).toBe(AnswerResultEnum.INCORRECT);

      // Restore the original invoke method
      wordGame['agent'].invoke = originalInvoke;
    });
  });
});
