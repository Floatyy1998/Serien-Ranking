/**
 * Mini-i18n: Deutsch ist Quellsprache UND Fallback. t('Deutscher Text') liefert
 * auf Englisch die Übersetzung aus dem en-Wörterbuch — fehlt ein Eintrag,
 * bleibt der deutsche Text stehen (nichts kann brechen). Platzhalter: {name}.
 * Sprache wird beim Boot fixiert; Wechsel in den Einstellungen lädt die App neu.
 */

import en from '../i18n/en';

export type AppLanguage = 'auto' | 'de' | 'en';

const STORAGE_KEY = 'appLanguage';

export const getAppLanguageSetting = (): AppLanguage => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'de' || v === 'en' ? v : 'auto';
  } catch {
    return 'auto';
  }
};

export const setAppLanguageSetting = (value: AppLanguage): void => {
  try {
    if (value === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* quota-fragil — dann bleibt es bei Auto */
  }
};

const detect = (): 'de' | 'en' => {
  // Test-Umgebung (Vitest-Setup) pinnt Deutsch — Node/jsdom melden en-US,
  // und sämtliche Test-Assertions sind gegen die deutschen Quelltexte.
  const testLocale = (globalThis as { __TVRANK_TEST_LOCALE__?: string }).__TVRANK_TEST_LOCALE__;
  if (testLocale === 'de' || testLocale === 'en') return testLocale;
  const setting = getAppLanguageSetting();
  if (setting !== 'auto') return setting;
  try {
    const langs =
      typeof navigator !== 'undefined'
        ? navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language]
        : [];
    // DACH-Heuristik: irgendeine bevorzugte Browsersprache ist Deutsch → Deutsch
    return langs.some((l) => (l || '').toLowerCase().startsWith('de')) ? 'de' : 'en';
  } catch {
    return 'de';
  }
};

/** Beim Boot fixierte Sprache — Wechsel erfordert Reload (bewusst simpel). */
export const appLocale: 'de' | 'en' = detect();

export const isEnglish = (): boolean => appLocale === 'en';

export function t(text: string, vars?: Record<string, string | number>): string {
  let out = appLocale === 'en' ? (en[text] ?? text) : text;
  if (vars) {
    for (const key of Object.keys(vars)) {
      out = out.split(`{${key}}`).join(String(vars[key]));
    }
  }
  return out;
}
