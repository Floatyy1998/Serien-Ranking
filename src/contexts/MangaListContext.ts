import { createContext, useContext } from 'react';
import type { Manga } from '../types/Manga';

export interface MangaListContextType {
  mangaList: Manga[];
  allMangaList: Manga[];
  hiddenMangaList: Manga[];
  loading: boolean;
  refetchManga: () => void;
  toggleHideManga: (anilistId: number, hidden: boolean) => Promise<void>;
  isOffline: boolean;
  isStale: boolean;
}

export const MangaListContext = createContext<MangaListContextType>({
  mangaList: [],
  allMangaList: [],
  hiddenMangaList: [],
  loading: true,
  refetchManga: () => {},
  toggleHideManga: async () => {},
  isOffline: false,
  isStale: false,
});

export const useMangaList = () => useContext(MangaListContext);
