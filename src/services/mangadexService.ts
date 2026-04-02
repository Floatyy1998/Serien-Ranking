/**
 * MangaDex API - holt aktuelle Kapitelzahlen für laufende Manga.
 * AniList hat bei laufenden Manga oft chapters: null.
 * MangaDex hat über /aggregate den höchsten verfügbaren Chapter.
 *
 * Kein API-Key nötig. Rate limit: 5 Req/Sek.
 */

const MANGADEX_API = 'https://api.mangadex.org';

// Simple in-memory cache to avoid re-fetching
const cache = new Map<string, { data: MangaDexInfo; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export interface MangaDexInfo {
  mangadexId: string | null;
  latestChapter: number | null;
  totalChapters: number;
  status: string | null;
}

/**
 * Sucht einen Manga auf MangaDex anhand des Titels und gibt die aktuelle Kapitelzahl zurück.
 */
export async function getMangaDexInfo(title: string): Promise<MangaDexInfo> {
  const cacheKey = title.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Step 1: Search for the manga
    const searchRes = await fetch(
      `${MANGADEX_API}/manga?title=${encodeURIComponent(title)}&limit=1&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`
    );
    if (!searchRes.ok) return nullResult();

    const searchData = await searchRes.json();
    const manga = searchData.data?.[0];
    if (!manga) return nullResult();

    const mangadexId = manga.id;
    const status = manga.attributes?.status || null;

    // Step 2: Get aggregate data (all chapters)
    const aggRes = await fetch(`${MANGADEX_API}/manga/${mangadexId}/aggregate`);
    if (!aggRes.ok) return { mangadexId, latestChapter: null, totalChapters: 0, status };

    const aggData = await aggRes.json();
    const volumes = aggData.volumes || {};

    let maxChapter = 0;
    let totalEntries = 0;

    for (const vol of Object.values(volumes) as {
      chapters?: Record<string, { chapter: string }>;
    }[]) {
      const chapters = vol.chapters || {};
      for (const ch of Object.values(chapters)) {
        totalEntries++;
        try {
          const num = parseFloat(ch.chapter);
          if (!isNaN(num) && num > maxChapter) maxChapter = num;
        } catch {
          // skip non-numeric chapters
        }
      }
    }

    const result: MangaDexInfo = {
      mangadexId,
      latestChapter: maxChapter > 0 ? Math.floor(maxChapter) : null,
      totalChapters: totalEntries,
      status,
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch {
    return nullResult();
  }
}

function nullResult(): MangaDexInfo {
  return { mangadexId: null, latestChapter: null, totalChapters: 0, status: null };
}

// ─── Chapter Release Data ───────────────────────────

export interface ChapterRelease {
  chapter: number;
  publishedAt: string; // ISO date
  title?: string;
}

export interface MangaDexChapterInfo {
  mangadexId: string | null;
  recentChapters: ChapterRelease[];
  estimatedNextDate: string | null; // ISO date
  avgDaysBetweenReleases: number | null;
}

const chapterCache = new Map<string, { data: MangaDexChapterInfo; timestamp: number }>();

/**
 * Holt die letzten Kapitel-Releases von MangaDex und schätzt das nächste Release-Datum.
 */
export async function getMangaDexChapterDates(title: string): Promise<MangaDexChapterInfo> {
  const cacheKey = title.toLowerCase().trim();
  const cached = chapterCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Step 1: Find manga
    const searchRes = await fetch(
      `${MANGADEX_API}/manga?title=${encodeURIComponent(title)}&limit=1&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`
    );
    if (!searchRes.ok) return nullChapterResult();

    const searchData = await searchRes.json();
    const manga = searchData.data?.[0];
    if (!manga) return nullChapterResult();

    const mangadexId = manga.id;

    // Step 2: Get latest chapters with dates
    const feedRes = await fetch(
      `${MANGADEX_API}/manga/${mangadexId}/feed?limit=10&order%5Bchapter%5D=desc&translatedLanguage%5B%5D=en`
    );
    if (!feedRes.ok)
      return {
        mangadexId,
        recentChapters: [],
        estimatedNextDate: null,
        avgDaysBetweenReleases: null,
      };

    const feedData = await feedRes.json();
    const chapters: ChapterRelease[] = [];
    const seenChapters = new Set<number>();

    for (const ch of feedData.data || []) {
      const attrs = ch.attributes;
      const num = parseFloat(attrs.chapter);
      if (isNaN(num) || seenChapters.has(Math.floor(num))) continue;
      seenChapters.add(Math.floor(num));

      chapters.push({
        chapter: Math.floor(num),
        publishedAt: attrs.publishAt || attrs.createdAt,
        title: attrs.title || undefined,
      });
    }

    // Sort by chapter desc
    chapters.sort((a, b) => b.chapter - a.chapter);

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
          // Ignore gaps > 60 days (hiatus)
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
      mangadexId,
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

function nullChapterResult(): MangaDexChapterInfo {
  return {
    mangadexId: null,
    recentChapters: [],
    estimatedNextDate: null,
    avgDaysBetweenReleases: null,
  };
}
