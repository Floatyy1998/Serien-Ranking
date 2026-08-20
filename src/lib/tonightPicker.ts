import { calculateOverallRating } from './rating/rating';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from './episode/seriesMetrics';
import { hasEpisodeAired } from '../utils/episodeDate';
import type { Movie } from '../types/Movie';
import type { Series } from '../types/Series';

export type TonightMood =
  'leicht' | 'lustig' | 'spannend' | 'emotional' | 'romantisch' | 'duester' | 'gruselig' | 'egal';
export type TonightTime = 30 | 60 | 120 | 0;
export type TonightType = 'egal' | 'series' | 'movie';
export type TonightSource = 'egal' | 'library' | 'discover';

/**
 * Mood → Genre-Fragmente. Die Genre-Labels der App sind gemischt (deutsch,
 * englisch, kombinierte TMDB-Vokabulare), deshalb tolerante Teilstring-Suche
 * auf dem kleingeschriebenen Label statt exakter Treffer.
 */
const MOOD_FRAGMENTS: Record<Exclude<TonightMood, 'egal'>, string[]> = {
  leicht: ['comedy', 'komödie', 'familie', 'family', 'animation', 'reality', 'soap', 'kids'],
  lustig: ['comedy', 'komödie', 'sitcom'],
  spannend: [
    'thriller',
    'krimi',
    'crime',
    'action',
    'mystery',
    'abenteuer',
    'adventure',
    'krieg',
    'war',
  ],
  emotional: ['drama', 'romantik', 'romance', 'musik', 'music', 'historie', 'history'],
  romantisch: ['romantik', 'romance'],
  duester: ['mystery', 'thriller', 'sci-fi', 'fantasy', 'krieg', 'war', 'western'],
  gruselig: ['horror', 'mystery'],
};

/** Mood → TMDB-Genre-IDs für die "Neues entdecken"-Quelle (TV/Film getrennt). */
export const MOOD_TMDB_GENRES: Record<
  Exclude<TonightMood, 'egal'>,
  { tv: string; movie: string }
> = {
  leicht: { tv: '35|10751|16', movie: '35|10751|16' },
  lustig: { tv: '35', movie: '35' },
  spannend: { tv: '80|9648|10759', movie: '53|80|28|12' },
  emotional: { tv: '18', movie: '18|10749' },
  romantisch: { tv: '18|35', movie: '10749' },
  duester: { tv: '9648|10765|80', movie: '53|9648|878' },
  gruselig: { tv: '9648|10765', movie: '27' },
};

export const DISCOVER_SERIES_RUNTIME = 45;
export const DISCOVER_MOVIE_RUNTIME = 115;

export interface TonightCandidate {
  kind: 'series-next' | 'movie' | 'new-series' | 'new-movie';
  id: number;
  title: string;
  poster: string;
  genres: string[];
  /** Minuten pro Folge bzw. Filmlänge. */
  runtime: number;
  watchlist: boolean;
  /** Nur series-next: */
  seasonNumber?: number;
  episodeNumber?: number;
  episodeName?: string;
  watchedEpisodes?: number;
  /** Nur new-*: TMDB-Community-Wertung. */
  tmdbRating?: number;
  /** Nur new-*: läuft auf einem aktiven Abo des Nutzers. */
  onMySubs?: boolean;
}

export type TonightReason =
  | { kind: 'continue'; episodes: number; runtime: number }
  | { kind: 'fresh-start' }
  | { kind: 'movie-fits'; runtime: number }
  | { kind: 'watchlist' }
  | { kind: 'mood'; mood: TonightMood }
  | { kind: 'discover'; rating?: number; onSubs?: boolean };

export interface TonightPick {
  candidate: TonightCandidate;
  reasons: TonightReason[];
  /** Wie viele Folgen ins Zeitfenster passen (nur Serien). */
  episodesInBudget: number;
}

const isSeriesKind = (c: TonightCandidate): boolean =>
  c.kind === 'series-next' || c.kind === 'new-series';

const isNewKind = (c: TonightCandidate): boolean =>
  c.kind === 'new-series' || c.kind === 'new-movie';

const movieIsWatched = (m: Movie): boolean =>
  m.watched === true || parseFloat(calculateOverallRating(m) || '0') > 0;

const seriesGenres = (s: Series): string[] =>
  s.genre?.genres || (s.genres || []).map((g) => g.name);

const movieGenres = (m: Movie): string[] => m.genre?.genres || (m.genres || []).map((g) => g.name);

export const matchesMood = (genres: string[], mood: TonightMood): boolean => {
  if (mood === 'egal') return true;
  const fragments = MOOD_FRAGMENTS[mood];
  return genres.some((g) => {
    const low = (g || '').toLowerCase();
    return fragments.some((f) => low.includes(f));
  });
};

