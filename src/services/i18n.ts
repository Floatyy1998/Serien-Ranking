/**
 * Mini-i18n: Deutsch ist Quellsprache UND letzter Fallback. `t('Deutscher
 * Text')` liefert die Übersetzung aus dem Wörterbuch der aktiven Sprache —
 * fehlt ein Eintrag, greift die Rückfallkette (z. B. Spanisch → Englisch →
 * Deutsch), sodass nie etwas bricht. Platzhalter: {name}.
 *
 * Die Sprache wird beim Boot fixiert; ein Wechsel in den Einstellungen lädt
 * die App neu (bewusst simpel).
 *
 * Eine weitere Sprache: Eintrag in `i18n/locales.ts` + Wörterbuch unter
 * `i18n/<code>/` + eine Zeile in DICTIONARIES. Sonst nichts.
 */

import en from '../i18n/en';
import es from '../i18n/es';
import fr from '../i18n/fr';
import pt from '../i18n/pt';
import {
  FALLBACK_CHAIN,
  LOCALES,
  LOCALE_TAG,
  SOURCE_LOCALE,
  TMDB_LANGUAGE,
  isLocale,
  matchLocale,
  type Locale,
} from '../i18n/locales';

export {
  LOCALES,
  LOCALE_LABEL,
  LOCALE_TAG,
  SOURCE_LOCALE,
  isLocale,
  type Locale,
} from '../i18n/locales';

type Dictionary = Record<string, string>;

/** Kein Eintrag für die Quellsprache — dort ist der Schlüssel der Text. */
const DICTIONARIES: Partial<Record<Locale, Dictionary>> = { en, es, fr, pt };

export type AppLanguage = 'auto' | Locale;

const STORAGE_KEY = 'appLanguage';

export const getAppLanguageSetting = (): AppLanguage => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : 'auto';
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

const detect = (): Locale => {
  // Test-Umgebung (Vitest-Setup) pinnt eine Sprache — Node/jsdom melden en-US,
  // und sämtliche Test-Assertions sind gegen die deutschen Quelltexte.
  const testLocale = (globalThis as { __TVRANK_TEST_LOCALE__?: string }).__TVRANK_TEST_LOCALE__;
  if (isLocale(testLocale)) return testLocale;

  const setting = getAppLanguageSetting();
  if (setting !== 'auto') return setting;

  try {
    const preferred =
      typeof navigator !== 'undefined'
        ? navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language]
        : [];
    // Erste vom Browser bevorzugte Sprache, die wir sprechen. Kennt der
    // Browser keine davon, ist Englisch die breitere Notlösung als Deutsch.
    return matchLocale(preferred) ?? 'en';
  } catch {
    return SOURCE_LOCALE;
  }
};

/** Beim Boot fixierte Sprache — Wechsel erfordert Reload. */
export const appLocale: Locale = detect();

/** BCP-47-Tag der aktiven Sprache für `Intl` (Datum, Zahlen). */
export const dateLocale = (): string => LOCALE_TAG[appLocale];

/** Sprachparameter für TMDB-Anfragen in der aktiven Sprache. */
export const tmdbLanguage = (): string => TMDB_LANGUAGE[appLocale];

/**
 * Sprachkürzel für sprachabhängige Dateien (Rechtstexte, Katalog-Overlays),
 * in Reihenfolge der Rückfallkette und ohne die Quellsprache — für die gibt
 * es keine Suffix-Datei, sie ist das unbenannte Original.
 */
export const localeFileChain = (): Locale[] =>
  [appLocale, ...FALLBACK_CHAIN[appLocale]].filter((l) => l !== SOURCE_LOCALE);

function lookup(locale: Locale, text: string): string | undefined {
  if (locale === SOURCE_LOCALE) return text;
  const direct = DICTIONARIES[locale]?.[text];
  if (direct !== undefined) return direct;
  for (const next of FALLBACK_CHAIN[locale]) {
    const chained = DICTIONARIES[next]?.[text];
    if (chained !== undefined) return chained;
  }
  return undefined;
}

/** Übersetzung in eine feste Sprache — z. B. für Benachrichtigungen an andere. */
export function tLocale(
  locale: Locale,
  text: string,
  vars?: Record<string, string | number>
): string {
  let out = lookup(locale, text) ?? text;
  if (vars) {
    for (const key of Object.keys(vars)) {
      out = out.split(`{${key}}`).join(String(vars[key]));
    }
  }
  return out;
}

export function t(text: string, vars?: Record<string, string | number>): string {
  return tLocale(appLocale, text, vars);
}

/** Übersetzungen eines Textes, abgelegt neben dem deutschen Quelltext. */
export type LocalizedMap = Partial<Record<Locale, string>>;

/**
 * Alle Nicht-Quellsprachen eines Textes — für Meldungen an ANDERE Nutzer,
 * deren Sprache beim Schreiben noch nicht feststeht. Die Quellsprache fehlt
 * bewusst (die steht im Feld daneben), und Einträge, die sich nicht von der
 * Quelle unterscheiden, bleiben weg: das spart Platz und Egress.
 */
export function localizedVariants(
  text: string,
  vars?: Record<string, string | number>
): LocalizedMap {
  const map: LocalizedMap = {};
  const source = tLocale(SOURCE_LOCALE, text, vars);
  for (const locale of LOCALES) {
    if (locale === SOURCE_LOCALE) continue;
    const value = tLocale(locale, text, vars);
    if (value !== source) map[locale] = value;
  }
  return map;
}

/**
 * Beste verfügbare Fassung: erst die Sprache selbst, dann ihre Rückfallkette,
 * zuletzt der mitgeschriebene Quelltext. Nie leer.
 */
export function pickLocalized(
  source: string,
  map: LocalizedMap | undefined | null,
  locale: Locale = appLocale
): string {
  if (!map || locale === SOURCE_LOCALE) return source;
  const direct = map[locale];
  if (direct) return direct;
  for (const next of FALLBACK_CHAIN[locale]) {
    const chained = map[next];
    if (chained) return chained;
  }
  return source;
}
