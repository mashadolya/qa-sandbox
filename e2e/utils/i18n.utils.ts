import en from '../../public/assets/i18n/en.json';
import nb from '../../public/assets/i18n/nb.json';
import { Language } from '../types/language.types';

// The app's own translation files are the single source of UI text, so the
// suite never duplicates labels and a missing translation fails a test.

type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];

/** A dotted key into the app's translation files, e.g. `clients.new`. */
export type TranslationKey = Paths<typeof en>;
export type Translate = (key: TranslationKey) => string;

const DICTIONARIES: Record<Language, typeof en> = {
  [Language.ENGLISH]: en,
  [Language.NORSK]: nb,
};

/** Looks keys up in the app's translation file for `language`. */
export function translator(language: Language): Translate {
  return (key) => key.split('.').reduce<any>((node, part) => node[part], DICTIONARIES[language]);
}

/** Formats like Angular's `number: '1.<min>-<max>'` pipe in the app's locale. */
export function formatNumber(
  value: number,
  language: Language,
  { minDigits = 0, maxDigits = 0 }: { minDigits?: number; maxDigits?: number } = {},
): string {
  return value.toLocaleString(language, {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });
}

/** Formats an ISO date like the app's `date: 'd. MMM y'` pipe, e.g. "20. May 2026". */
export function formatShortDate(isoDate: string, language: Language): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const month = date.toLocaleString(language, { month: 'short', timeZone: 'UTC' });
  return `${date.getUTCDate()}. ${month} ${date.getUTCFullYear()}`;
}
