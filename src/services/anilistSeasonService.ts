/**
 * Feature „Anime-Season-Kalender" — anilistSeasonService
 *
 * Liest die laufende Anime-Season von AniList (GraphQL, wie anilistService.ts
 * für Manga). Rate-Limit-freundlich: eine Seite = 50 Einträge, weitere Seiten
 * nur über explizites „Mehr laden"; Ergebnisse werden 30 Minuten im Speicher
 * und in sessionStorage gecacht, damit Season-Wechsel hin und her keine neuen
 * Requests auslösen.
 */

import { t } from './i18n';

const ANILIST_API = 'https://graphql.anilist.co';

export type AniListSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

/** Reihenfolge entspricht den Quartalen: Jan–Mär, Apr–Jun, Jul–Sep, Okt–Dez. */
const SEASON_ORDER: AniListSeason[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

export const SEASON_LABELS_DE: Record<AniListSeason, string> = {
  WINTER: 'Winter',
  SPRING: 'Frühling',
  SUMMER: 'Sommer',
  FALL: 'Herbst',
};

export interface SeasonRef {
  season: AniListSeason;
  year: number;
}

export interface SeasonAnime {
  id: number;
  idMal: number | null;
  title: {
    romaji: string | null;
    english: string | null;
  };
  coverImage: {
    large: string | null;
    color: string | null;
  } | null;
  /** Breites Banner (Hero-Backdrop) — nicht jeder Eintrag hat eins. */
  bannerImage: string | null;
  episodes: number | null;
  format: string | null;
  genres: string[] | null;
  averageScore: number | null;
  popularity: number | null;
  siteUrl: string;
  status: string | null;
  /** Kurzbeschreibung (englisch, HTML-ish) — vor Anzeige Tags strippen. */
  description: string | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  studios: {
    nodes: { name: string }[];
  } | null;
  nextAiringEpisode: {
    airingAt: number;
    episode: number;
    timeUntilAiring: number;
  } | null;
  /** Relationen (PREQUEL ⇒ Fortsetzung) — für den „Staffel 2 / NEU"-Chip. */
  relations: {
    edges: { relationType: string | null }[];
  } | null;
  externalLinks: AnimeExternalLink[] | null;
}

/** Eintrag der „Fortlaufend"-Sektion: Anime + die Season, in der er gestartet ist. */
export interface ContinuingAnime {
  anime: SeasonAnime;
  origin: SeasonRef;
}

export interface AnimeExternalLink {
  site: string;
  url: string;
  /** AniList MediaExternalLinkType: INFO | STREAMING | SOCIAL (null bei alten Einträgen). */
  type: string | null;
  /** Sprache des Links (z. B. "German", "English"), null = sprachneutral. */
  language: string | null;
}

export interface SeasonAnimePage {
  media: SeasonAnime[];
  hasNextPage: boolean;
}

/** Aktuelle Season aus dem Monat ableiten (0-basiert: 0–2 Winter, 3–5 Frühling, …). */
export function getCurrentSeason(now: Date = new Date()): SeasonRef {
  const season = SEASON_ORDER[Math.floor(now.getMonth() / 3)];
  return { season, year: now.getFullYear() };
}

/** Season um `delta` Schritte verschieben (±1 reicht für die Navigation, ist aber generisch). */
export function shiftSeason(ref: SeasonRef, delta: number): SeasonRef {
  const idx = SEASON_ORDER.indexOf(ref.season) + delta;
  return {
    season: SEASON_ORDER[((idx % 4) + 4) % 4],
    year: ref.year + Math.floor(idx / 4),
  };
}

/** Stabiler Schlüssel für Tabs/Caches, z. B. "SUMMER-2026". */
export function seasonKey(ref: SeasonRef): string {
  return `${ref.season}-${ref.year}`;
}

/** Sprachabhängiges Label, z. B. "Sommer 2026" / "Summer 2026". */
export function seasonLabel(ref: SeasonRef): string {
  return `${t(SEASON_LABELS_DE[ref.season])} ${ref.year}`;
}

/** Gemeinsame Media-Felder beider Queries (Season-Liste + „Fortlaufend"). */
const MEDIA_FIELDS = `
      id
      idMal
      title { romaji english }
      coverImage { large color }
      bannerImage
      episodes
      format
      genres
      averageScore
      popularity
      siteUrl
      status
      description(asHtml: false)
      startDate { year month day }
      studios(isMain: true) { nodes { name } }
      nextAiringEpisode { airingAt episode timeUntilAiring }
      relations { edges { relationType } }
      externalLinks { site url type language }`;

const SEASON_QUERY = `
query ($season: MediaSeason!, $year: Int!, $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
${MEDIA_FIELDS}
    }
  }
}
`;

/** Noch laufende Anime einer (früheren) Season — für die „Fortlaufend"-Sektion. */
const CONTINUING_QUERY = `
query ($season: MediaSeason!, $year: Int!, $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC, isAdult: false, status_in: [RELEASING]) {
${MEDIA_FIELDS}
    }
  }
}
`;

// ── Cache (In-Memory + sessionStorage, 30 min TTL) ───────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000;
// v6: relations ergänzt (v5: bannerImage) — ältere Einträge laufen ins Leere.
const CACHE_PREFIX = 'anilistSeason:v6:';

interface CacheRecord {
  fetchedAt: number;
  page: SeasonAnimePage;
}

const memoryCache = new Map<string, CacheRecord>();

function cacheKey(ref: SeasonRef, page: number): string {
  return `${CACHE_PREFIX}${seasonKey(ref)}:${page}`;
}

function readCache(key: string): SeasonAnimePage | null {
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.fetchedAt < CACHE_TTL_MS) return mem.page;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheRecord;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    memoryCache.set(key, parsed);
    return parsed.page;
  } catch {
    return null;
  }
}

