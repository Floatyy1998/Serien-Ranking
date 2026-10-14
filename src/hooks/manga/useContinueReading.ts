import { useMemo } from 'react';
import { useMangaList } from '../../contexts/MangaListContext';
import { hasReadProgress, mangaStand, type MangaStand } from '../../lib/manga/progress';
import { getEffectiveChapterCount } from '../../pages/Manga/mangaUtils';
import type { Manga } from '../../types/Manga';

export interface ContinueReadingItem {
  anilistId: number;
  title: string;
  poster: string;
  /** AniList-Bannerbild — Kino-Banner in den Weiterlesen-Zeilen. */
  bannerImage?: string;
  progress: number;
  /** Stand in der Zählweise des Manga (Kapitel oder Bände). */
  stand: MangaStand;
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
  const effectiveTotal = getEffectiveChapterCount(manga);
  const stand = mangaStand(manga);

  return {
    anilistId: manga.anilistId,
    title: manga.title,
    poster: manga.poster,
    bannerImage: manga.bannerImage,
    progress: stand.percent,
    stand,
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
      .filter((m) => m.readStatus === 'reading' && hasReadProgress(m))
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
