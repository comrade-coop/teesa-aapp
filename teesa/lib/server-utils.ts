import 'server-only'
import { headers } from 'next/headers';
import { DEFAULT_LOCALE } from './utils';

export async function getLocaleServer() {
  const acceptLanguage = (await headers()).get('accept-language');
  const languages: string[] = acceptLanguage?.split(',') ?? [];
  const locale = languages.length > 0 ? languages[0] : DEFAULT_LOCALE;

  return locale;
}

export function retryWithExponentialBackoff(
  operation: () => Promise<any>,
  onSuccess?: () => Promise<void>,
  onFailure?: (attempt: number) => Promise<void>
) {
  // Start a new task to handle retries
  (async () => {
    const initialDelayMs = 1000; // 1 second
    const maxDelayMs = 600000; // 10 minutes

    let attempt = 1;
    while(true) {
      try {
        await operation();
        
        if (onSuccess) {
          await onSuccess();
        }

        return;
      } catch (error) {
        console.error(`Attempt ${attempt} failed.`);

        if (onFailure) {
          await onFailure(attempt);
        }
      }

      // Exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      console.log(`Retrying in ${delay / 1000}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  })();
}