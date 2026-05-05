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
