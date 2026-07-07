/**
 * Feature „Anime-Season-Kalender" — AniList-Eintrag → TMDB auflösen
 * (Id + deutsche Beschreibung + DE-Streaming-Provider) + TVMaze-Datums-Check.
 *
 * Schritte pro Eintrag (progressiv nach dem Season-Fetch, throttled;
 * bzw. beim Klick, falls noch nicht aufgelöst):
 *   1. TMDB-Suche (Muster wie pages/Search/useSearchPage.ts, VITE_API_TMDB):
 *      Titel (english || romaji) mit first_air_date_year der Season, dann
 *      ohne Jahr, dann der Alternativtitel, zuletzt die BASISTITEL ohne
 *      Season-/Part-Suffix („Saga of Tanya the Evil Season 2" → „Saga of
 *      Tanya the Evil" — Sequel-Seasons sind bei TMDB EINE Serie) — bestes
 *      TV-Ergebnis bevorzugt Animation (Genre 16).
 *   2. EIN Details-Call `tv/{id}?language=de-DE&append_to_response=
 *      watch/providers` → deutsches overview + DE-Flatrate-Provider mit
 *      logo_path (dieselben TMDB-Logos wie überall in der App).
 *   3. TVMaze-Datums-Check (parallel, nur nahe/zukünftige Premieren):
 *      singlesearch mit Basistitel + embed=episodes — die Episode im
 *      ±3-Tage-Fenster um das AniList-Datum (Ep 1 bevorzugt, Namens-Check
 *      gegen english UND romaji, Midnight-Quirk-Korrektur) liefert den
 *      Termin, den auch der Serien-Kalender der App zeigt. AniList führt
 *      den japanischen TV-Termin, der oft ±1–2 Tage vom (TVMaze-)Release
 *      abweicht. Requests laufen seriell mit 350 ms Abstand (Rate-Limit
 *      ~20/10 s), Fehler → null (Datum bleibt AniList).
 *
 * Ergebnis (auch Negativ-Treffer) wird pro AniList-Id in sessionStorage
 * gecacht — wiederholte Besuche/Klicks lösen keine neuen Requests aus.
 */

import { genreIdMap, genreIdMapForSeries } from '../../config/menuItems';
import { tmdbFetch } from '../../services/tmdbClient';
import { tmdbLogoUrl } from '../../hooks/useProviderLogos';
import { anilistLinkCountsForDe } from '../../services/anilistProviderFallback';
import { getProviderLogoUrl } from '../../lib/providerMerge';
import { normalizeProviderName } from '../../services/detection/providerChangeDetection';
import { getEpisodeAirDate } from '../../utils/episodeDate';
import { franchiseTitle, stripSeasonSuffix } from './animeFormat';
import { normalizeTitle } from './useAnimeListMatch';
import type { SeasonAnime } from '../../services/anilistSeasonService';

// v11: App-relevante TMDB-Genres ergänzt (v10: Provider-Fallback) — Bump
// lässt gecachte Einträge die Genres nachladen.
const CACHE_KEY = 'animeSeasonTmdb:v11';
const TMDB_ANIMATION_GENRE_ID = 16;

export interface TmdbProviderInfo {
  name: string;
  /** Volle Logo-URL (image.tmdb.org, w92). */
  logo: string;
}

export interface ResolvedTmdbInfo {
  /** null = kein TMDB-Treffer. */
  tmdbId: number | null;
  /** Ziel-Detailseite: 'movie' bei AniList-Format MOVIE, sonst 'tv'.
   *  Fehlend (alte Cache-Einträge) = 'tv'. */
  mediaType?: 'tv' | 'movie';
  /** Deutsches TMDB-overview — null wenn leer oder kein Treffer. */
  overviewDe: string | null;
  /** DE-Flatrate-Provider — null wenn kein Treffer, [] wenn keine bekannt. */
  providers: TmdbProviderInfo[] | null;
  /** TVMaze-geprüfter Premierentermin („YYYY-MM-DD", lokal) — null/fehlend =
   *  kein valider Treffer, AniList-Datum bleibt. */
  premiereDate?: string | null;
  /** TMDB-Community-Rating (vote_average, 0–10) — null/0 = keins. */
  tmdbRating?: number | null;
  /** TMDB-Genres, gemappt auf das App-Vokabular (genreIdMap*) — ohne
   *  „Animation" (tragen alle Anime, reine Redundanz). */
  genres?: string[];
}

type ResolveCache = Record<string, ResolvedTmdbInfo>;

function readCache(): ResolveCache {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ResolveCache) : {};
  } catch {
    return {};
  }
}

