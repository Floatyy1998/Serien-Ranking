/**
 * Manga chapter data service.
 * Uses MangaUpdates API (https://api.mangaupdates.com) as primary source.
 * MangaUpdates has excellent coverage for Manga, Manhwa AND Webtoon-exclusive titles.
 * No API key needed. Requests go through backend proxy to avoid CORS.
 */

import {
  decodeMangaUpdatesText,
  type MangaUpdatesHit,
  type MangaUpdatesSeries,
} from '../../lib/manga/mangaUpdatesAdapter';
import { cacheGet, cacheSet } from '../books/bookCache';
import { backendFetch } from './backendApi';

const HOUR = 3_600_000;
const CHAPTER_TTL = 6 * HOUR;
const SERIES_TTL = 24 * HOUR;
const TITLES_TTL = 24 * HOUR;
const MISS_TTL = 12 * HOUR;
const PAUSE_MS = 60_000;
const TIMEOUT_MS = 15_000;

/** Treffer wird gespeichert, `miss` kürzer gemerkt, `null` (Störung) gar nicht. */
type Outcome<T> = { hit: T } | 'miss' | null;

let pausedUntil = 0;
const inflight = new Map<string, Promise<unknown>>();

/** 429 und 5xx bremsen alle MangaUpdates-Abfragen eine Minute lang, statt sie zu wiederholen. */
async function muPost(path: string, body: unknown): Promise<Response | null> {
  if (Date.now() < pausedUntil) return null;
  const res = await backendFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 429 || res.status >= 500) {
    pausedUntil = Date.now() + PAUSE_MS;
    return null;
  }
  return res;
}

function viaCache<T>(
  ns: string,
  key: string,
  ttl: number,
  empty: T,
  load: () => Promise<Outcome<T>>
): Promise<T> {
  const hit = cacheGet<T>(ns, key, ttl);
  if (hit !== undefined) return Promise.resolve(hit);
  if (cacheGet<true>(`${ns}-miss`, key, MISS_TTL)) return Promise.resolve(empty);
  const id = `${ns}:${key}`;
  let pending = inflight.get(id) as Promise<T> | undefined;
  if (!pending) {
    pending = load()
      .catch((): Outcome<T> => null)
      .then((outcome) => {
        if (outcome === 'miss') cacheSet(`${ns}-miss`, key, true);
        else if (outcome) cacheSet(ns, key, outcome.hit);
        return outcome && outcome !== 'miss' ? outcome.hit : empty;
      })
      .finally(() => inflight.delete(id));
    inflight.set(id, pending);
  }
  return pending;
}

export interface MangaDexInfo {
  mangadexId: string | null;
  latestChapter: number | null;
  totalChapters: number;
  status: string | null;
}

export interface ChapterRelease {
  chapter: number;
  publishedAt: string;
  title?: string;
}

export interface MangaDexChapterInfo {
  mangadexId: string | null;
  recentChapters: ChapterRelease[];
  estimatedNextDate: string | null;
  avgDaysBetweenReleases: number | null;
}

/**
 * Holt aktuelle Kapitelzahl über MangaUpdates.
 */
export function getMangaDexInfo(title: string): Promise<MangaDexInfo> {
  return viaCache('mu-search', mangaChapterKey(title), CHAPTER_TTL, nullResult(), async () => {
    const searchRes = await muPost('/mangaupdates/search', { title });
    if (!searchRes?.ok) return null;

    const searchData = await searchRes.json();
    if (!searchData.seriesId) return 'miss';

    return {
      hit: {
        mangadexId: String(searchData.seriesId),
        latestChapter: searchData.latestChapter,
        totalChapters: searchData.latestChapter || 0,
        status: searchData.completed ? 'completed' : 'ongoing',
      },
    };
  });
}

/**
 * MangaUpdates-Treffer mit Haupttitel und dem Titel, über den sie gefunden
 * wurden. MangaUpdates kennt Alternativtitel wie die deutschen Webtoon-Namen.
 */
export function searchMangaUpdatesTitles(query: string): Promise<MangaUpdatesHit[]> {
  return viaCache('mu-titles', query.toLowerCase().trim(), TITLES_TTL, [], async () => {
    const res = await muPost('/mangaupdates/titles', { search: query });
    if (!res?.ok) return null;

    const data = await res.json();
    const hits: MangaUpdatesHit[] = (Array.isArray(data.hits) ? data.hits : [])
      .filter(
        (hit: { title?: unknown; hitTitle?: unknown }) =>
          typeof hit.title === 'string' && typeof hit.hitTitle === 'string'
      )
      .map((hit: MangaUpdatesHit) => ({
        id: typeof hit.id === 'number' ? hit.id : null,
        title: decodeMangaUpdatesText(hit.title),
        hitTitle: decodeMangaUpdatesText(hit.hitTitle),
        type: typeof hit.type === 'string' ? hit.type : null,
        image: typeof hit.image === 'string' ? hit.image : null,
        year: hit.year ?? null,
        genres: Array.isArray(hit.genres) ? hit.genres : [],
      }));
    return hits.length ? { hit: hits } : 'miss';
  });
}

