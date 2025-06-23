import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { AgentMode, prompt, ReplyToUserConfigurable } from '../src/agent';
import { llm } from "../src/llm";
import { resetState } from "../src/state/agent-state";
import { AgentClientsEnum } from "../src/state/types";
import { toolMetadata as answerQuestionMetadata } from "../src/tools/answer-question";
import { toolMetadata as checkGuessMetadata } from "../src/tools/check-guess";
import { toolMetadata as gameDetailsMetadata } from "../src/tools/game-details";
import { toolMetadata as getQuestionsMetadata } from "../src/tools/get-questions";
import { toolMetadata as nftDetailsMetadata } from "../src/tools/nft-details";
import { mockAnswerQuestion } from "./tools/answer-question/mock";
import { mockCharsCount } from "./tools/chars-count/mock";
import { mockCheckGuess } from "./tools/check-guess/mock";
import { mockGameDetails } from "./tools/game-details/mock";
import { mockGetHistoryWithCurrentUser } from "./tools/get-history-with-current-user/mock";
import { mockGetQuestions } from "./tools/get-questions/mock";
import { mockNftDetails } from "./tools/nft-details/mock";
import { getAllToolsCalls, resetToolTracker } from './tools/tool-tracker';

const cases = [
  { message: 'does it have wheels?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it used for transportation?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it alive?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'hello there, I was wondering if you could tell me more about this game', expectedTools: [gameDetailsMetadata.name] },
  { message: 'What about those NFTs?', expectedTools: [nftDetailsMetadata.name] },
  { message: 'What do we know about the word so far?', expectedTools: [getQuestionsMetadata.name] },
  { message: 'I think it\'s a bicycle', expectedTools: [checkGuessMetadata.name] },
  { message: 'I think it might be a boat', expectedTools: [checkGuessMetadata.name] },
  { message: 'Maybe it is a cat', expectedTools: [checkGuessMetadata.name] },
  { message: 'it is fish', expectedTools: [checkGuessMetadata.name] },
  { message: 'it is a bird', expectedTools: [checkGuessMetadata.name] },
  { message: 'I think it might be something with wheels', expectedTools: [] },
  { message: 'car', expectedTools: [checkGuessMetadata.name] },
  { message: 'hello there', expectedTools: [] },
  { message: 'How many letters?', expectedTools: [] },
  { message: 'Is it any ot these: dog, cat, bat', expectedTools: [] },
  { message: 'I think it’s a car', expectedTools: [checkGuessMetadata.name] },
  { message: 'dog!', expectedTools: [checkGuessMetadata.name] },
  { message: 'Tell me about cars', expectedTools: [] },
  { message: 'children', expectedTools: [checkGuessMetadata.name] },
  { message: 'cats', expectedTools: [checkGuessMetadata.name] },
  { message: '  куче  ', expectedTools: [] },
  { message: '¿es un avión?', expectedTools: [] },
  { message: 'café', expectedTools: [checkGuessMetadata.name] },
  { message: 'running', expectedTools: [] },
  { message: '123', expectedTools: [] },
  { message: 'Is it big or small?', expectedTools: [] },
  { message: 'What color is it?', expectedTools: [] },
  { message: 'is it spelled W-I-N-D?', expectedTools: [] },
  { message: 'Is it an animal?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Can it fly?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Does it make a sound?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Is it edible?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Can you hold it?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Is it bigger than a breadbox?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Does it grow?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Is it not a plant?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could it be found outdoors?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Would you say it is man-made?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Is the answer related to food?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Heavy?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Is the word I am thinking of "book"?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Does its name contain the letter E?', expectedTools: [] },
  { message: 'is it heavier than 100 kg?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could it be a cat?', expectedTools: [checkGuessMetadata.name] },
  { message: 'I bet it\'s a horse.', expectedTools: [checkGuessMetadata.name] },
  { message: 'I guess the word is dog?', expectedTools: [checkGuessMetadata.name] },
  { message: 'do people have it in their houses?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it running on electricity?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it made entirely from metal?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could it be a computer?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Maybe a tablet?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Is the word telephone?', expectedTools: [checkGuessMetadata.name] },
  { message: 'is it interesting?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Can you eat it?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could it be a toy?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Is it a sport?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'The word is game.', expectedTools: [checkGuessMetadata.name] },
  { message: 'is it something you can touch?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it related to vision', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Is it maybe light?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could the answer be paint?', expectedTools: [checkGuessMetadata.name] },
  { message: 'I bet the secret word is colour.', expectedTools: [checkGuessMetadata.name] },
  { message: 'does it have wood in it?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it a kind of building?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'What about an apartment complex?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Is it just a building?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'The secret word must surely be house.', expectedTools: [checkGuessMetadata.name] },
  { message: 'is it abstract?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it a natural phenomenon?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'can you measure it?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it a number?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Is it clock?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Could it be a day?', expectedTools: [checkGuessMetadata.name] },
  { message: 'The answer must be time.', expectedTools: [checkGuessMetadata.name] },
  { message: 'is it made from water?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could it perhaps be snow?', expectedTools: [checkGuessMetadata.name] },
  { message: 'I think it\'s a cloud, maybe?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Hmm, I suspect it is probably rain.', expectedTools: [checkGuessMetadata.name] },
  { message: 'can it fly?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it used in baseball?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'I think it might be a ball?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Could it be a vampire?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Could the word be bat?', expectedTools: [checkGuessMetadata.name] },
  { message: 'is it a kind of profession?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'do they chase the bad guys?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could it be a nurse?', expectedTools: [checkGuessMetadata.name] },
  { message: 'I wonder if it\'s a surgeon?', expectedTools: [checkGuessMetadata.name] },
  { message: 'It has to be a doctor.', expectedTools: [checkGuessMetadata.name] },
  { message: 'is it part of the body?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could I guess hand?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Probably toe?', expectedTools: [checkGuessMetadata.name] },
  { message: 'After thinking long and hard, I bet the answer is feet!', expectedTools: [checkGuessMetadata.name] },
  { message: 'is it a beverage?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'is it a place?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Could it be a restaurant?', expectedTools: [checkGuessMetadata.name] },
  { message: 'I am quite sure the answer is café.', expectedTools: [checkGuessMetadata.name] },
  { message: 'is it food?', expectedTools: [answerQuestionMetadata.name] },
  { message: 'can you hold it', expectedTools: [answerQuestionMetadata.name] },
  { message: 'Is it pasta?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Could it be bread?', expectedTools: [checkGuessMetadata.name] },
  { message: 'Is it... pizza!?', expectedTools: [checkGuessMetadata.name] }
];

const testAgent = createReactAgent({
  llm,
  tools: [
    mockGetHistoryWithCurrentUser,
    mockAnswerQuestion,
    mockCheckGuess,
    mockNftDetails,
    mockGameDetails,
    mockGetQuestions,
    mockCharsCount
  ],
  prompt
});

function checkTools(expectedTools: string[]): boolean {
  const usedTools = getAllToolsCalls();

  const expectedSet = new Set(expectedTools);
  const usedSet = new Set(usedTools);

  if (expectedSet.size !== usedSet.size) {
    return false;
  }

  for (const tool of expectedSet) {
    if (!usedSet.has(tool)) {
      return false;
    }
  }

  return true;
}

describe('Agent tools usage', function () {
  beforeEach(async function () {
    await resetState();

    resetToolTracker();
  });

  cases.forEach(({ message, expectedTools }) => {
    it(`tools used for "${message}" should be [${expectedTools.join(', ')}]`, async function () {
      const configurable: ReplyToUserConfigurable = {
        mode: AgentMode.MESSAGE,
        latestMessages: [],
        twitterPosts: [],
        agentClient: AgentClientsEnum.WEB,
        userId: 'test-user',
        userAddress: '0x0000000000000000000000000000000000000000',
        timestamp: Date.now(),
        messageId: 'test-message'
      };

      await testAgent.invoke(
        { messages: message },
        { configurable }
      );

      expect(checkTools(expectedTools)).to.be.true;
    });
  });
});
