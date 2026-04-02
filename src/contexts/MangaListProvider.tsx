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

  // Background refresh: update latestChapterAvailable for all releasing manga
  // Runs once per session to keep chapter counts current
  const refreshRunRef = useRef(false);
  useEffect(() => {
    if (!user || loading || allMangaList.length === 0 || refreshRunRef.current) return;
    if (sessionStorage.getItem('mangaChapterRefreshDone') === 'true') return;

    refreshRunRef.current = true;
    sessionStorage.setItem('mangaChapterRefreshDone', 'true');

    const releasingManga = allMangaList.filter((m) => m.status === 'RELEASING' && !m.chapters);

    if (releasingManga.length === 0) return;

    // Stagger requests to respect MangaDex rate limit (5 req/sec)
    releasingManga.forEach((manga, i) => {
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
      }, i * 250); // 4 req/sec to stay safe
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
