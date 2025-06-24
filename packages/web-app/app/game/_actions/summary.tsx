'use server';

import { generateSummary } from '@teesa-monorepo/agent/src/agent';
import { agentState } from '@teesa-monorepo/agent/src/state/agent-state';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();
let isStarted = false;
const SUMMARY_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours

let lastQuestionsCount = 0;
const MIN_NEW_QUESTIONS_NUMBER = 5;

export async function startSummaryLoop() {
  if (isStarted) {
    return;
  }

  await mutex.runExclusive(async () => {
    isStarted = true;
  });

  setInterval(async () => {
    try {
      await summary();
    } catch (error) {
      console.error('Summary generation error:', error);
    }
  }, SUMMARY_INTERVAL);
}

async function summary() {
  const questions = await agentState.getQuestions();

  // Only generate summary if there are more than MIN_NEW_QUESTIONS_NUMBER new questions
  if (questions.length < lastQuestionsCount + MIN_NEW_QUESTIONS_NUMBER) {
    return;
  }

  lastQuestionsCount = questions.length;

  await generateSummary();
}