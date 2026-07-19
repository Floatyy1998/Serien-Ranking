/**
 * Watch-Region (Provider-Land) — analog zur App-Sprache beim Boot fixiert.
 * Auto: Region-Subtag der Browser-Locale (de-DE → DE, en-US → US); reine
 * Sprachcodes fallen auf sinnvolle Defaults zurück. Wechsel in den
 * Einstellungen lädt die App neu.
 */

export type WatchRegionSetting = 'auto' | string;

const STORAGE_KEY = 'watchRegion';

/** Länder ohne Region-Subtag in der Locale: Sprache → wahrscheinlichstes Land. */
const LANGUAGE_DEFAULT_REGION: Record<string, string> = {
  de: 'DE',
  en: 'US',
  fr: 'FR',
  it: 'IT',
  es: 'ES',
  pt: 'PT',
  nl: 'NL',
  pl: 'PL',
  tr: 'TR',
  ja: 'JP',
  ko: 'KR',
};

export const getWatchRegionSetting = (): WatchRegionSetting => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && /^[A-Z]{2}$/.test(v) ? v : 'auto';
  } catch {
    return 'auto';
  }
};

export const setWatchRegionSetting = (value: WatchRegionSetting): void => {
  try {
    if (value === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* quota-fragil — dann bleibt es bei Auto */
  }
};

const detect = (): string => {
  const testRegion = (globalThis as { __TVRANK_TEST_REGION__?: string }).__TVRANK_TEST_REGION__;
  if (testRegion && /^[A-Z]{2}$/.test(testRegion)) return testRegion;
  const setting = getWatchRegionSetting();
  if (setting !== 'auto') return setting;
  try {
    const langs =
      typeof navigator !== 'undefined'
        ? navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language]
        : [];
    for (const lang of langs) {
      const m = (lang || '').match(/^[a-z]{2,3}-([A-Za-z]{2})\b/i);
      if (m) return m[1].toUpperCase();
    }
    for (const lang of langs) {
      const base = (lang || '').slice(0, 2).toLowerCase();
      if (LANGUAGE_DEFAULT_REGION[base]) return LANGUAGE_DEFAULT_REGION[base];
    }
    return 'DE';
  } catch {
    return 'DE';
  }
};

/** Beim Boot fixierte Region — Wechsel erfordert Reload (wie appLocale). */
export const watchRegion: string = detect();

/**
 * Nimmt aus einer TMDB-watch/providers-Antwort (`results`-Map, Schlüssel =
 * Ländercodes) den Eintrag der Watch-Region; Fallback DE (Katalog-Heimat).
 */
export function pickProviderRegion<T>(
  results: Record<string, T> | undefined | null
): T | undefined {
  if (!results) return undefined;
  return results[watchRegion] ?? results.DE;
}
