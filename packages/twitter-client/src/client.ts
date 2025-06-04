import { Scraper } from 'agent-twitter-client';
import { SearchMode } from 'agent-twitter-client';
import * as fs from 'fs/promises';
import path from 'path';

interface TwitterCredentials {
  username: string;
  password: string;
  email: string;
  twoFactorSecret?: string;
}

interface TwitterCookie {
  key: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
}

interface TwitterConfig {
  credentials: TwitterCredentials;
  retryLimit?: number;
  requestDelay?: { min: number; max: number };
}

interface CacheManager {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, options?: { expires?: number }): Promise<void>;
}

class FileCacheManager implements CacheManager {
  private readonly CACHE_DIR = './cache';

  private getCacheFilePath(key: string): string {
    const result = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.CACHE_DIR, `${result}.json`);
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const filePath = this.getCacheFilePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Check if cache entry has expired
      if (parsed.expires && Date.now() > parsed.expires) {
        await this.delete(key);
        return undefined;
      }
      
      return parsed.value;
    } catch (error) {
      // File doesn't exist or is corrupted
      return undefined;
    }
  }

  async set<T>(key: string, value: T, options?: { expires?: number }): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key);
      const cacheEntry = {
        value,
        expires: options?.expires ? Date.now() + options.expires : undefined,
        timestamp: Date.now()
      };
      await fs.writeFile(filePath, JSON.stringify(cacheEntry, null, 2));
    } catch (error) {
      console.warn('Failed to write cache:', (error as Error).message);
    }
  }

  private async delete(key: string): Promise<void> {
    try {
      const filePath = this.getCacheFilePath(key);
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist, ignore
    }
  }
}

interface EventListeners {
  authenticated?: (data: { username: string }) => void;
  authenticationError?: (error: Error) => void;
  profileLoaded?: (profile: any) => void;
  logout?: () => void;
}

class RequestQueue {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;
  private requestDelay: { min: number; max: number };

  constructor(delay: { min: number; max: number } = { min: 1500, max: 3000 }) {
    this.requestDelay = delay;
  }

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      try {
        await request();
      } catch (error) {
        console.error("Error processing request:", error);
        // Re-queue failed request for retry
        this.queue.unshift(request);
        await this.exponentialBackoff(this.queue.length);
      }
      await this.randomDelay();
    }

    this.processing = false;
  }

  private async exponentialBackoff(retryCount: number): Promise<void> {
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async randomDelay(): Promise<void> {
    const delay = Math.floor(Math.random() *
      (this.requestDelay.max - this.requestDelay.min + 1)) + this.requestDelay.min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

export class TwitterAuthenticationClient {
  private scraper: Scraper;
  private config: TwitterConfig;
  private cacheManager: CacheManager;
  private requestQueue: RequestQueue;
  private isLoggedIn: boolean = false;
  private profile: any = null;
  private eventListeners: EventListeners = {};
  private processedInteractions: Set<string> = new Set();
  private interactionMonitoringActive: boolean = false;

  constructor(config: TwitterConfig, cacheManager?: CacheManager) {
    this.config = {
      retryLimit: 5,
      requestDelay: { min: 1500, max: 3000 },
      ...config
    };
    this.cacheManager = cacheManager || new FileCacheManager();
    this.requestQueue = new RequestQueue(this.config.requestDelay);

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
    const { username, password, email, twoFactorSecret } = this.config.credentials;
    let retries = this.config.retryLimit || 5;

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
        this.scraper.getProfile(this.config.credentials.username)
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
    const cacheKey = `twitter/${this.config.credentials.username}/cookies`;
    return await this.cacheManager.get<TwitterCookie[]>(cacheKey);
  }

  /**
   * Cache cookies
   */
  private async cacheCookies(cookies: any[]): Promise<void> {
    const cacheKey = `twitter/${this.config.credentials.username}/cookies`;
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
      username: this.config.credentials.username,
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
      const cacheKey = `twitter/${this.config.credentials.username}/cookies`;
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
  private async fetchInteractions(): Promise<any[]> {
    if (!this.isLoggedIn) {
      throw new Error('Not authenticated. Call initialize() first.');
    }

    try {
      console.log('🔍 Fetching interactions...');
      
      // Fetch mentions using the scraper
      const mentions = await this.requestQueue.add(() =>
        this.scraper.fetchSearchTweets(`@${this.config.credentials.username}`, 20, SearchMode.Latest)
      ) as any;

      // Filter out interactions we've already processed
      const newInteractions = mentions?.tweets?.filter((tweet: any) => {
        return !this.processedInteractions.has(tweet.id) && 
               tweet.userId !== this.profile?.userId && // Don't reply to our own tweets
               !tweet.isRetweet; // Don't reply to retweets
      }) || [];

      console.log(`📨 Found ${newInteractions.length} new interactions`);
      return newInteractions;

    } catch (error) {
      console.error('❌ Error fetching interactions:', (error as Error).message);
      return [];
    }
  }

  /**
   * Generate a hardcoded response - you can customize these responses
   */
  private generateResponse(originalTweet: any): string {
    const responses = [
      "Thanks for engaging! Always appreciate the conversation.",
      "Great point! Thanks for sharing your thoughts on this.",
      "I appreciate you taking the time to respond! 💭",
      "Thanks for the interaction! Love connecting with the community.",
      "Interesting perspective! Thanks for adding to the discussion.",
      "Appreciate the feedback! Always learning from the community.",
      "Thanks for engaging with my content! 🚀",
      "Great to see you in the conversation! Thanks for commenting.",
      "Love the engagement! Thanks for being part of the discussion.",
      "Thanks for the response! The community interactions make it all worthwhile."
    ];

    // Select a random response
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  /**
   * Reply to a specific tweet
   */
  private async replyToTweet(tweetId: string, replyText: string): Promise<void> {
    if (!this.isLoggedIn) {
      throw new Error('Not authenticated. Call initialize() first.');
    }

    try {
      console.log(`💬 Replying to tweet ${tweetId}: "${replyText}"`);
      
      await this.requestQueue.add(() =>
        this.scraper.sendTweet(replyText, tweetId)
      );

      console.log('✅ Reply sent successfully');

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

          // Generate response
          const response = this.generateResponse(interaction);

          // Reply to the interaction
          await this.replyToTweet(interaction.id, response);

          console.log(`✅ Responded to @${interaction.username}: "${response}"`);

          // Cache processed interaction to persist across sessions
          await this.cacheProcessedInteraction(interaction.id);

          // Add delay between responses to be more natural
          await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));

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
    const cacheKey = `twitter/${this.config.credentials.username}/processed_interactions`;
    
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
    const cacheKey = `twitter/${this.config.credentials.username}/processed_interactions`;
    
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
  async startInteractionMonitoring(intervalSeconds: number = 5): Promise<void> {
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

// Example usage and configuration
export interface TwitterAuthConfig {
  username: string;
  password: string;
  email: string;
  twoFactorSecret?: string;
  retryLimit?: number;
}

/**
 * Factory function to create and initialize Twitter client
 */
export async function createTwitterClient(
  config: TwitterAuthConfig,
  cacheManager?: CacheManager
): Promise<TwitterAuthenticationClient> {

  const authConfig: TwitterConfig = {
    credentials: {
      username: config.username,
      password: config.password,
      email: config.email,
      twoFactorSecret: config.twoFactorSecret
    },
    retryLimit: config.retryLimit || 5
  };

  const client = new TwitterAuthenticationClient(authConfig, cacheManager);

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

export default TwitterAuthenticationClient;