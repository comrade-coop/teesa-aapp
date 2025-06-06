import { Scraper, SearchMode } from 'agent-twitter-client';
import { FileCacheManager } from './cache-manager';
import { RequestQueue } from './request-queue';
import { CacheManager, EventListeners, TwitterCookie, TwitterCredentials, TwitterInteraction } from './types';

const AUTHENTICATION_RETRY_LIMIT = 5;
const MAX_TWEET_LENGTH = 280;

export class TwitterAuthenticationClient {
  private scraper: Scraper;
  private credentials: TwitterCredentials;
  private cacheManager: CacheManager;
  private requestQueue: RequestQueue;
  private isLoggedIn: boolean = false;
  private profile: any = null;
  private eventListeners: EventListeners = {};
  private processedInteractions: Set<string> = new Set();
  private interactionMonitoringActive: boolean = false;
  private monitoringStartTime: Date | null = null;

  constructor(credentials: TwitterCredentials) {
    this.credentials = credentials;
    this.cacheManager = new FileCacheManager();
    this.requestQueue = new RequestQueue();

    this.scraper = new Scraper();
  }

  /**
   * Event listener management
   */
  on(event: keyof EventListeners, listener: EventListeners[keyof EventListeners]): void {
    this.eventListeners[event] = listener as any;
  }

