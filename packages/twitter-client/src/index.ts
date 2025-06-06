import { AgentClientsEnum, generateTwitterPost, replyToUser } from "@teesa-monorepo/agent";
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createTwitterClient, TwitterAuthenticationClient } from "./twitter-client";
import { TwitterInteraction } from "./types";

require('dotenv').config({ path: path.resolve(process.cwd(), '../../.env') });

let client: TwitterAuthenticationClient;
let isStarted = false;

async function startTweetLoop() {
  while (isStarted) {
    const minMs = parseInt(process.env.TWITTER_POSTING_INTERVAL_MIN_MINUTES!) * 60 * 1000;
    const maxMs = parseInt(process.env.TWITTER_POSTING_INTERVAL_MAX_MINUTES!) * 60 * 1000;
    const nextInterval = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    const nextIntervalMinutes = Math.round(nextInterval / (60 * 1000));

    console.log(`⏰ Next tweet scheduled in ${nextIntervalMinutes} minutes`);

    await new Promise(resolve => setTimeout(resolve, nextInterval));

    if (isStarted) {
      await postTweet();
    }
  }
}

async function postTweet() {
  const postPrompt = `
Get the details about the game and the latest questions and generate a tweet with updates about the game and what we know about the word so far.
If nothing new is discovered since the last tweet, just say that the game is still ongoing and invite the players to join.
  `;

  const tweet = await generateTwitterPost(postPrompt);

  try {
    await client.postTweet(tweet);
    console.log(`✅ Successfully posted tweet`);
  } catch (error) {
    console.error(`❌ Failed to post tweet:`, error);
  }
}

async function replyToInteraction(interaction: TwitterInteraction) {
  console.log(`🔔 Received interaction from @${interaction.username}: "${interaction.text}"`);
  
  const userId = `0xtwitter-${interaction.userId.substring(0, 8)}`;
  const messageId = uuidv4();
  const timestamp = Date.now();
  const reply = await replyToUser(AgentClientsEnum.TWITTER, userId, undefined, messageId, timestamp, interaction.text);

  try {
    await client.replyToInteraction(interaction.id, reply);
    console.log(`✅ Successfully replied to @${interaction.username}`);
  } catch (error) {
    console.error(`❌ Failed to reply to @${interaction.username}:`, error);
  }
}

(async () => {
  if (!process.env.TWITTER_USERNAME
    || !process.env.TWITTER_PASSWORD
    || !process.env.TWITTER_EMAIL
    || !process.env.TWITTER_INTERACTION_MONITORING_INTERVAL_SECONDS
    || !process.env.TWITTER_POSTING_INTERVAL_MIN_MINUTES
    || !process.env.TWITTER_POSTING_INTERVAL_MAX_MINUTES) {
    console.error('Twitter environment variables are not set');
    return;
  }

  client = await createTwitterClient({
    username: process.env.TWITTER_USERNAME,
    password: process.env.TWITTER_PASSWORD,
    email: process.env.TWITTER_EMAIL,
    twoFactorSecret: process.env.TWITTER_TWO_FACTOR_SECRET
  });

  // Handle interaction events and generate custom replies
  client.on('interactionReceived', replyToInteraction);

  // Start tweet loop in background
  isStarted = true;
  (async () => {
    await startTweetLoop();
  })();

  // Start monitoring interactions and responding automatically
  await client.startInteractionMonitoring(parseInt(process.env.TWITTER_INTERACTION_MONITORING_INTERVAL_SECONDS!));

  console.log('Twitter client is started');

  // Graceful shutdown handling
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down twitter client...');
    isStarted = false;
    process.exit(0);
  });
})();