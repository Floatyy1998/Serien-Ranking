/**
 * Feature „Serien-Kalender" — geteilte Format-Helfer für SerienKalenderCard +
 * SerienKalenderHero + SerienKalenderPage (eigene Datei statt Export aus einer
 * Komponente, damit react-refresh nur Komponenten exportiert sieht).
 *
 * Anders als beim Anime-Season-Kalender kommen die Daten fertig hydratisiert
 * vom Backend-Export (public/catalog/tv-premieres.json): jedes Feld ist schon
 * deutsch + auf App-Vokabular gemappt, das Premierendatum ist ein sicheres
 * „YYYY-MM-DD". Die reinen Datums-Helfer (Tages-Label, relative Pill,
 * Datums-Band, Countdown-Startzeile) teilt sich die Seite mit dem
 * Anime-Kalender — sie arbeiten auf Date-Objekten und sind hier
 * wiederverwendet statt kopiert.
 */

import type { TvPremiereStaticEntry } from '../../services/staticCatalog';
import { appLocale, t } from '../../services/i18n';

// Reine Date-Helfer aus dem Anime-Kalender wiederverwenden (identische UI).
export {
  dayLabel,
  relativeDayLabel,
  datePillText,
  formatStartLong,
  isSameDay,
} from '../AnimeSeason/animeFormat';

/** „YYYY-MM-DD" → lokales Date (Mitternacht). null bei ungültigem String. */
export function parsePremiereDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** Quartal (0–3) eines Datums. */
export function quarterOf(date: Date): number {
  return Math.floor(date.getMonth() / 3);
}

/** Quartals-Schlüssel „2026-Q3" für Tab-Identität. */
export function quarterKey(date: Date): string {
  return `${date.getFullYear()}-Q${quarterOf(date) + 1}`;
}

/** Quartals-Label „Q3 2026" (Untertitel). */
export function quarterLabel(date: Date): string {
  return `Q${quarterOf(date) + 1} ${date.getFullYear()}`;
}

/** Kurzes Monats-Bereichs-Label „Jul–Sep" (Tab-Beschriftung). */
export function quarterRangeShort(date: Date): string {
  const q = quarterOf(date);
  const start = new Date(date.getFullYear(), q * 3, 1);
  const end = new Date(date.getFullYear(), q * 3 + 2, 1);
  const m = (d: Date) =>
    d
      .toLocaleDateString(appLocale === 'en' ? 'en-US' : 'de-DE', { month: 'short' })
      .replace('.', '');
  return `${m(start)}–${m(end)}`;
}

/** „2026-Q3" → Date (erster Tag des Quartals). */
export function parseQuarterKey(key: string): Date {
  const [year, qPart] = key.split('-Q');
  const q = Math.max(0, Math.min(3, Number(qPart) - 1));
  return new Date(Number(year), q * 3, 1);
}

/** Quartal verschieben (auf den ersten Tag des Quartals normalisiert). */
export function shiftQuarter(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), (quarterOf(date) + delta) * 3, 1);
}

/** Titel in App-Sprache — EN-Feld mit DE-Fallback (ältere Exporte ohne EN). */
export function premiereTitle(entry: TvPremiereStaticEntry): string {
  return (appLocale === 'en' && entry.titleEn) || entry.title;
}

/** Beschreibung in App-Sprache — EN-Feld mit DE-Fallback. */
export function premiereOverview(entry: TvPremiereStaticEntry): string {
  return (appLocale === 'en' && entry.overviewEn) || entry.overviewDe || '';
}

/** Karten-/Timeline-Badge aus dem Premieren-Typ: „Neu" (Primary) für eine
 *  ganz neue Serie, „Staffel N" (neutral) für einen Rückkehrer. */
export function premiereBadge(entry: TvPremiereStaticEntry): {
  label: string;
  isNew: boolean;
} {
  if (entry.type === 'season' && entry.seasonNumber) {
    return { label: t('Staffel {n}', { n: entry.seasonNumber }), isNew: false };
  }
  return { label: t('Neu'), isNew: true };
}

/** Meta-Zeile „Netflix · ★ 8.2" — Network zuerst, dann TMDB-Rating (10er). */
export function buildMetaLine(entry: TvPremiereStaticEntry): string {
  return [
    entry.networks?.[0] ?? null,
    typeof entry.rating === 'number' && entry.rating > 0 ? `★ ${entry.rating.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