  private emit(event: keyof EventListeners, data?: any): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(data);
    }
  }

  /**
   * Initialize authentication - main entry point
   */
  async initialize(): Promise<void> {
    console.log('🔐 Starting Twitter authentication process...');

    try {
      // Try cached authentication first
      if (await this.tryLoadCachedSession()) {
        console.log('✅ Successfully authenticated using cached session');
        return;
      }

      // Perform fresh authentication
      await this.performAuthentication();
      console.log('✅ Successfully authenticated with fresh login');

      // Load and cache profile
      await this.loadUserProfile();

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw new Error(`Twitter authentication failed: ${(error as Error).message}`);
    }
  }

  /**
   * Try to load cached session cookies
   */
  private async tryLoadCachedSession(): Promise<boolean> {
    try {
      const cachedCookies = await this.getCachedCookies();

      if (cachedCookies && cachedCookies.length > 0) {
        console.log('🍪 Found cached cookies, attempting to restore session...');
        await this.setCookiesFromArray(cachedCookies);

        // Verify the session is still valid
        if (await this.validateSession()) {
          this.isLoggedIn = true;
          await this.loadUserProfile();
          return true;
        }

        console.log('⚠️ Cached session expired, performing fresh login...');
      }

      return false;

    } catch (error) {
      console.warn('⚠️ Failed to load cached session:', (error as Error).message);
      return false;
    }
  }

  /**
   * Perform fresh authentication with credentials
   */
  private async performAuthentication(): Promise<void> {
    const { username, password, email, twoFactorSecret } = this.credentials;
    let retries = AUTHENTICATION_RETRY_LIMIT;

    console.log(`🔑 Attempting login for user: ${username}`);

    while (retries > 0) {
      try {
        // Perform login
        await this.scraper.login(username, password, email, twoFactorSecret);

        // Verify login success
        if (await this.scraper.isLoggedIn()) {
          console.log('✅ Login successful');
          this.isLoggedIn = true;

          // Cache cookies for future use
          const cookies = await this.scraper.getCookies();
          await this.cacheCookies(cookies);
          console.log('💾 Cached authentication cookies');

          this.emit('authenticated', { username });
          return;
        }

      } catch (error) {
        console.error(`❌ Login attempt failed: ${(error as Error).message}`);
        this.emit('authenticationError', error as Error);
      }

      retries--;
      if (retries > 0) {
        console.log(`🔄 Retrying login... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Authentication failed after maximum retry attempts');
  }

  /**
   * Validate current session
   */
  private async validateSession(): Promise<boolean> {
    try {
      return await this.scraper.isLoggedIn();
    } catch (error) {
      console.warn('Session validation failed:', (error as Error).message);
      return false;
    }
  }

  /**
   * Load user profile information
   */
  private async loadUserProfile(): Promise<void> {
    try {
      this.profile = await this.requestQueue.add(() =>
        this.scraper.getProfile(this.credentials.username)
      );

      console.log(`👤 Loaded profile for: ${this.profile.name} (@${this.profile.username})`);
      this.emit('profileLoaded', this.profile);

    } catch (error) {
      console.warn('Failed to load user profile:', (error as Error).message);
    }
  }

  /**
   * Set cookies in the scraper
   */
  private async setCookiesFromArray(cookies: TwitterCookie[]): Promise<void> {
    const cookieStrings = cookies.map(cookie => {
      let cookieStr = `${cookie.key}=${cookie.value}; Domain=${cookie.domain}`;

      if (cookie.path) cookieStr += `; Path=${cookie.path}`;
      if (cookie.secure) cookieStr += '; Secure';
      if (cookie.httpOnly) cookieStr += '; HttpOnly';
      if (cookie.sameSite) cookieStr += `; SameSite=${cookie.sameSite}`;

      return cookieStr;
    });

    await this.scraper.setCookies(cookieStrings);
  }

  /**
   * Get cached cookies
   */
  private async getCachedCookies(): Promise<TwitterCookie[] | undefined> {
    const cacheKey = `twitter/${this.credentials.username}/cookies`;
    return await this.cacheManager.get<TwitterCookie[]>(cacheKey);
  }

  /**
   * Cache cookies
   */
  private async cacheCookies(cookies: any[]): Promise<void> {
    const cacheKey = `twitter/${this.credentials.username}/cookies`;
    await this.cacheManager.set(cacheKey, cookies);
  }

  /**
   * Get current authentication status
   */
  async getAuthenticationStatus(): Promise<{
    isAuthenticated: boolean;
    username?: string;
    profile?: any;
  }> {
    return {
      isAuthenticated: this.isLoggedIn,
      username: this.credentials.username,
      profile: this.profile
    };
  }

  /**
   * Refresh authentication session
   */
  async refreshSession(): Promise<void> {
    console.log('🔄 Refreshing authentication session...');

    if (await this.validateSession()) {
      console.log('✅ Session is still valid');
      return;
    }

    console.log('🔑 Session expired, re-authenticating...');
    await this.performAuthentication();
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      await this.scraper.logout();
      await this.scraper.clearCookies();

      // Clear cached cookies
      const cacheKey = `twitter/${this.credentials.username}/cookies`;
      await this.cacheManager.set(cacheKey, []);

      this.isLoggedIn = false;
      this.profile = null;

      console.log('✅ Successfully logged out');
      this.emit('logout');

    } catch (error) {
      console.error('Error during logout:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get the authenticated scraper instance
   */
  getScraper(): any {
    if (!this.isLoggedIn) {
      throw new Error('Not authenticated. Call initialize() first.');
    }
    return this.scraper;
  }

  /**
   * Get user profile
   */
  getProfile(): any {
    return this.profile;
  }

  /**
   * Check if client is authenticated
   */
  getIsAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  /**
   * Get request queue for rate-limited operations
   */
  getRequestQueue(): RequestQueue {
    return this.requestQueue;
  }

  /**
   * Fetch interactions (mentions and replies) for the authenticated user
   */
  private async fetchInteractions(): Promise<TwitterInteraction[]> {
    if (!this.isLoggedIn) {
      throw new Error('Not authenticated. Call initialize() first.');
    }

    try {
      console.log('🔍 Fetching interactions...');

      // Fetch mentions using the scraper
      const mentions = await this.requestQueue.add(() =>
        this.scraper.fetchSearchTweets(`@${this.credentials.username}`, 20, SearchMode.Latest)
      ) as any;

      // Filter out interactions we've already processed
      const newInteractions = mentions?.tweets?.filter((tweet: any) => {
        // Skip if already processed
        if (this.processedInteractions.has(tweet.id)) {
          return false;
        }
        
        // Skip our own tweets
        if (tweet.userId === this.profile?.userId) {
          return false;
        }
        
        // Skip retweets
        if (tweet.isRetweet) {
          return false;
        }
        
        // Skip interactions that happened before monitoring started
        if (this.monitoringStartTime && tweet.timeParsed) {
          const tweetTime = new Date(tweet.timeParsed);
          if (tweetTime < this.monitoringStartTime) {
            return false;
          }
        }
        
        return true;
      }) || [];

      console.log(`📨 Found ${newInteractions.length} new interactions`);
      return newInteractions;

    } catch (error) {
      console.error('❌ Error fetching interactions:', (error as Error).message);
      return [];
    }
  }

  /**
   * Post a new tweet
   */
  async postTweet(text: string): Promise<void> {
    if (!this.isLoggedIn) {
      throw new Error('Not authenticated. Call initialize() first.');
    }

    try {
      console.log(`📝 Posting tweet: "${text}"`);

      if (text.length > MAX_TWEET_LENGTH) {
        text = text.slice(0, MAX_TWEET_LENGTH);
        console.log(`🔍 Tweet truncated to ${text.length} characters`);
      }

      await this.requestQueue.add(() =>
        this.scraper.sendTweet(text)
      );

      console.log('✅ Tweet posted successfully');

    } catch (error) {
      console.error('❌ Error posting tweet:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Reply to a specific tweet - public method for external use
   */
  async replyToInteraction(tweetId: string, replyText: string): Promise<void> {
    if (!this.isLoggedIn) {
      throw new Error('Not authenticated. Call initialize() first.');
    }

    try {
      console.log(`💬 Replying to tweet ${tweetId}: "${replyText}"`);

      if (replyText.length > MAX_TWEET_LENGTH) {
        replyText = replyText.slice(0, MAX_TWEET_LENGTH);
        console.log(`🔍 Reply truncated to ${replyText.length} characters`);
      }

      await this.requestQueue.add(() =>
        this.scraper.sendTweet(replyText, tweetId)
      );

      console.log('✅ Reply sent successfully');

      // Mark interaction as processed and cache it
      this.processedInteractions.add(tweetId);
      await this.cacheProcessedInteraction(tweetId);

    } catch (error) {
      console.error('❌ Error sending reply:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Process and respond to interactions
   */
  private async processInteractions(): Promise<void> {
    try {
      const interactions = await this.fetchInteractions();

      for (const interaction of interactions) {
        try {
          // Mark as processed first to avoid duplicates
          this.processedInteractions.add(interaction.id);

          // Emit event for external handler to process
          if (this.eventListeners.interactionReceived) {
            this.eventListeners.interactionReceived(interaction);
          }

          // Cache processed interaction to persist across sessions
          await this.cacheProcessedInteraction(interaction.id);

          // Add delay between processing interactions
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

        } catch (error) {
          console.error(`❌ Error processing interaction ${interaction.id}:`, (error as Error).message);
        }
      }

    } catch (error) {
      console.error('❌ Error in processInteractions:', (error as Error).message);
    }
  }

  /**
   * Cache processed interaction ID
   */
  private async cacheProcessedInteraction(interactionId: string): Promise<void> {
    const cacheKey = `twitter/${this.credentials.username}/processed_interactions`;

    try {
      let processedIds = await this.cacheManager.get<string[]>(cacheKey) || [];

      if (!processedIds.includes(interactionId)) {
        processedIds.push(interactionId);

        // Keep only last 1000 processed interactions to prevent cache from growing too large
        if (processedIds.length > 1000) {
          processedIds = processedIds.slice(-1000);
        }

        await this.cacheManager.set(cacheKey, processedIds);
      }
    } catch (error) {
      console.warn('Failed to cache processed interaction:', (error as Error).message);
    }
  }

  /**
   * Load previously processed interactions from cache
   */
  private async loadProcessedInteractions(): Promise<void> {
    const cacheKey = `twitter/${this.credentials.username}/processed_interactions`;

    try {
      const processedIds = await this.cacheManager.get<string[]>(cacheKey) || [];
      this.processedInteractions = new Set(processedIds);
      console.log(`📥 Loaded ${processedIds.length} previously processed interactions`);
    } catch (error) {
      console.warn('Failed to load processed interactions:', (error as Error).message);
    }
  }

  /**
   * Start monitoring interactions and responding automatically
   */
  async startInteractionMonitoring(intervalSeconds: number): Promise<void> {
    if (this.interactionMonitoringActive) {
      console.log('⚠️ Interaction monitoring is already active');
      return;
    }

    if (!this.isLoggedIn) {
      throw new Error('Not authenticated. Call initialize() first.');
    }

    console.log(`🎯 Starting interaction monitoring (checking every ${intervalSeconds} seconds)...`);

    // Load previously processed interactions
    await this.loadProcessedInteractions();

    this.interactionMonitoringActive = true;
    this.monitoringStartTime = new Date();

    console.log(`⏰ Monitoring started at: ${this.monitoringStartTime.toISOString()}`);
    console.log('📝 Only interactions after this time will be processed');

    // Initial processing
    await this.processInteractions();

    // Set up recurring processing
    const monitoringInterval = setInterval(async () => {
      if (!this.interactionMonitoringActive) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        await this.processInteractions();
      } catch (error) {
        console.error('❌ Error in interaction monitoring cycle:', (error as Error).message);
      }
    }, intervalSeconds * 1000);

    console.log('✅ Interaction monitoring started successfully');
  }

  /**
   * Stop interaction monitoring
   */
  stopInteractionMonitoring(): void {
    this.interactionMonitoringActive = false;
    this.monitoringStartTime = null;
    console.log('🛑 Interaction monitoring stopped');
  }

  /**
   * Get interaction monitoring status
   */
  getInteractionMonitoringStatus(): {
    active: boolean;
    processedCount: number;
  } {
    return {
      active: this.interactionMonitoringActive,
      processedCount: this.processedInteractions.size
    };
  }
}

export async function createTwitterClient(credentials: TwitterCredentials): Promise<TwitterAuthenticationClient> {
  const client = new TwitterAuthenticationClient(credentials);

  // Set up event listeners for monitoring
  client.on('authenticated', (data: any) => {
    console.log(`🎉 Authenticated successfully: ${data?.username}`);
  });

  client.on('authenticationError', (error: any) => {
    console.error(`🚨 Authentication error: ${error?.message}`);
  });

  client.on('profileLoaded', (profile: any) => {
    console.log(`📋 Profile loaded: ${profile?.name} (${profile?.followers_count} followers)`);
  });

  await client.initialize();
  return client;
}