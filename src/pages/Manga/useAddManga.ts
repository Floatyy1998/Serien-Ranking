import { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMangaList } from '../../contexts/MangaListContext';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { addMangaToList, type AddMangaOptions } from './addMangaToList';

/** Manga in die eigene Sammlung legen; addingId markiert die Karte, die gerade speichert. */
export function useAddManga() {
  const { user } = useAuth() || {};
  const { allMangaList } = useMangaList();
  const [addingId, setAddingId] = useState<number | null>(null);

  const add = useCallback(
    async (result: AniListMangaSearchResult, options?: AddMangaOptions): Promise<boolean> => {
      if (!user) return false;
      setAddingId(result.id);
      const nextNmr = allMangaList.length > 0 ? Math.max(...allMangaList.map((m) => m.nmr)) + 1 : 1;
      try {
        await addMangaToList(user.uid, result, nextNmr, options);
        return true;
      } catch (err) {
        console.error('Manga add failed:', err);
        return false;
      } finally {
        setAddingId(null);
      }
    },
    [user, allMangaList]
  );

  return { add, addingId };
}
