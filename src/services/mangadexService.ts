/**
 * Manga chapter data service.
 * Uses MangaUpdates API (https://api.mangaupdates.com) as primary source.
 * MangaUpdates has excellent coverage for Manga, Manhwa AND Webtoon-exclusive titles.
 * No API key needed. Requests go through backend proxy to avoid CORS.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

// Simple in-memory cache
const cache = new Map<string, { data: MangaDexInfo; timestamp: number }>();
const chapterCache = new Map<string, { data: MangaDexChapterInfo; timestamp: number }>();
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
    const searchRes = await fetch(`${BACKEND_URL}/mangaupdates/search`, {
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
    const res = await fetch(`${BACKEND_URL}/mangaupdates/releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return nullChapterResult();

    const data = await res.json();
    const chapters: ChapterRelease[] = (data.releases || []).map(
      (r: { chapter: number; date: string }) => ({
        chapter: r.chapter,
        publishedAt: r.date,
      })
    );

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
