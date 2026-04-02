import { useMemo } from 'react';
import { useMangaList } from '../contexts/MangaListContext';
import type { Manga } from '../types/Manga';

export interface ContinueReadingItem {
  anilistId: number;
  title: string;
  poster: string;
  progress: number;
  currentChapter: number;
  totalChapters: number | null;
  currentVolume?: number;
  totalVolumes?: number | null;
  lastReadAt: string;
  format?: string;
  countryOfOrigin?: string;
  genres?: string[];
  readingPlatform?: string;
}

function mangaToContinueReading(manga: Manga): ContinueReadingItem {
  const effectiveTotal = manga.chapters || manga.latestChapterAvailable || null;
  const progress =
    effectiveTotal && effectiveTotal > 0
      ? Math.min((manga.currentChapter / effectiveTotal) * 100, 100)
      : 0;

  return {
    anilistId: manga.anilistId,
    title: manga.title,
    poster: manga.poster,
    progress,
    currentChapter: manga.currentChapter,
    totalChapters: effectiveTotal,
    currentVolume: manga.currentVolume,
    totalVolumes: manga.volumes ?? null,
    lastReadAt: manga.lastReadAt || manga.addedAt || '',
    format: manga.format,
    countryOfOrigin: manga.countryOfOrigin,
    genres: manga.genres,
    readingPlatform: manga.readingPlatform,
  };
}

export function useContinueReading(): ContinueReadingItem[] {
  const { mangaList } = useMangaList();

  return useMemo(() => {
    return mangaList
      .filter((m) => m.readStatus === 'reading' && m.currentChapter > 0)
      .map(mangaToContinueReading)
      .sort((a, b) => {
        if (!a.lastReadAt && !b.lastReadAt) return 0;
        if (!a.lastReadAt) return 1;
        if (!b.lastReadAt) return -1;
        return new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime();
      })
      .slice(0, 10);
  }, [mangaList]);
}
