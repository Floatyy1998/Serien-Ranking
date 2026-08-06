/**
 * Einzige Quelle der Wahrheit für unterstützte Sprachen. Eine weitere Sprache
 * ergänzt man hier plus ein Wörterbuch unter `src/i18n/<code>/` — sonst
 * nirgends. Reine Datentabelle, kein I/O.
 */

export const LOCALES = ['de', 'en', 'es', 'fr'] as const;

export type Locale = (typeof LOCALES)[number];

/** Quellsprache des Codes: `t('Deutscher Text')` schlägt hierauf zurück. */
export const SOURCE_LOCALE: Locale = 'de';

/** Anzeigename in der jeweiligen Sprache — für die Sprachauswahl. */
export const LOCALE_LABEL: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

/** BCP-47 für `Intl` (Datums- und Zahlenformatierung). */
export const LOCALE_TAG: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
};

/**
 * Sprachparameter für TMDB. Eigene Tabelle statt `LOCALE_TAG`, weil TMDB
 * Sprache und Region getrennt behandelt und nicht jede Kombination kennt.
 */
export const TMDB_LANGUAGE: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
};

/**
 * Rückfallkette je Sprache. Fehlt ein spanischer Eintrag, ist Englisch die
 * bessere Notlösung als der deutsche Quelltext — erst danach greift Deutsch.
 * Deutsch und Englisch fallen direkt auf die Quelle zurück.
 */
export const FALLBACK_CHAIN: Record<Locale, readonly Locale[]> = {
  de: [],
  en: [],
  es: ['en'],
  fr: ['en'],
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

/**
 * Beste unterstützte Sprache zu einer Liste von Browser-Sprachen
 * (`navigator.languages`), in deren Reihenfolge. `null`, wenn nichts passt.
 */
export function matchLocale(preferred: readonly string[]): Locale | null {
  for (const raw of preferred) {
    const base = String(raw || '')
      .toLowerCase()
      .split('-')[0];
    if (isLocale(base)) return base;
  }
  return null;
}
