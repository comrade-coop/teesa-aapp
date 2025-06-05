import fs from 'fs';

export class FileLock {
  private lockFilePath: string;

  constructor(filePath: string) {
    this.lockFilePath = filePath + '.lock';
  }

  private async acquireLock(): Promise<void> {
    const maxRetries = 100;
    const retryDelay = 50; // 50ms
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Try to create lock file exclusively
        fs.writeFileSync(this.lockFilePath, process.pid.toString(), { flag: 'wx' });
        return; // Successfully acquired lock
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock file exists, check if the process that created it is still running
          try {
            const lockPid = parseInt(fs.readFileSync(this.lockFilePath, 'utf-8'));
            try {
              // Check if process is still running (throws if not)
              process.kill(lockPid, 0);
              // Process is still running, wait and retry
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              continue;
            } catch {
              // Process is not running, remove stale lock
              fs.unlinkSync(this.lockFilePath);
              continue;
            }
          } catch {
            // Can't read lock file, try to remove it
            try {
              fs.unlinkSync(this.lockFilePath);
            } catch {
              // Ignore errors when removing lock file
            }
            continue;
          }
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Could not acquire file lock after maximum retries');
  }

  private releaseLock(): void {
    try {
      fs.unlinkSync(this.lockFilePath);
    } catch (error) {
      // Ignore errors when releasing lock
    }
  }

  async withLock<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquireLock();
    try {
      const result = await operation();
      return result;
    } finally {
      this.releaseLock();
    }
  }

  removeLockFile(): void {
    try {
      if (fs.existsSync(this.lockFilePath)) {
        fs.unlinkSync(this.lockFilePath);
      }
    } catch (error) {
      // Ignore errors when removing lock file
    }
  }
} 