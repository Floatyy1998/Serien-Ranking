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
 * `i18n/<code>/` + eine Zeile in LOADERS. Sonst nichts.
 *
 * Die Wörterbücher werden NACHGELADEN, nicht statisch importiert: zusammen
 * sind sie ~970 kB, und statisch lagen sie im modulepreload der index.html —
 * also vor dem ersten Frame des Splashscreens, für jeden Nutzer, in jeder
 * Sprache. Geladen wird jetzt nur die aktive Sprache samt Rückfallkette
 * (`ensureActiveDictionaries`, vor dem ersten Render abgewartet); für Deutsch
 * gar keins, weil dort der Schlüssel selbst der Text ist. Alle zusammen
 * braucht nur `localizedVariants` — das lädt sie sich selbst nach.
 */

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
const DICTIONARIES: Partial<Record<Locale, Dictionary>> = {};

/** Je Sprache ein eigenes Chunk. Die Quellsprache hat bewusst keinen Eintrag. */
const LOADERS: Partial<Record<Locale, () => Promise<{ default: Dictionary }>>> = {
  en: () => import('../i18n/en'),
  es: () => import('../i18n/es'),
  fr: () => import('../i18n/fr'),
  pt: () => import('../i18n/pt'),
};

const inFlight = new Map<Locale, Promise<void>>();

function loadDictionary(locale: Locale): Promise<void> {
  if (locale === SOURCE_LOCALE || DICTIONARIES[locale]) return Promise.resolve();
  const running = inFlight.get(locale);
  if (running) return running;
  const loader = LOADERS[locale];
  if (!loader) return Promise.resolve();
  const promise = loader()
    .then((module) => {
      DICTIONARIES[locale] = module.default;
    })
    .catch((error) => {
      // Fehlt ein Wörterbuch, greift die Rückfallkette bis zum deutschen
      // Quelltext — die App bleibt bedienbar, nur eben unübersetzt.
      console.warn(`[i18n] Wörterbuch ${locale} konnte nicht geladen werden`, error);
      inFlight.delete(locale);
    });
  inFlight.set(locale, promise);
  return promise;
}

/**
 * Wörterbücher der aktiven Sprache samt Rückfallkette. MUSS vor dem ersten
 * Render abgewartet werden — einige Datentabellen rufen `t()` schon beim
 * Auswerten ihres Moduls auf. Für Deutsch ist das ein No-op.
 */
export function ensureActiveDictionaries(): Promise<void> {
  if (appLocale === SOURCE_LOCALE) return Promise.resolve();
  return Promise.all([appLocale, ...FALLBACK_CHAIN[appLocale]].map(loadDictionary)).then(
    () => undefined
  );
}

let allDictionaries: Promise<void> | null = null;

/**
 * Alle Wörterbücher — nur `localizedVariants` braucht das (Meldungen an andere
 * Nutzer, deren Sprache beim Schreiben noch nicht feststeht). Bewusst NICHT
 * beim Start: das sind die vollen ~970 kB.
 */
export function ensureAllDictionaries(): Promise<void> {
  allDictionaries ??= Promise.all(LOCALES.map(loadDictionary)).then(() => undefined);
  return allDictionaries;
}

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
export async function localizedVariants(
  text: string,
  vars?: Record<string, string | number>
): Promise<LocalizedMap> {
  await ensureAllDictionaries();
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

// Sprachtabelle der aktiven Sprache laden, BEVOR ein importierendes Modul
// ausgewertet wird. Top-Level-await ist das einzige Mittel, das diese Garantie
// gibt: statische Importe laufen vollstaendig durch, bevor irgendein
// Rumpf-Code in index.tsx an die Reihe kommt — und ueber 40 Module rufen t()
// bereits beim Auswerten auf (Badge-Definitionen, Poster-Platzhalter,
// Filter-Listen). Ein await in index.tsx kaeme also zu spaet und wuerde
// nicht-deutschen Nutzern dort dauerhaft die deutschen Quelltexte zeigen.
// Fuer Deutsch ist das ein bereits aufgeloestes Promise, kostet also nichts.
await ensureActiveDictionaries();
