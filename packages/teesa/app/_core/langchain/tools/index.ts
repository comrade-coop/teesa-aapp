import { AnswerResultEnum } from "../../game-state";

export { WordAnswerTool } from './word-answer-tool';
export { WordGuessTool } from './word-guess-tool';

/**
 * Utility function to determine if a response indicates a correct guess
 */
export function isCorrectGuess(agentResponse: any): boolean {
  if (!agentResponse.intermediateSteps) return false;

  return agentResponse.intermediateSteps.some(
    (step: any) => {
      if (step.action?.tool === "word_guess" && step.observation === "true") {
        return true;
      }

      // Check for tool_calls format
      if (step.action?.tool_calls) {
        const guessCall = step.action.tool_calls.find(
          (call: any) => call.name === "word_guess" && call.args?.guess
        );
        return guessCall && step.observation === "true";
      }

      return false;
    }
  );
}

/**
 * Utility function to extract answer result from agent response
 */
export function extractAnswerResult(agentResponse: any): AnswerResultEnum {
  if (isCorrectGuess(agentResponse)) {
    return AnswerResultEnum.CORRECT;
  }

  if (!agentResponse.intermediateSteps) return AnswerResultEnum.UNKNOWN;

  const answerStep = agentResponse.intermediateSteps.find(
    (step: any) => {
      if (step.action?.tool === "word_answer") {
        return true;
      }

      // Check for tool_calls format
      if (step.action?.tool_calls) {
        return step.action.tool_calls.some(
          (call: any) => call.name === "word_answer" && call.args?.question
        );
      }

      return false;
    }
  );

  if (answerStep) {
    return answerStep.observation === "true" ? AnswerResultEnum.YES : AnswerResultEnum.NO;
  }

  return AnswerResultEnum.UNKNOWN;
}
