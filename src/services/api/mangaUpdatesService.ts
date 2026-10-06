/**
 * Manga chapter data service.
 * Uses MangaUpdates API (https://api.mangaupdates.com) as primary source.
 * MangaUpdates has excellent coverage for Manga, Manhwa AND Webtoon-exclusive titles.
 * No API key needed. Requests go through backend proxy to avoid CORS.
 */

import type { AliasHit } from '../../lib/manga/titleMatch';
import { backendFetch } from './backendApi';

// Simple in-memory cache
const cache = new Map<string, { data: MangaDexInfo; timestamp: number }>();
const chapterCache = new Map<string, { data: MangaDexChapterInfo; timestamp: number }>();
const titleCache = new Map<string, { hits: AliasHit[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
export async function getMangaDexInfo(title: string): Promise<MangaDexInfo> {
  const cacheKey = title.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Search via backend proxy
    const searchRes = await backendFetch('/mangaupdates/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!searchRes.ok) return nullResult();

    const searchData = await searchRes.json();
    if (!searchData.seriesId) return nullResult();

    const result: MangaDexInfo = {
      mangadexId: String(searchData.seriesId),
      latestChapter: searchData.latestChapter,
      totalChapters: searchData.latestChapter || 0,
      status: searchData.completed ? 'completed' : 'ongoing',
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch {
    return nullResult();
  }
}

const decodeEntities = (value: string): string =>
  value
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

/**
 * MangaUpdates-Treffer mit Haupttitel und dem Titel, über den sie gefunden
 * wurden. MangaUpdates kennt Alternativtitel wie die deutschen Webtoon-Namen.
 */
export async function searchMangaUpdatesTitles(query: string): Promise<AliasHit[]> {
  const cacheKey = query.toLowerCase().trim();
  const cached = titleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.hits;
  }

  try {
    const res = await backendFetch('/mangaupdates/titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: query }),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const hits: AliasHit[] = (Array.isArray(data.hits) ? data.hits : [])
      .filter(
        (hit: { title?: unknown; hitTitle?: unknown }) =>
          typeof hit.title === 'string' && typeof hit.hitTitle === 'string'
      )
      .map((hit: AliasHit) => ({
        title: decodeEntities(hit.title),
        hitTitle: decodeEntities(hit.hitTitle),
      }));
    titleCache.set(cacheKey, { hits, timestamp: Date.now() });
    return hits;
  } catch {
    return [];
  }
}

/**
 * Holt die letzten Kapitel-Releases und schätzt nächstes Release-Datum.
 */
export async function getMangaDexChapterDates(title: string): Promise<MangaDexChapterInfo> {
  const cacheKey = title.toLowerCase().trim();
  const cached = chapterCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Get releases via backend proxy
    const res = await backendFetch('/mangaupdates/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return nullChapterResult();

    const data = await res.json();
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

    const result: MangaDexChapterInfo = {
      mangadexId: data.seriesId ? String(data.seriesId) : null,
      recentChapters: chapters.slice(0, 5),
      estimatedNextDate: estimatedNext,
      avgDaysBetweenReleases: avgDays,
    };

    chapterCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch {
    return nullChapterResult();
  }
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
