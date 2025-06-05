import 'server-only'
import { headers } from 'next/headers';
import { DEFAULT_LOCALE } from './utils';

export async function getLocaleServer() {
  const acceptLanguage = (await headers()).get('accept-language');
  const languages: string[] = acceptLanguage?.split(',') ?? [];
  const locale = languages.length > 0 ? languages[0] : DEFAULT_LOCALE;

  return locale;
}