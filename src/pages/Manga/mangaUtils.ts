import type { useTheme } from '../../contexts/ThemeContextDef';

/** Theme type alias to avoid `typeof import()` in component props */
export type AppTheme = ReturnType<typeof useTheme>['currentTheme'];

/**
 * AniList meldet fast alles als format: "MANGA", auch Manhwa/Manhua.
 * Die zuverlässige Unterscheidung läuft über countryOfOrigin:
 * JP = Manga, KR = Manhwa, CN = Manhua
 */
export function getDisplayFormat(countryOfOrigin?: string, format?: string): string {
  if (countryOfOrigin === 'KR') return 'Manhwa';
  if (countryOfOrigin === 'CN') return 'Manhua';
  if (format === 'ONE_SHOT') return 'One Shot';
  if (format === 'NOVEL') return 'Novel';
  return 'Manga';
}

export function getDisplayFormatKey(countryOfOrigin?: string, format?: string): string {
  if (countryOfOrigin === 'KR') return 'MANHWA';
  if (countryOfOrigin === 'CN') return 'MANHUA';
  if (format === 'ONE_SHOT') return 'ONE_SHOT';
  if (format === 'NOVEL') return 'NOVEL';
  return 'MANGA';
}

export const FORMAT_COLORS: Record<string, string> = {
  MANGA: '#e879f9',
  MANHWA: '#38bdf8',
  MANHUA: '#fb923c',
  ONE_SHOT: '#a78bfa',
  NOVEL: '#34d399',
};

export const STATUS_LABELS: Record<string, string> = {
  reading: 'Lese ich',
  completed: 'Abgeschlossen',
  paused: 'Pausiert',
  dropped: 'Abgebrochen',
  planned: 'Geplant',
};

export const STATUS_COLORS: Record<string, string> = {
  reading: '#3b82f6',
  completed: '#22c55e',
  paused: '#f59e0b',
  dropped: '#ef4444',
  planned: '#8b5cf6',
};

export const ANILIST_STATUS_LABELS: Record<string, string> = {
  RELEASING: 'Laufend',
  FINISHED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
  HIATUS: 'Hiatus',
  NOT_YET_RELEASED: 'Noch nicht erschienen',
};

/** Wenn ein RELEASING-Manga laenger als das hier kein neues Chapter hatte,
 *  inferieren wir Hiatus. AniList nutzt HIATUS sehr restriktiv und labelt
 *  Vagabond/Berserk z.B. weiterhin als RELEASING. */
export const HIATUS_INFERENCE_DAYS = 180;

/**
 * MangaUpdates listet bei manchen Titeln nach dem Hauptlauf "Renumbering"-
 * Releases mit niedrigeren Chapter-Nummern (z.B. Vagabond: nach Chapter 326
 * vom 2015 erschien 2020 ein "Comeback"-Chapter mit der Nummer 2). Solche
 * Anomalien wuerden in der Detail-Ansicht oben als "letztes Kapitel"
 * erscheinen. Wir filtern sie raus, indem wir chronologisch (alt → neu)
 * lesen und nur Releases akzeptieren, deren Nummer >= dem bisherigen Maximum
 * ist. Die Eingabe ist nach Datum descending sortiert; Output behaelt diese
 * Reihenfolge.
 */
export function filterMonotonicReleases<T extends { chapter: number }>(releases: T[]): T[] {
  if (releases.length === 0) return releases;
  const oldestFirst = [...releases].reverse();
  let maxSeen = 0;
  const valid: T[] = [];
  for (const r of oldestFirst) {
    if (r.chapter >= maxSeen) {
      valid.push(r);
      maxSeen = r.chapter;
    }
  }
  return valid.reverse();
}

/**
 * Effektiver Status fuer Anzeige & Logik. Faellt auf den persistierten
 * AniList-Status zurueck, ausser fuer RELEASING-Manga ohne juengstes
 * Release: dann inferieren wir HIATUS.
 */
export function inferStatus(manga: {
  status?: string;
  lastReleaseDate?: string;
}): string | undefined {
  if (manga.status !== 'RELEASING') return manga.status;
  if (!manga.lastReleaseDate) return manga.status;
  const ageMs = Date.now() - new Date(manga.lastReleaseDate).getTime();
  if (ageMs > HIATUS_INFERENCE_DAYS * 24 * 60 * 60 * 1000) return 'HIATUS';
  return manga.status;
}

export function getStatusLabel(manga: { status?: string; lastReleaseDate?: string }): string {
  const s = inferStatus(manga);
  if (!s) return '';
  return ANILIST_STATUS_LABELS[s] || s;
}

/**
 * AniList's chapters-Feld ist bei laufenden Serien oft veraltet (z.B.
 * Vagabond meldet 2 statt 326). MangaUpdates' latestChapterAvailable ist
 * dann hoeher. First-truthy-Wins (chapters || latestChapterAvailable)
 * waehlt aber die falsche Quelle. Stattdessen den Max nehmen.
 *
 * Optionale extraSources erlauben es, live geladene Daten (z.B. mangadexInfo
 * aus useEffect) einzurechnen, bevor der Firebase-Write durchgelaufen ist —
 * sonst klemmt z.B. der Chapter-Counter auf dem alten chapters-Wert fest.
 */
export function getEffectiveChapterCount(
  manga: {
    chapters?: number | null;
    latestChapterAvailable?: number | null;
  },
  ...extraSources: (number | null | undefined)[]
): number | null {
  const max = Math.max(
    manga.chapters || 0,
    manga.latestChapterAvailable || 0,
    ...extraSources.map((v) => v || 0)
  );
  return max > 0 ? max : null;
}