export async function getMangaUpdatesSeries(seriesId: number): Promise<MangaUpdatesSeries> {
  const cached = cacheGet<MangaUpdatesSeries>('mu-series', String(seriesId), SERIES_TTL);
  if (cached) return cached;

  const res = await muPost('/mangaupdates/series', { id: seriesId });
  if (!res?.ok) throw new Error(`MangaUpdates-Serie ${seriesId}: ${res?.status ?? 'pausiert'}`);
  const data: MangaUpdatesSeries = await res.json();
  if (!data?.id || !data.title) throw new Error(`MangaUpdates-Serie ${seriesId} ohne Daten`);
  cacheSet('mu-series', String(seriesId), data);
  return data;
}

/**
 * Holt die letzten Kapitel-Releases und schätzt nächstes Release-Datum.
 */
export function getMangaDexChapterDates(title: string): Promise<MangaDexChapterInfo> {
  return viaCache(
    'mu-releases',
    mangaChapterKey(title),
    CHAPTER_TTL,
    nullChapterResult(),
    async () => {
      const res = await muPost('/mangaupdates/releases', { title });
      if (!res?.ok) return null;
      return { hit: chapterInfoFrom(await res.json()) };
    }
  );
}

function chapterInfoFrom(data: {
  seriesId?: number;
  releases?: { chapter: number; date: string }[];
}): MangaDexChapterInfo {
  const rawChapters: ChapterRelease[] = (data.releases || []).map(
    (r: { chapter: number; date: string }) => ({
      chapter: r.chapter,
      publishedAt: r.date,
    })
  );

  // Renumbering-Anomalien rausfiltern: chronologisch (alt → neu) lesen,
  // nur Releases akzeptieren deren Chapter-Nr >= bisherigem Max ist. Bei
  // Vagabond fliegt so der 2020er "Comeback Chapter 2" raus, der sonst
  // oben in der Liste stehen wuerde.
  const oldestFirst = [...rawChapters].reverse();
  let maxSeen = 0;
  const valid: ChapterRelease[] = [];
  for (const r of oldestFirst) {
    if (r.chapter >= maxSeen) {
      valid.push(r);
      maxSeen = r.chapter;
    }
  }
  const chapters = valid.reverse();

  // Calculate average days between releases
  let avgDays: number | null = null;
  let estimatedNext: string | null = null;

  if (chapters.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < chapters.length - 1; i++) {
      const d1 = new Date(chapters[i].publishedAt).getTime();
      const d2 = new Date(chapters[i + 1].publishedAt).getTime();
      const daysDiff = (d1 - d2) / (1000 * 60 * 60 * 24);
      if (daysDiff > 0 && daysDiff < 60) {
        gaps.push(daysDiff);
      }
    }

    if (gaps.length > 0) {
      avgDays = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
      const latestDate = new Date(chapters[0].publishedAt);
      const nextDate = new Date(latestDate.getTime() + avgDays * 24 * 60 * 60 * 1000);
      estimatedNext = nextDate.toISOString().split('T')[0];
    }
  }

  return {
    mangadexId: data.seriesId ? String(data.seriesId) : null,
    recentChapters: chapters.slice(0, 5),
    estimatedNextDate: estimatedNext,
    avgDaysBetweenReleases: avgDays,
  };
}

export interface MangaChapterSnapshot {
  /** Neuestes bekanntes Kapitel (null: MangaUpdates kennt keins). */
  c: number | null;
  /** Datum des letzten Releases (null: unbekannt). */
  d: string | null;
  at: number;
}

const BATCH_SIZE = 200;

export const mangaChapterKey = (title: string): string => title.toLowerCase().trim();

/**
 * Kapitelstand für viele Manga mit EINER Anfrage. Das Backend antwortet aus
 * einer lokalen Datei; Titel, die es noch nicht kennt, holt es im Hintergrund
 * nach und liefert sie beim nächsten Aufruf. Schlüssel: `mangaChapterKey(title)`.
 */
export async function getMangaChaptersBatch(
  titles: string[]
): Promise<Record<string, MangaChapterSnapshot>> {
  const items: Record<string, MangaChapterSnapshot> = {};
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    try {
      const res = await backendFetch('/mangaupdates/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles: titles.slice(i, i + BATCH_SIZE) }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      Object.assign(items, data?.items ?? {});
    } catch {
      // Beim nächsten Start erneut
    }
  }
  return items;
}

function nullResult(): MangaDexInfo {
  return { mangadexId: null, latestChapter: null, totalChapters: 0, status: null };
}

function nullChapterResult(): MangaDexChapterInfo {
  return {
    mangadexId: null,
    recentChapters: [],
    estimatedNextDate: null,
    avgDaysBetweenReleases: null,
  };
}
