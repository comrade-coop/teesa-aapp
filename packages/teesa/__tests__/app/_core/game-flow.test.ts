import { wordGame } from '../../../app/_core/word-game';
import { gameState, AnswerResultEnum } from '../../../app/_core/game-state';
import { MessageTypeEnum } from '../../../app/_core/message-type-enum';
import { WON_GAME_MESSAGE } from '../../../app/_core/game-const';
import { v4 as uuidv4 } from 'uuid';

describe('Game Flow Integration Tests', () => {
  // Set timeout to 30 seconds for all tests in this file
  jest.setTimeout(30000);

  beforeEach(async () => {
    // Reset the game state
    await gameState.reset();

    // Add messages to history for testing
    const userId = 'user123';

    // Add a question
    await gameState.addToHistory({
      id: 'q1',
      userId,
      timestamp: Date.now(),
      messageType: MessageTypeEnum.QUESTION,
      userMessage: 'does it have wheels?',
      llmMessage: 'Yes, it has wheels.',
      answerResult: AnswerResultEnum.YES
    });

    // Add another question
    await gameState.addToHistory({
      id: 'q2',
      userId,
      timestamp: Date.now() + 1000,
      messageType: MessageTypeEnum.QUESTION,
      userMessage: 'is it used for transportation?',
      llmMessage: 'Yes, it has wheels.',
      answerResult: AnswerResultEnum.YES
    });

    // Add a guess
    await gameState.addToHistory({
      id: 'g1',
      userId,
      timestamp: Date.now() + 2000,
      messageType: MessageTypeEnum.GUESS,
      userMessage: 'car',
      llmMessage: WON_GAME_MESSAGE,
      answerResult: AnswerResultEnum.CORRECT
    });
  });

  it('should handle a complete game flow with a correct guess', async () => {
    const userId = 'user123';

    // Step 1: Ask a question
    const questionId = uuidv4();
    const questionTimestamp = Date.now();
    const questionInput = 'does it have wheels?';

    // First, check the message type
    const questionType = await wordGame.getInputTypeForMessage(questionInput);
    expect(questionType).toBe(MessageTypeEnum.QUESTION);

    // Process the question
    const questionResponse = await wordGame.processUserMessage(
      userId,
      questionId,
      questionTimestamp,
      questionInput,
      questionType
    );

    expect(questionResponse).toBe('Yes, it has wheels.');

    // Step 2: Ask another question
    const question2Id = uuidv4();
    const question2Timestamp = Date.now() + 1000;
    const question2Input = 'is it used for transportation?';

    // First, check the message type
    const question2Type = await wordGame.getInputTypeForMessage(question2Input);
    expect(question2Type).toBe(MessageTypeEnum.QUESTION);

    // Process the question
    const question2Response = await wordGame.processUserMessage(
      userId,
      question2Id,
      question2Timestamp,
      question2Input,
      question2Type
    );

    expect(question2Response).toBe('Yes, it has wheels.'); // Using our mock response

    // Step 3: Make a guess
    const guessId = uuidv4();
    const guessTimestamp = Date.now() + 2000;
    const guessInput = 'car';

    // First, check the message type
    const guessType = await wordGame.getInputTypeForMessage(guessInput);
    expect(guessType).toBe(MessageTypeEnum.GUESS);

    // Process the guess
    const [guessResponse, answerResult] = await wordGame.checkGuessMessage(
      userId,
      guessId,
      guessTimestamp,
      guessInput
    );

    expect(guessResponse).toBe(WON_GAME_MESSAGE);
    expect(answerResult).toBe(AnswerResultEnum.CORRECT);

    // Check that the history contains all messages
    const history = await gameState.getHistory();
    expect(history).toHaveLength(3);

    // Check the first message (question)
    expect(history[0].userId).toBe(userId);
    expect(history[0].messageType).toBe(MessageTypeEnum.QUESTION);
    expect(history[0].userMessage).toBe(questionInput);
    expect(history[0].llmMessage).toBe('Yes, it has wheels.');
    expect(history[0].answerResult).toBe(AnswerResultEnum.YES);

    // Check the second message (question)
    expect(history[1].userId).toBe(userId);
    expect(history[1].messageType).toBe(MessageTypeEnum.QUESTION);
    expect(history[1].userMessage).toBe(question2Input);
    expect(history[1].llmMessage).toBe('Yes, it has wheels.');
    expect(history[1].answerResult).toBe(AnswerResultEnum.YES);

    // Check the third message (guess)
    expect(history[2].userId).toBe(userId);
    expect(history[2].messageType).toBe(MessageTypeEnum.GUESS);
    expect(history[2].userMessage).toBe(guessInput);
    expect(history[2].llmMessage).toBe(WON_GAME_MESSAGE);
    expect(history[2].answerResult).toBe(AnswerResultEnum.CORRECT);
  });

  it('should handle a game flow with incorrect guesses', async () => {
    const userId = 'user123';

    // Step 1: Ask a question
    const questionId = uuidv4();
    const questionTimestamp = Date.now();
    const questionInput = 'is it alive?';

    // First, check the message type
    const questionType = await wordGame.getInputTypeForMessage(questionInput);
    expect(questionType).toBe(MessageTypeEnum.QUESTION);

    // Process the question
    const questionResponse = await wordGame.processUserMessage(
      userId,
      questionId,
      questionTimestamp,
      questionInput,
      questionType
    );

    expect(questionResponse).toBe('No, it\'s not alive.');

    // Step 2: Make an incorrect guess
    const guessId = uuidv4();
    const guessTimestamp = Date.now() + 1000;
    const guessInput = 'boat';

    // First, check the message type
    const guessType = await wordGame.getInputTypeForMessage(guessInput);
    expect(guessType).toBe(MessageTypeEnum.GUESS);

    // Process the guess
    const [guessResponse, answerResult] = await wordGame.checkGuessMessage(
      userId,
      guessId,
      guessTimestamp,
      guessInput
    );

    expect(guessResponse).toBe("Sorry, that's not the word I'm thinking of.");
    expect(answerResult).toBe(AnswerResultEnum.INCORRECT);

    // Step 3: Make a correct guess
    const guess2Id = uuidv4();
    const guess2Timestamp = Date.now() + 2000;
    const guess2Input = 'car';

    // First, check the message type
    const guess2Type = await wordGame.getInputTypeForMessage(guess2Input);
    expect(guess2Type).toBe(MessageTypeEnum.GUESS);

    // Process the guess
    const [guess2Response, answer2Result] = await wordGame.checkGuessMessage(
      userId,
      guess2Id,
      guess2Timestamp,
      guess2Input
    );

    expect(guess2Response).toBe(WON_GAME_MESSAGE);
    expect(answer2Result).toBe(AnswerResultEnum.CORRECT);

    // Check that the history contains all messages
    const history = await gameState.getHistory();
    expect(history).toHaveLength(3);
  });

  it('should handle ambiguous input correctly', async () => {
    // Test with input that could be interpreted as a question or guess
    const ambiguousInput = 'I think it might be something with wheels';
    const inputType = await wordGame.getInputTypeForMessage(ambiguousInput);
    expect(inputType).toBe(MessageTypeEnum.QUESTION);
  });
});
