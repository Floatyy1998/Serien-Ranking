import type { AniListMangaSearchResult } from '../../../types/Manga';

export interface DiscoverManga {
  id: number;
  title: string;
  poster: string;
  format?: string;
  countryOfOrigin?: string;
  score?: string;
}

export const mangaFromAniList = (m: AniListMangaSearchResult): DiscoverManga => ({
  id: m.id,
  title: m.title.english || m.title.romaji,
  poster: m.coverImage.large,
  format: m.format,
  countryOfOrigin: m.countryOfOrigin,
  score: m.averageScore ? (m.averageScore / 10).toFixed(1) : undefined,
});
