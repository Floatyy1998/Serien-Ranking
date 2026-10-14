import {
  anchoredVolumeGuess,
  matchSeries,
  mangaVolumeGuess,
  pickSeriesMatch,
  seriesHead,
  type MangaVolumeGuess,
  type MangaVolumeInput,
  type SeriesMatch,
} from '../../lib/books/mangaVolume';
import { normalizeTitle } from '../../lib/text/searchRelevance';
import type { BookSearchResult } from '../../types/Book';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { searchMangaByTitles } from '../api/anilistService';
import { findViaMangaUpdates, type MangaSearchOutcome } from '../api/mangaAliasSearch';
import { searchBooks } from '../api/booksApi';
import { cacheGet, cacheSet } from './bookCache';

export interface MangaVolumeHit {
  manga: AniListMangaSearchResult;
  volume?: number;
}

const DAY = 86_400_000;
const HIT_TTL = 14 * DAY;
const MISS_TTL = DAY;
const MAX_BATCH = 8;
const NS = 'mangavol';

interface Stored {
  at: number;
  manga: AniListMangaSearchResult | null;
  ambiguous?: boolean;
}

const readStored = (key: string): SeriesMatch | null | undefined => {
  const stored = cacheGet<Stored>(NS, key, HIT_TTL);
  if (!stored || (!stored.manga && Date.now() - stored.at > MISS_TTL)) return undefined;
  return stored.manga ? { manga: stored.manga, ambiguous: !!stored.ambiguous } : null;
};

const store = (key: string, match: SeriesMatch | null) =>
  cacheSet<Stored>(
    NS,
    key,
    { at: Date.now(), manga: match?.manga ?? null, ambiguous: match?.ambiguous || undefined },
    60
  );

const inflight = new Map<string, Promise<SeriesMatch | null>>();

/** Reihentitel → AniList-Manga, gebündelt in einer Anfrage und gemerkt (Treffer 14 Tage, Fehlanzeigen 1 Tag). */
async function resolveSeries(titles: string[]): Promise<Map<string, SeriesMatch | null>> {
  const out = new Map<string, SeriesMatch | null>();
  const waiting: [string, Promise<SeriesMatch | null>][] = [];
  const missing: string[] = [];
  for (const title of titles) {
    const key = normalizeTitle(title);
    if (!key || out.has(key) || missing.some((m) => normalizeTitle(m) === key)) continue;
    const stored = readStored(key);
    const running = inflight.get(key);
    if (stored !== undefined) out.set(key, stored);
    else if (running) waiting.push([key, running]);
    else if (missing.length < MAX_BATCH) missing.push(title);
  }
  if (missing.length > 0) {
    const batch = searchMangaByTitles(missing);
    missing.forEach((title, i) => {
      const key = normalizeTitle(title);
      const pending = batch.then((lists) => {
        const match = matchSeries(lists[i] ?? [], title);
        store(key, match);
        return match;
      });
      inflight.set(key, pending);
      void pending.catch(() => null).finally(() => inflight.delete(key));
      waiting.push([key, pending]);
    });
  }
  for (const [key, pending] of waiting) out.set(key, await pending);
  return out;
}

/** Deutsche Reihentitel, die AniList nicht kennt, über die MangaUpdates-Alternativtitel. */
async function resolveViaAlias(series: string): Promise<AniListMangaSearchResult | null> {
  const key = `mu:${normalizeTitle(series)}`;
  const stored = readStored(key);
  if (stored !== undefined) return stored?.manga ?? null;
  const wanted = normalizeTitle(series);
  const { results, aliases } = await findViaMangaUpdates(series);
  const manga =
    pickSeriesMatch(results, series) ??
    results.find((r) => normalizeTitle(aliases[r.id] ?? '') === wanted) ??
    null;
  store(key, manga ? { manga, ambiguous: false } : null);
  return manga;
}

interface Candidate {
  item: MangaVolumeInput;
  guess: MangaVolumeGuess;
  /** Ohne Comic-Merkmal, nur über den Suchbegriff erkannt — bei gleichnamigem Roman kein Treffer. */
  anchored: boolean;
}

/**
 * Erkennt Manga-Bände unter Buchtreffern und ordnet sie der Reihe auf AniList zu.
 * query: Suchbegriff — nummerierte Bände genau dieser Reihe zählen auch ohne Comic-Merkmal.
 * deep: Reihen ohne direkten Treffer auch über MangaUpdates (eine Reihe, z. B. ISBN-Suche).
 * loose: alles ohne Comic-Merkmal prüfen (Manga-Suche nach ISBN).
 */
export async function resolveMangaVolumes(
  items: MangaVolumeInput[],
  options: { deep?: boolean; loose?: boolean; query?: string } = {}
): Promise<Record<string, MangaVolumeHit>> {
  const candidates: Candidate[] = [];
  for (const item of items) {
    const guess = mangaVolumeGuess(item, { loose: options.loose });
    const anchored = guess ? null : anchoredVolumeGuess(item, options.query);
    if (guess) candidates.push({ item, guess, anchored: false });
    else if (anchored) candidates.push({ item, guess: anchored, anchored: true });
  }
  if (candidates.length === 0) return {};

  const hits: Record<string, MangaVolumeHit> = {};
  const series = await resolveSeries(candidates.map((c) => c.guess.series));
  let open = candidates.filter(({ item, guess, anchored }) => {
    const match = series.get(normalizeTitle(guess.series));
    const usable = !!match && !(anchored && match.ambiguous);
    if (match && usable) hits[item.id] = { manga: match.manga, volume: guess.volume };
    return !usable && !anchored;
  });

  const fullTitles = open.flatMap((c) => (c.guess.full ? [c.guess.full] : [])).slice(0, 4);
  if (fullTitles.length > 0) {
    const full = await resolveSeries(fullTitles);
    open = open.filter(({ item, guess }) => {
      const match = guess.full ? full.get(normalizeTitle(guess.full)) : null;
      if (match) hits[item.id] = { manga: match.manga };
      return !match;
    });
  }

  if (options.deep && open.length > 0) {
    const first = seriesHead(open[0].guess.series);
    const manga = await resolveViaAlias(first).catch(() => null);
    if (manga) {
      for (const { item, guess } of open) {
        if (normalizeTitle(seriesHead(guess.series)) === normalizeTitle(first)) {
          hits[item.id] = { manga, volume: guess.volume };
        }
      }
    }
  }
  return hits;
}

/** Manga-Suche nach ISBN: Band über die Buchquellen finden, dann seine Reihe zeigen. */
export async function findMangaByIsbn(isbn: string): Promise<MangaSearchOutcome> {
  const books: BookSearchResult[] = await searchBooks(isbn).catch(() => []);
  const hits = await resolveMangaVolumes(books.slice(0, 1), { deep: true, loose: true });
  const book = books[0];
  const hit = book ? hits[book.id] : undefined;
  if (!book || !hit) return { results: [], aliases: {} };
  return {
    results: [hit.manga],
    aliases: { [hit.manga.id]: book.title },
    volumes: { [hit.manga.id]: hit.volume ?? 0 },
  };
}
