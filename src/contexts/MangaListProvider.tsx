import firebase from 'firebase/compat/app';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { getMangaDexInfo } from '../services/mangadexService';
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
  } = useEnhancedFirebaseCache<Record<string, Manga>>(user ? `${user.uid}/manga` : '', {
    ttl: 24 * 60 * 60 * 1000,
    useDeltaSync: true,
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

  // Background refresh: update latestChapterAvailable for releasing manga
  // Two triggers:
  // 1. Once per session: refresh ALL releasing manga (catches new chapters)
  // 2. Always: fetch for any releasing manga that has NO latestChapterAvailable yet (newly added)
  const refreshedIdsRef = useRef(new Set<number>());
  useEffect(() => {
    if (!user || loading || allMangaList.length === 0) return;

    const sessionDone = sessionStorage.getItem('mangaChapterRefreshDone') === 'true';

    const toFetch = allMangaList.filter((m) => {
      if (m.status !== 'RELEASING' || m.chapters) return false;
      // Always fetch if no latestChapterAvailable (newly added)
      if (!m.latestChapterAvailable) return !refreshedIdsRef.current.has(m.anilistId);
      // Otherwise only on first session load
      if (sessionDone) return false;
      return !refreshedIdsRef.current.has(m.anilistId);
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
          const info = await getMangaDexInfo(manga.title);
          if (
            info.latestChapter &&
            info.latestChapter > 0 &&
            info.latestChapter !== manga.latestChapterAvailable
          ) {
            await firebase
              .database()
              .ref(`${user.uid}/manga/${manga.anilistId}/latestChapterAvailable`)
              .set(info.latestChapter);
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
      await firebase.database().ref(`${user.uid}/manga/${anilistId}/hidden`).set(hidden);
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