function writeCache(key: string, page: SeasonAnimePage): void {
  const record: CacheRecord = { fetchedAt: Date.now(), page };
  memoryCache.set(key, record);
  try {
    sessionStorage.setItem(key, JSON.stringify(record));
  } catch {
    /* quota – In-Memory-Cache reicht */
  }
}

// ── Fetch ────────────────────────────────────────────────────────────────────

async function runSeasonQuery(
  query: string,
  ref: SeasonRef,
  page: number,
  key: string
): Promise<SeasonAnimePage> {
  const cached = readCache(key);
  if (cached) return cached;

  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { season: ref.season, year: ref.year, page },
    }),
  });

  if (response.status === 429) {
    throw new Error('AniList-Rate-Limit erreicht – bitte kurz warten und erneut versuchen.');
  }
  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json = (await response.json()) as {
    data?: {
      Page?: {
        pageInfo?: { hasNextPage?: boolean };
        media?: SeasonAnime[];
      };
    };
    errors?: { message?: string }[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || 'AniList API error');
  }

  const result: SeasonAnimePage = {
    media: json.data?.Page?.media ?? [],
    hasNextPage: json.data?.Page?.pageInfo?.hasNextPage ?? false,
  };
  writeCache(key, result);
  return result;
}

/**
 * Eine Seite (50 Einträge) der gewählten Season laden. Cache-first; bei
 * AniList-Rate-Limit (429) kommt eine verständliche deutsche Fehlermeldung.
 */
export async function fetchSeasonAnime(ref: SeasonRef, page = 1): Promise<SeasonAnimePage> {
  return runSeasonQuery(SEASON_QUERY, ref, page, cacheKey(ref, page));
}

/**
 * „Fortlaufend": noch laufende Anime (status RELEASING) aus den letzten zwei
 * Seasons vor `ref`. Kosten: genau 2 zusätzliche AniList-Requests pro
 * Season-Auswahl (je 1 Seite), danach 30 min gecacht. Sortiert nach
 * Popularität; Deduplizierung gegen die Season-Liste übernimmt der Aufrufer.
 */
export async function fetchContinuingAnime(ref: SeasonRef): Promise<ContinuingAnime[]> {
  const origins = [shiftSeason(ref, -1), shiftSeason(ref, -2)];
  const pages = await Promise.all(
    origins.map((origin) =>
      runSeasonQuery(CONTINUING_QUERY, origin, 1, `${CACHE_PREFIX}cont:${seasonKey(origin)}`)
    )
  );

  const seen = new Set<number>();
  const merged: ContinuingAnime[] = [];
  pages.forEach((page, index) => {
    for (const anime of page.media) {
      if (seen.has(anime.id)) continue;
      seen.add(anime.id);
      merged.push({ anime, origin: origins[index] });
    }
  });
  merged.sort((a, b) => (b.anime.popularity ?? 0) - (a.anime.popularity ?? 0));
  return merged;
}
