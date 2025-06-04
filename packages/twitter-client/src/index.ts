import { createTwitterClient } from "./client";

(async () => {
  const client = await createTwitterClient({
    username: 'arony_ai',
    password: 'zebne3-xubsyv-rEczen',
    email: 'arony@elveder.xyz',
    twoFactorSecret: undefined,
    retryLimit: 5
  });

  // Use the authenticated scraper for basic operations
  const scraper = client.getScraper();

  // Send a test tweet
  await scraper.sendTweet('Testing interaction monitoring system.');

  // Start monitoring interactions and responding automatically
  // This will check for mentions/replies every 5 minutes and respond with hardcoded messages
  await client.startInteractionMonitoring(5);

  console.log('🤖 Bot is now running and monitoring interactions...');
})();