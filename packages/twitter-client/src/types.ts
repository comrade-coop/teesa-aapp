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

export interface TwitterConfig {
  credentials: TwitterCredentials;
  retryLimit?: number;
  requestDelay?: { min: number; max: number };
}

export interface CacheManager {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, options?: { expires?: number }): Promise<void>;
}

export interface EventListeners {
  authenticated?: (data: { username: string }) => void;
  authenticationError?: (error: Error) => void;
  profileLoaded?: (profile: any) => void;
  logout?: () => void;
}

export interface TwitterAuthConfig {
  username: string;
  password: string;
  email: string;
  twoFactorSecret?: string;
  retryLimit?: number;
} 