function writeCache(anilistId: number, info: ResolvedTmdbInfo): void {
  try {
    const cache = readCache();
    cache[String(anilistId)] = info;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota – ignorieren */
  }
}

/** Synchroner Cache-Read — die Page hydratisiert damit ohne Request. */
export function readResolvedTmdbInfoSync(anilistId: number): ResolvedTmdbInfo | undefined {
  return readCache()[String(anilistId)];
}

/** Kompletter Sync-Cache-Read (EIN JSON.parse) — die Page lädt damit beim
 *  Mount alle bereits aufgelösten Einträge, ohne EN→DE-Beschreibungs-Flash. */
export function readResolveCacheSync(): Record<string, ResolvedTmdbInfo> {
  return readCache();
}

interface TmdbTvResult {
  id: number;
  genre_ids?: number[];
  name?: string;
  original_name?: string;
  /** Movie-Suche liefert title statt name. */
  title?: string;
  original_title?: string;
  popularity?: number;
}

async function searchTv(query: string, year?: number): Promise<TmdbTvResult[]> {
  try {
    const json = await tmdbFetch<{ results?: TmdbTvResult[] }>('search/tv', {
      query,
      first_air_date_year: year,
    });
    return json.results ?? [];
  } catch {
    // Fehlender Key / HTTP-Fehler → wie zuvor: kein Treffer.
    return [];
  }
}

/** Anime-FILME laufen über die Movie-Suche — die TV-Suche findet sie nicht
 *  (bzw. fehl-matcht auf gleichnamige Serien). */
async function searchMovie(query: string, year?: number): Promise<TmdbTvResult[]> {
  try {
    const json = await tmdbFetch<{ results?: TmdbTvResult[] }>('search/movie', {
      query,
      primary_release_year: year,
    });
    return json.results ?? [];
  } catch {
    return [];
  }
}

/** Bestes Ergebnis: Animation (Genre 16) bevorzugt; innerhalb des Pools
 *  gewinnt der exakte Titel-Match, sonst das POPULÄRSTE Ergebnis — das
 *  TMDB-Such-Ranking stellt sonst Spin-offs vor die Hauptserie („The Slime
 *  Diaries" vor „That Time I Got Reincarnated as a Slime"). */
function pickBest(results: TmdbTvResult[], query: string): number | null {
  if (!results.length) return null;
  const animated = results.filter((r) => r.genre_ids?.includes(TMDB_ANIMATION_GENRE_ID));
  const pool = animated.length ? animated : results;

  const normalizedQuery = normalizeTitle(query);
  const exact = pool.find((r) =>
    [r.name, r.original_name, r.title, r.original_title].some(
      (candidate) => normalizeTitle(candidate) === normalizedQuery
    )
  );
  if (exact) return exact.id;

  return pool.reduce((best, r) => ((r.popularity ?? 0) > (best.popularity ?? 0) ? r : best)).id;
}

interface TmdbDetailsResponse {
  overview?: string;
  vote_average?: number;
  genres?: { id: number; name?: string }[];
  'watch/providers'?: {
    results?: {
      DE?: {
        flatrate?: { provider_name?: string; logo_path?: string }[];
      };
    };
  };
}

/** EIN Details-Call: deutsches overview + DE-Flatrate-Provider (Logos).
 *  Provider laufen durch DIESELBE Normalisierung wie überall in der App
 *  (normalizeProviderName): „X Channel"-Add-Ons fliegen raus, Varianten
 *  mappen auf den Standard-Namen, nur SUPPORTED_PROVIDERS bleiben —
 *  dedupliziert nach normalisiertem Namen. */
async function fetchGermanDetails(
  tmdbId: number,
  mediaType: 'tv' | 'movie'
): Promise<{
  overviewDe: string | null;
  providers: TmdbProviderInfo[];
  rating: number | null;
  genres: string[];
}> {
  let json: TmdbDetailsResponse;
  try {
    json = await tmdbFetch<TmdbDetailsResponse>(`${mediaType}/${tmdbId}`, {
      append_to_response: 'watch/providers',
    });
  } catch {
    // Fehlender Key / HTTP-Fehler → wie zuvor: leere Details.
    return { overviewDe: null, providers: [], rating: null, genres: [] };
  }

  const overviewDe = json.overview?.trim() || null;
  const rating =
    typeof json.vote_average === 'number' && json.vote_average > 0 ? json.vote_average : null;

  // Genre-IDs auf das App-Vokabular mappen (nur relevante bleiben) —
  // „Animation" raus, das tragen alle Anime.
  const idMap = mediaType === 'movie' ? genreIdMap : genreIdMapForSeries;
  const genres = (json.genres ?? [])
    .map((genre) => idMap.find((entry) => entry.id === genre.id)?.name)
    .filter((name): name is string => !!name && name !== 'Animation');
  const flatrate = json['watch/providers']?.results?.DE?.flatrate ?? [];
  const providers: TmdbProviderInfo[] = [];
  const seen = new Set<string>();
  for (const entry of flatrate) {
    if (!entry.provider_name) continue;
    const normalized = normalizeProviderName(entry.provider_name);
    if (!normalized || seen.has(normalized)) continue;
    const logo = tmdbLogoUrl(entry.logo_path, 'w92') || getProviderLogoUrl(normalized);
    if (!logo) continue;
    seen.add(normalized);
    providers.push({ name: normalized, logo });
  }
  return { overviewDe, providers, rating, genres };
}

