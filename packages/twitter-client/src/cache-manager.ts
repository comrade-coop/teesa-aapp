import * as fs from 'fs/promises';
import path from 'path';
import { CacheManager } from './types';

export class FileCacheManager implements CacheManager {
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