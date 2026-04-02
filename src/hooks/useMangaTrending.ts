import { useEffect, useState } from 'react';
import { discoverManga } from '../services/anilistService';
import type { AniListMangaSearchResult } from '../types/Manga';

interface MangaCarouselItem {
  id: number;
  title: string;
  poster: string;
  rating?: number;
  year?: string;
  genres?: string;
  format?: string;
  countryOfOrigin?: string;
}

function mapToCarouselItem(m: AniListMangaSearchResult): MangaCarouselItem {
  const sd = m.startDate;
  return {
    id: m.id,
    title: m.title.english || m.title.romaji,
    poster: m.coverImage.large,
    rating: m.averageScore ? m.averageScore / 10 : undefined,
    year: sd?.year ? String(sd.year) : undefined,
    genres: m.genres?.slice(0, 2).join(', '),
    format: m.format,
    countryOfOrigin: m.countryOfOrigin,
  };
}

export function useMangaTrending(): MangaCarouselItem[] {
  const [items, setItems] = useState<MangaCarouselItem[]>([]);

  useEffect(() => {
    discoverManga('trending', 1, 15)
      .then(({ results }) => setItems(results.map(mapToCarouselItem)))
      .catch(() => {});
  }, []);

  return items;
}

export function useMangaPopular(): MangaCarouselItem[] {
  const [items, setItems] = useState<MangaCarouselItem[]>([]);

  useEffect(() => {
    discoverManga('popular', 1, 15)
      .then(({ results }) => setItems(results.map(mapToCarouselItem)))
      .catch(() => {});
  }, []);

  return items;
}

export function useMangaTopRated(): MangaCarouselItem[] {
  const [items, setItems] = useState<MangaCarouselItem[]>([]);

  useEffect(() => {
    discoverManga('top_rated', 1, 15)
      .then(({ results }) => setItems(results.map(mapToCarouselItem)))
      .catch(() => {});
  }, []);

  return items;
}

export type { MangaCarouselItem };
