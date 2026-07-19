/**
 * Feature „Anime-Season-Kalender" — geteilte Format-Helper für
 * AnimeSeasonCard + AnimeSeasonHero (eigene Datei statt Export aus der
 * Karten-Komponente, damit react-refresh nur Komponenten exportiert sieht).
 */

import type { SeasonAnime } from '../../services/anilistSeasonService';
import { appLocale, t } from '../../services/i18n';

/** Datumsformatierung folgt der App-Sprache (Boot-fixiert wie t()). */
const DATE_LOCALE = appLocale === 'en' ? 'en-US' : 'de-DE';

const FORMAT_LABELS_DE: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: t('Kurzserie'),
  MOVIE: t('Film'),
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: t('Musik'),
};

export function formatLabelDe(format: string | null): string | null {
  if (!format) return null;
  return FORMAT_LABELS_DE[format] ?? format;
}

/** Karten-Badge fürs Format: TV/ONA/unbekannt → „Serie" (ONA = Web-Serie,
 *  für Nutzer dasselbe), sonst deutsches Label („Film", „OVA", „Special",
 *  „Kurzserie"). Im FILTER zählt alles außer MOVIE als Serie. */
export function formatBadgeDe(format: string | null): string {
  if (!format || format === 'TV' || format === 'ONA') return t('Serie');
  return FORMAT_LABELS_DE[format] ?? format;
}

/** TV/ONA/unbekannt = Serie — sprachunabhängiger Check (kein Label-Vergleich). */
export function isSeriesFormat(format: string | null): boolean {
  return !format || format === 'TV' || format === 'ONA';
}

/** Kompakter Countdown: „2d", „4h", „12min". */
export function shortCountdown(seconds: number): string {
  if (seconds <= 0) return t('jetzt');
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days}d`;
  const hours = Math.floor((seconds % 86400) / 3600);
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, Math.floor((seconds % 3600) / 60))}min`;
}