/** Baut den Kandidaten-Pool aus der eigenen Bibliothek. */
export function buildTonightCandidates(
  seriesList: Series[] | undefined,
  movieList: Movie[] | undefined,
  blocked: ReadonlySet<number>
): TonightCandidate[] {
  const out: TonightCandidate[] = [];

  for (const s of seriesList || []) {
    if (!s || s.hidden || blocked.has(s.id)) continue;
    let watchedCount = 0;
    let next: {
      seasonNumber: number;
      episodeNumber: number;
      name?: string;
      runtime: number;
    } | null = null;
    for (const season of s.seasons || []) {
      for (let k = 0; k < (season.episodes || []).length; k++) {
        const ep = season.episodes[k];
        if (!ep) continue;
        if (ep.watched) {
          watchedCount += 1;
        } else if (!next && hasEpisodeAired(ep)) {
          next = {
            seasonNumber: (season.seasonNumber ?? 0) + 1,
            episodeNumber: ep.episode_number || k + 1,
            name: ep.name,
            runtime: ep.runtime || s.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
          };
        }
      }
    }
    if (!next) continue;
    out.push({
      kind: 'series-next',
      id: s.id,
      title: s.title || s.name || '',
      poster: s.poster?.poster || '',
      genres: seriesGenres(s),
      runtime: next.runtime,
      watchlist: !!s.watchlist,
      seasonNumber: next.seasonNumber,
      episodeNumber: next.episodeNumber,
      episodeName: next.name,
      watchedEpisodes: watchedCount,
    });
  }

  for (const m of movieList || []) {
    if (!m || blocked.has(m.id) || movieIsWatched(m)) continue;
    out.push({
      kind: 'movie',
      id: m.id,
      title: m.title || '',
      poster: m.poster?.poster || '',
      genres: movieGenres(m),
      runtime: m.runtime || 110,
      watchlist: !!m.watchlist,
    });
  }

  return out;
}

/** Roh-Item aus TMDB discover → Kandidat für "Neues entdecken". */
export function discoverToCandidate(
  item: { id?: number; name?: string; title?: string; poster_path?: string; vote_average?: number },
  mediaType: 'series' | 'movie'
): TonightCandidate | null {
  if (!item?.id) return null;
  return {
    kind: mediaType === 'series' ? 'new-series' : 'new-movie',
    id: item.id,
    title: item.name || item.title || '',
    poster: item.poster_path || '',
    genres: [],
    runtime: mediaType === 'series' ? DISCOVER_SERIES_RUNTIME : DISCOVER_MOVIE_RUNTIME,
    watchlist: false,
    tmdbRating: item.vote_average,
  };
}

const budgetMinutes = (time: TonightTime): number =>
  time === 0 ? Number.POSITIVE_INFINITY : time * 1.15;

/** Deterministischer Tie-Breaker, damit „Anderer Vorschlag" pro Abend stabil rotiert. */
const hash = (n: number, seed: number): number => {
  let h = (n * 2654435761 + seed * 40503) >>> 0;
  h ^= h >> 13;
  return (h * 2246822519) >>> 0;
};

export interface TonightOptions {
  time: TonightTime;
  mood: TonightMood;
  type: TonightType;
  source: TonightSource;
  /** z. B. Tages-Seed, damit die Reihenfolge pro Abend stabil ist. */
  seed: number;
}

/**
 * Sortiert die Kandidaten für „Was schaue ich heute Abend?": Zeitbudget und
 * Typ/Quelle hart, Stimmung weich (leert die Stimmung den Pool, fällt sie
 * weg). Angefangene Serien vor Neustarts, Watchlist bevorzugt; Entdeckungen
 * mischen sich dazwischen, statt hinten zu verhungern.
 */
export function pickTonight(
  candidates: TonightCandidate[],
  { time, mood, type, source, seed }: TonightOptions
): TonightPick[] {
  const budget = budgetMinutes(time);
  let pool = candidates.filter((c) => c.runtime <= budget);
  if (type !== 'egal') pool = pool.filter((c) => (type === 'series') === isSeriesKind(c));
  if (source !== 'egal') pool = pool.filter((c) => (source === 'discover') === isNewKind(c));

  // Discover-Items tragen keine Genre-Labels — sie sind schon per TMDB-Genre
  // zur Stimmung gefiltert und gelten daher als Mood-Treffer.
  const moodPool = pool.filter((c) => isNewKind(c) || matchesMood(c.genres, mood));
  const moodApplied = mood !== 'egal' && moodPool.length > 0;
  if (moodApplied) pool = moodPool;

  const scored = pool.map((c) => {
    let score = 0;
    if (c.kind === 'series-next' && (c.watchedEpisodes || 0) > 0) score += 3;
    if (c.watchlist) score += 2;
    if (isNewKind(c)) score += 2;
    if (moodApplied && !isNewKind(c) && matchesMood(c.genres, mood)) score += 2;
    return { c, score, tie: hash(c.id, seed) };
  });

  scored.sort((a, b) => b.score - a.score || a.tie - b.tie);

  return scored.map(({ c }) => {
    const episodesInBudget = isSeriesKind(c)
      ? Math.max(1, Math.min(6, Math.floor(budget / Math.max(1, c.runtime))))
      : 0;
    const reasons: TonightReason[] = [];
    if (isNewKind(c)) {
      reasons.push({ kind: 'discover', rating: c.tmdbRating, onSubs: c.onMySubs });
    } else if (c.kind === 'series-next') {
      if ((c.watchedEpisodes || 0) > 0)
        // episodes 0 = kein Zeitfenster gesetzt — Begründung ohne Fenster-Claim
        reasons.push({
          kind: 'continue',
          episodes: Number.isFinite(budget) ? episodesInBudget : 0,
          runtime: c.runtime,
        });
      else reasons.push({ kind: 'fresh-start' });
    } else {
      reasons.push({ kind: 'movie-fits', runtime: c.runtime });
      if (c.watchlist) reasons.push({ kind: 'watchlist' });
    }
    if (moodApplied) reasons.push({ kind: 'mood', mood });
    return { candidate: c, reasons, episodesInBudget };
  });
}
