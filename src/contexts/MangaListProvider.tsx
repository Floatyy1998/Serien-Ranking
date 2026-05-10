import firebase from 'firebase/compat/app';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { getMangaDexChapterDates, getMangaDexInfo } from '../services/mangadexService';
import type { Manga } from '../types/Manga';
import { MangaListContext } from './MangaListContext';

export const MangaListProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth() || {};

  const {
    data: mangaData,
    loading,
    refetch,
    isStale,
    isOffline,
  } = useEnhancedFirebaseCache<Record<string, Manga>>(user ? `users/${user.uid}/manga` : '', {
    ttl: 24 * 60 * 60 * 1000,
    useRealtimeListener: true,
    enableOfflineSupport: true,
    syncOnReconnect: true,
  });

  const allMangaList: Manga[] = useMemo(
    () => (mangaData ? Object.values(mangaData) : []),
    [mangaData]
  );
  const mangaList = useMemo(() => allMangaList.filter((m) => !m.hidden), [allMangaList]);
  const hiddenMangaList = useMemo(
    () => allMangaList.filter((m) => m.hidden === true),
    [allMangaList]
  );

  // Background refresh: update latestChapterAvailable for releasing manga.
  // Trigger-Regeln:
  // 1. Stale (currentChapter > persistedTotal): immer refetchen — z.B. Vagabond,
  //    wo AniList chapters=2 meldet aber user schon bei 59 ist.
  // 2. Kein persistierter Total-Wert: immer refetchen (frisch hinzugefügt).
  // 3. Sonst: einmal pro Session, um neue Chapter zu erfassen.
  // Holt MAX aus /search (getMangaDexInfo) UND /releases (getMangaDexChapterDates),
  // weil bei manchen Titeln nur einer der beiden Endpoints liefert.
  const refreshedIdsRef = useRef(new Set<number>());
  useEffect(() => {
    if (!user || loading || allMangaList.length === 0) return;

    const sessionDone = sessionStorage.getItem('mangaChapterRefreshDone') === 'true';

    const toFetch = allMangaList.filter((m) => {
      if (m.status !== 'RELEASING') return false;
      if (refreshedIdsRef.current.has(m.anilistId)) return false;

      const persistedTotal = Math.max(m.chapters || 0, m.latestChapterAvailable || 0);
      // Stale: user ist schon weiter als jeder gespeicherte Total-Wert
      if (m.currentChapter > persistedTotal) return true;
      // Noch gar kein Total bekannt
      if (persistedTotal === 0) return true;
      // Sonst nur einmal pro Session
      return !sessionDone;
    });

    if (toFetch.length === 0) {
      if (!sessionDone) sessionStorage.setItem('mangaChapterRefreshDone', 'true');
      return;
    }

    if (!sessionDone) sessionStorage.setItem('mangaChapterRefreshDone', 'true');

    toFetch.forEach((manga, i) => {
      refreshedIdsRef.current.add(manga.anilistId);
      setTimeout(async () => {
        try {
          const [info, chapterInfo] = await Promise.all([
            getMangaDexInfo(manga.title),
            getMangaDexChapterDates(manga.title),
          ]);
          const latestFromReleases = chapterInfo?.recentChapters?.length
            ? Math.max(...chapterInfo.recentChapters.map((c) => c.chapter))
            : 0;
          const live = Math.max(info.latestChapter || 0, latestFromReleases);
          if (live > 0 && live > (manga.latestChapterAvailable || 0)) {
            await firebase
              .database()
              .ref(`users/${user.uid}/manga/${manga.anilistId}/latestChapterAvailable`)
              .set(live);
          }
        } catch {
          // Silent fail per manga
        }
      }, i * 250);
    });
  }, [user, loading, allMangaList]);

  const toggleHideManga = useCallback(
    async (anilistId: number, hidden: boolean) => {
      if (!user) return;
      await firebase.database().ref(`users/${user.uid}/manga/${anilistId}/hidden`).set(hidden);
    },
    [user]
  );

  return (
    <MangaListContext.Provider
      value={{
        mangaList,
        allMangaList,
        hiddenMangaList,
        loading,
        refetchManga: refetch,
        toggleHideManga,
        isOffline,
        isStale,
      }}
    >
      {children}
    </MangaListContext.Provider>
  );
};
