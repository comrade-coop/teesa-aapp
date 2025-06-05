export interface TwitterCredentials {
  username: string;
  password: string;
  email: string;
  twoFactorSecret?: string;
}

export interface TwitterCookie {
  key: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
}

export interface CacheManager {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, options?: { expires?: number }): Promise<void>;
}

export interface TwitterInteraction {
  id: string;
  username: string;
  userId: string;
  text: string;
  isRetweet: boolean;
  [key: string]: any; // Allow additional properties from the API
}

export interface EventListeners {
  authenticated?: (data: { username: string }) => void;
  authenticationError?: (error: Error) => void;
  profileLoaded?: (profile: any) => void;
  logout?: () => void;
  interactionReceived?: (interaction: TwitterInteraction) => void;
}

export interface TwitterAuthConfig {
  username: string;
  password: string;
  email: string;
  twoFactorSecret?: string;
  retryLimit?: number;
} 