/** AniList-startDate → Date (mind. Jahr+Monat nötig, Tag fällt auf den 1.). */
export function startDateToDate(startDate: SeasonAnime['startDate']): Date | null {
  if (!startDate?.year || !startDate.month) return null;
  return new Date(startDate.year, startDate.month - 1, startDate.day ?? 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** AniList-Description: HTML-Tags/Entities strippen, Whitespace bündeln. */
export function stripDescription(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Meta-Zeile „Studio · 12 Ep. · ★ 8.2" — Fortlaufend: „seit Frühling 2026 · …".
 *  Rating: TMDB-vote_average (10er-Skala, wie überall in der App); solange
 *  die Hydration läuft, AniList-% auf dieselbe Skala umgerechnet (76% → 7.6),
 *  damit beim Eintreffen des TMDB-Werts nichts umspringt. Filme lassen die
 *  Episodenzahl weg („1 Ep." trägt nichts). */
export function buildMetaLine(
  anime: SeasonAnime,
  sinceLabel?: string,
  tmdbRating?: number | null
): string {
  const rating =
    typeof tmdbRating === 'number' && tmdbRating > 0
      ? tmdbRating
      : typeof anime.averageScore === 'number' && anime.averageScore > 0
        ? anime.averageScore / 10
        : null;
  return [
    sinceLabel
      ? t('seit {label}', { label: sinceLabel })
      : (anime.studios?.nodes?.[0]?.name ?? null),
    anime.episodes && anime.format !== 'MOVIE' ? `${anime.episodes} Ep.` : null,
    rating ? `★ ${rating.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

const ROMAN_SEASONS: Record<string, number> = {
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
};

/**
 * Fortsetzungs-Label: „Staffel 2" / „Part 2" / „Staffel 3 · Part 2" /
 * „Finale Staffel" aus dem Titel; ohne Titel-Treffer entscheidet die
 * AniList-PREQUEL-Relation („Fortsetzung"). null = komplett neue Serie.
 */
export function continuationLabel(anime: SeasonAnime): string | null {
  const title = anime.title.english || anime.title.romaji || '';
  const parts: string[] = [];

  const season = title.match(/season\s*(\d+)/i) || title.match(/(\d+)(?:st|nd|rd|th)\s+season/i);
  if (season) {
    parts.push(t('Staffel {n}', { n: season[1] }));
  } else if (/final\s+season/i.test(title)) {
    parts.push(t('Finale Staffel'));
  } else {
    // Römische Staffel-Ziffer am Titelende („Overlord IV").
    const roman = title.match(/\s(II|III|IV|V|VI|VII|VIII|IX)$/);
    if (roman) parts.push(t('Staffel {n}', { n: ROMAN_SEASONS[roman[1]] }));
  }

  const part = title.match(/part\s*(\d+)/i) || title.match(/cour\s*(\d+)/i);
  if (part) parts.push(`Part ${part[1]}`);

  if (parts.length) return parts.join(' · ');

  const hasPrequel = anime.relations?.edges?.some((edge) => edge.relationType === 'PREQUEL');
  return hasPrequel ? t('Fortsetzung') : null;
}

/**
 * Season-/Part-Suffix aus einem Titel strippen („Saga of Tanya the Evil
 * Season 2" → „Saga of Tanya the Evil", „Mushoku Tensei III: …" → „Mushoku
 * Tensei: …"). Sequel-Seasons sind bei TMDB EINE Serie unter dem Basistitel —
 * Listen-Match und TMDB-Suche laufen sonst ins Leere.
 */
export function stripSeasonSuffix(title: string): string {
  return title
    .replace(/\s*[:\-–]?\s*\d+(?:st|nd|rd|th)\s+season\b/gi, '')
    .replace(/\s*[:\-–]?\s*season\s*\d+\b/gi, '')
    .replace(/\s*[:\-–]?\s*(?:part|cour)\s*\d+\b/gi, '')
    .replace(/\s*[:\-–]?\s*final\s+season\b/gi, '')
    .replace(/\s+(?:II|III|IV|V|VI|VII|VIII|IX)(?=\s*[:\-–]|\s*$)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s:\-–]+$/, '')
    .trim();
}

/**
 * Franchise-Basistitel vor einem Arc-Untertitel: „Tokyo Revengers: Santen
 * Sensou-hen" → „Tokyo Revengers". TMDB/Listen führen Arc-Staffeln unter dem
 * Franchise-Namen. Mindestlänge 4 vor dem Doppelpunkt schützt Titel wie
 * „Re:ZERO"; null = kein sinnvoller Präfix.
 */
export function franchiseTitle(title: string): string | null {
  const idx = title.indexOf(':');
  if (idx < 4) return null;
  const base = stripSeasonSuffix(title.slice(0, idx).trim());
  return base.length >= 4 ? base : null;
}

/** Timeline-Tages-Label: „FREITAG · 3. JULI". */
export function dayLabel(date: Date): string {
  const weekday = date.toLocaleDateString(DATE_LOCALE, { weekday: 'long' }).toUpperCase();
  const month = date.toLocaleDateString(DATE_LOCALE, { month: 'long' }).toUpperCase();
  return `${weekday} · ${date.getDate()}. ${month}`;
}

/** Relative Tages-Pill: „Gestern" / „Heute" / „Morgen" / „in 5 Tagen". */
export function relativeDayLabel(date: Date, now: Date): string | null {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(date) - startOf(now)) / 86400000);
  if (diffDays === -1) return t('Gestern');
  if (diffDays === 0) return t('Heute');
  if (diffDays === 1) return t('Morgen');
  if (diffDays > 1 && diffDays <= 13) return t('in {n} Tagen', { n: diffDays });
  return null;
}

/** Prominentes Datums-Band für die Poster-Pill: „SA · 4. JULI". */
export function datePillText(date: Date): string {
  const weekday = date
    .toLocaleDateString(DATE_LOCALE, { weekday: 'short' })
    .replace('.', '')
    .toUpperCase();
  const month = date.toLocaleDateString(DATE_LOCALE, { month: 'long' }).toUpperCase();
  return `${weekday} · ${date.getDate()}. ${month}`;
}

/** Große Hero-Startzeile: „Startet Samstag, 4. Juli" (+Jahr falls fremd). */
export function formatStartLong(date: Date, now: Date): string {
  const withYear = date.getFullYear() !== now.getFullYear();
  return t('Startet {datum}', {
    datum: date.toLocaleDateString(DATE_LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      ...(withYear ? { year: 'numeric' as const } : {}),
    }),
  });
}