/**
 * Provider-Fallback aus AniList-Streaming-Links (type STREAMING): TMDBs
 * JustWatch-Daten hinken bei neuen Simulcasts oft 1–2 Wochen hinterher,
 * AniList führt den Crunchyroll-Link dagegen ab Ankündigung. Es zählen nur
 * App-unterstützte Provider (normalizeProviderName filtert), Logos kommen
 * aus der lokalen Provider-Map — die Karten zeigen also echte Logos.
 */
function anilistFallbackProviders(anime: SeasonAnime): TmdbProviderInfo[] {
  const seen = new Set<string>();
  const result: TmdbProviderInfo[] = [];
  for (const link of anime.externalLinks ?? []) {
    if (link?.type !== 'STREAMING') continue;
    const normalized = normalizeProviderName(link.site);
    if (!normalized || seen.has(normalized)) continue;
    // Region-lose AniList-Links: nur Crunchyroll sprachneutral vertrauen,
    // Mainstream-SVOD nur mit explizitem German — sonst Falschtreffer in DE.
    if (!anilistLinkCountsForDe(normalized, link.language)) continue;
    const logo = getProviderLogoUrl(normalized);
    if (!logo) continue;
    seen.add(normalized);
    result.push({ name: normalized, logo });
  }
  return result;
}

// ── TVMaze-Datums-Check ──────────────────────────────────────────────────────

/** Episode gilt als „dieselbe Premiere", wenn sie ±3 Tage ums AniList-Datum liegt. */
const TVMAZE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
/** Nur nahe/zukünftige Premieren prüfen — bei älteren ist die Abweichung egal. */
const TVMAZE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** TVMaze-Requests seriell mit Abstand (Rate-Limit ~20/10 s, kein API-Key). */
let tvmazeChain: Promise<unknown> = Promise.resolve();
function throttledTvmazeFetch(url: string): Promise<Response> {
  const request = tvmazeChain.then(async () => {
    const response = await fetch(url);
    await new Promise((resolve) => setTimeout(resolve, 350));
    return response;
  });
  tvmazeChain = request.catch(() => undefined);
  return request;
}

interface TvmazeShow {
  name?: string;
  _embedded?: {
    episodes?: { number?: number | null; airdate?: string; airstamp?: string }[];
  };
}

/** Fuzzy-Search-Absicherung: TVMaze-Name muss zu english ODER romaji passen
 *  (TVMaze führt Anime oft unterm Romaji-Titel). */
function titlesRoughlyMatch(showName: string | undefined, candidates: string[]): boolean {
  const name = normalizeTitle(showName);
  if (!name) return false;
  return candidates.some((candidate) => {
    const normalized = normalizeTitle(candidate);
    return (
      !!normalized &&
      (name === normalized || name.startsWith(normalized) || normalized.startsWith(name))
    );
  });
}

/**
 * TVMaze-Termin der Premiere: die Episode im ±3-Tage-Fenster ums
 * AniList-Datum (Ep 1 bevorzugt), Datum via getEpisodeAirDate — also mit
 * DERSELBEN Midnight-Quirk-Korrektur wie der Serien-Kalender der App.
 */
