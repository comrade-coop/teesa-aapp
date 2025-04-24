import { WordAnswerTool, WordGuessTool, isCorrectGuess, extractAnswerResult } from '../../../../app/_core/langchain/tools';
import { AnswerResultEnum } from '../../../../app/_core/game-state';


describe('Langchain Tools', () => {
  beforeEach(() => {
    // Clear mock calls
    jest.clearAllMocks();
  });

  describe('WordAnswerTool', () => {
    it('should return "true" for a yes answer', async () => {
      const result = await WordAnswerTool.invoke({ question: 'does it have wheels' });
      expect(result).toBe('true');
    });

    it('should return "false" for a no answer', async () => {
      const result = await WordAnswerTool.invoke({ question: 'is it alive' });
      expect(result).toBe('false');
    });
  });

  describe('WordGuessTool', () => {
    it('should return "true" for a correct guess', async () => {
      const result = await WordGuessTool.invoke({ guess: 'car' });
      expect(result).toBe('true');
    });

    it('should return "true" for a synonym of the correct word', async () => {
      const result = await WordGuessTool.invoke({ guess: 'automobile' });
      expect(result).toBe('true');
    });

    it('should return "false" for an incorrect guess', async () => {
      const result = await WordGuessTool.invoke({ guess: 'boat' });
      expect(result).toBe('false');
    });
  });

  describe('isCorrectGuess', () => {
    it('should return true for a response with a correct guess', () => {
      const response = {
        intermediateSteps: [
          {
            action: {
              tool_calls: [
                {
                  name: 'word_guess',
                  args: {
                    guess: 'car'
                  }
                }
              ]
            },
            observation: 'true'
          }
        ]
      };

      expect(isCorrectGuess(response)).toBe(true);
    });

    it('should return false for a response with an incorrect guess', () => {
      const response = {
        intermediateSteps: [
          {
            action: {
              tool_calls: [
                {
                  name: 'word_guess',
                  args: {
                    guess: 'boat'
                  }
                }
              ]
            },
            observation: 'false'
          }
        ]
      };

      expect(isCorrectGuess(response)).toBe(false);
    });

    it('should return false for a response with no guess', () => {
      const response = {
        intermediateSteps: [
          {
            action: {
              tool_calls: [
                {
                  name: 'word_answer',
                  args: {
                    question: 'is it alive'
                  }
                }
              ]
            },
            observation: 'false'
          }
        ]
      };

      expect(isCorrectGuess(response)).toBe(false);
    });

    it('should return false for a response with no intermediateSteps', () => {
      const response = {};

      expect(isCorrectGuess(response)).toBe(false);
    });
  });

  describe('extractAnswerResult', () => {
    it('should return CORRECT for a response with a correct guess', () => {
      const response = {
        intermediateSteps: [
          {
            action: {
              tool_calls: [
                {
                  name: 'word_guess',
                  args: {
                    guess: 'car'
                  }
                }
              ]
            },
            observation: 'true'
          }
        ]
      };

      expect(extractAnswerResult(response)).toBe(AnswerResultEnum.CORRECT);
    });

    it('should return YES for a response with a yes answer', () => {
      const response = {
        intermediateSteps: [
          {
            action: {
              tool_calls: [
                {
                  name: 'word_answer',
                  args: {
                    question: 'does it have wheels'
                  }
                }
              ]
            },
            observation: 'true'
          }
        ]
      };

      expect(extractAnswerResult(response)).toBe(AnswerResultEnum.YES);
    });

    it('should return NO for a response with a no answer', () => {
      const response = {
        intermediateSteps: [
          {
            action: {
              tool_calls: [
                {
                  name: 'word_answer',
                  args: {
                    question: 'is it alive'
                  }
                }
              ]
            },
            observation: 'false'
          }
        ]
      };

      expect(extractAnswerResult(response)).toBe(AnswerResultEnum.NO);
    });

    it('should return UNKNOWN for a response with no tool usage', () => {
      const response = {
        intermediateSteps: [
          {
            action: {
              tool_calls: [
                {
                  name: 'unknown_tool',
                  args: {}
                }
              ]
            },
            observation: 'some observation'
          }
        ]
      };

      expect(extractAnswerResult(response)).toBe(AnswerResultEnum.UNKNOWN);
    });

    it('should return UNKNOWN for a response with no intermediateSteps', () => {
      const response = {};

      expect(extractAnswerResult(response)).toBe(AnswerResultEnum.UNKNOWN);
    });
  });
});
