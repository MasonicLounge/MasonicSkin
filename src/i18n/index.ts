import en from '../locales/en.json';
import ru from '../locales/ru.json';

export type Locale = 'en' | 'ru';

const LOCALE_KEY = 'masonic_locale';

const catalogs: Record<Locale, Record<string, string>> = { en, ru };

const listeners = new Set<() => void>();

function detect(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === 'en' || stored === 'ru') {
    return stored;
  }
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

let current: Locale = detect();
document.documentElement.lang = current;

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  localStorage.setItem(LOCALE_KEY, locale);
  document.documentElement.lang = locale;
  for (const fn of listeners) {
    fn();
  }
}

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const catalog = catalogs[current];
  let message = catalog[key];
  if (message === undefined) {
    message = catalogs.en[key];
  }
  if (message === undefined) {
    return key;
  }
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
  }
  return message;
}