async function fetchTvmazePremiereDate(anime: SeasonAnime): Promise<string | null> {
  // TVMaze führt nur TV — Filme behalten das AniList-Datum.
  if (anime.format === 'MOVIE') return null;
  const sd = anime.startDate;
  if (!sd?.year || !sd.month || !sd.day) return null;
  const anilistDate = new Date(sd.year, sd.month - 1, sd.day);
  if (anilistDate.getTime() < Date.now() - TVMAZE_MAX_AGE_MS) return null;

  const english = anime.title.english ? stripSeasonSuffix(anime.title.english) : '';
  const romaji = anime.title.romaji ? stripSeasonSuffix(anime.title.romaji) : '';
  const query = english || romaji;
  if (!query) return null;

  try {
    const response = await throttledTvmazeFetch(
      `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(query)}&embed=episodes`
    );
    if (!response.ok) return null;
    const show = (await response.json()) as TvmazeShow;
    if (!titlesRoughlyMatch(show.name, [english, romaji].filter(Boolean))) return null;

    let best: Date | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const episode of show._embedded?.episodes ?? []) {
      const date = getEpisodeAirDate({ airstamp: episode.airstamp, air_date: episode.airdate });
      if (!date) continue;
      const diff = Math.abs(date.getTime() - anilistDate.getTime());
      if (diff > TVMAZE_WINDOW_MS) continue;
      // Staffel-Premieren (Ep 1) schlagen jede Nicht-Premiere im Fenster.
      const score = diff + (episode.number === 1 ? 0 : TVMAZE_WINDOW_MS);
      if (score < bestScore) {
        best = date;
        bestScore = score;
      }
    }
    if (!best) return null;
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${best.getFullYear()}-${pad(best.getMonth() + 1)}-${pad(best.getDate())}`;
  } catch {
    // Netzwerk/429 → kein Cache-Gift: premiereDate bleibt null, AniList-Datum trägt.
    return null;
  }
}

/**
 * Löst einen AniList-Eintrag komplett auf (max. 5 Such- + 1 Details-Request
 * + 1 TVMaze-Request, danach gecacht). `tmdbId: null` = kein Treffer.
 */
export async function resolveTmdbInfo(
  anime: SeasonAnime,
  seasonYear: number
): Promise<ResolvedTmdbInfo> {
  const cached = readResolvedTmdbInfoSync(anime.id);
  if (cached !== undefined) return cached;

  // TVMaze-Check läuft parallel zur TMDB-Auflösung (eigene Throttle-Queue).
  const premiereDatePromise = fetchTvmazePremiereDate(anime);

  const primary = anime.title.english || anime.title.romaji;
  const secondary =
    anime.title.english && anime.title.romaji && anime.title.english !== anime.title.romaji
      ? anime.title.romaji
      : null;
  // AniList-Format MOVIE → TMDB-Movie-Suche + /movie-Details + /movie/-Route.
  const mediaType: 'tv' | 'movie' = anime.format === 'MOVIE' ? 'movie' : 'tv';

  if (!primary) {
    const miss: ResolvedTmdbInfo = {
      tmdbId: null,
      mediaType,
      overviewDe: null,
      providers: null,
      premiereDate: null,
    };
    writeCache(anime.id, miss);
    return miss;
  }

  const attempts: { query: string; year?: number }[] = [
    { query: primary, year: seasonYear },
    { query: primary },
  ];
  if (secondary) attempts.push({ query: secondary });
  // Sequel-Seasons: Basistitel ohne Suffix (ohne Jahr — Staffel 1 der
  // TMDB-Serie startete in einem früheren Jahr), dedupliziert. Als letzte
  // Rettung der Franchise-Titel vor einem Arc-Untertitel („Tokyo Revengers:
  // Santen Sensou-hen" → „Tokyo Revengers").
  const seen = new Set(attempts.map((attempt) => attempt.query));
  for (const raw of [primary, secondary]) {
    if (!raw) continue;
    const stripped = stripSeasonSuffix(raw);
    if (stripped && !seen.has(stripped)) {
      seen.add(stripped);
      attempts.push({ query: stripped });
    }
  }
  for (const raw of [primary, secondary]) {
    if (!raw) continue;
    const franchise = franchiseTitle(raw);
    if (franchise && !seen.has(franchise)) {
      seen.add(franchise);
      attempts.push({ query: franchise });
    }
  }

  let tmdbId: number | null = null;
  for (const attempt of attempts) {
    const results =
      mediaType === 'movie'
        ? await searchMovie(attempt.query, attempt.year)
        : await searchTv(attempt.query, attempt.year);
    tmdbId = pickBest(results, attempt.query);
    if (tmdbId !== null) break;
  }

  const premiereDate = await premiereDatePromise;

  // JustWatch leer? → AniList-Streaming-Links als Provider-Fallback.
  const fallbackProviders = anilistFallbackProviders(anime);

  let info: ResolvedTmdbInfo;
  if (tmdbId === null) {
    info = {
      tmdbId: null,
      mediaType,
      overviewDe: null,
      providers: fallbackProviders.length ? fallbackProviders : null,
      premiereDate,
    };
  } else {
    const details = await fetchGermanDetails(tmdbId, mediaType);
    info = {
      tmdbId,
      mediaType,
      overviewDe: details.overviewDe,
      providers: details.providers.length ? details.providers : fallbackProviders,
      premiereDate,
      tmdbRating: details.rating,
      genres: details.genres,
    };
  }
  writeCache(anime.id, info);
  return info;
}
