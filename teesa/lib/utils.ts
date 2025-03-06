import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const DEFAULT_LOCALE = 'en-GB';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isNullOrWhiteSpace(string: string) {
  return string == null || string == undefined || string.trim() == '';
}

export function getTimestamp(): number {
  return Date.now();
}

export function getLocaleClient(): string {
  const languages = navigator.languages;
  const locale = languages.length > 0 ? languages[0] : DEFAULT_LOCALE;

  return locale;
}

export function timestampToFormatedDate(locale: string, timestamp: number): string{
  const timestampAsDate = new Date(timestamp);
  const result = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(timestampAsDate);

  return result;
}

export function stringIsNullOrEmpty(string: string | undefined | null): boolean {
  return string == null || string == undefined || string.trim() == '';
}