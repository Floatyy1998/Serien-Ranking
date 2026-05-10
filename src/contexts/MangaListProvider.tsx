import firebase from 'firebase/compat/app';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { getMangaById } from '../services/anilistService';
import { getMangaDexChapterDates, getMangaDexInfo } from '../services/mangadexService';
import type { Manga } from '../types/Manga';
import { MangaListContext } from './MangaListContext';

const ANILIST_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1x pro Tag
const ANILIST_REFRESH_KEY_PREFIX = 'mangaAniListRefreshLastRun:';

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
      // RELEASING und HIATUS — letztere können trotzdem neue Chapter bekommen
      // (Berserk-Studio-Gaga, Vagabond-Comeback). FINISHED/CANCELLED werden
      // ueber den AniList-Refresh erfasst.
      if (m.status !== 'RELEASING' && m.status !== 'HIATUS') return false;
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

  // AniList-Metadaten-Refresh: status, chapters, volumes, averageScore,
  // format, genres etc. werden beim Add einmalig persistiert und sonst nie
  // aktualisiert. Damit ein Manga, das auf HIATUS oder FINISHED wechselt
  // (Berserk → HIATUS, Vagabond → HIATUS), nicht ewig "Laufend" anzeigt:
  // Einmal pro Tag pro User die ganze Liste gegen AniList syncen.
  const anilistRefreshedIdsRef = useRef(new Set<number>());
  useEffect(() => {
    if (!user || loading || allMangaList.length === 0) return;

    const storageKey = `${ANILIST_REFRESH_KEY_PREFIX}${user.uid}`;
    const lastRunStr = localStorage.getItem(storageKey);
    const lastRun = lastRunStr ? parseInt(lastRunStr, 10) : 0;
    if (Date.now() - lastRun < ANILIST_REFRESH_INTERVAL_MS) return;

    const toRefresh = allMangaList.filter((m) => !anilistRefreshedIdsRef.current.has(m.anilistId));
    if (toRefresh.length === 0) return;

    localStorage.setItem(storageKey, String(Date.now()));

    toRefresh.forEach((manga, i) => {
      anilistRefreshedIdsRef.current.add(manga.anilistId);
      // 1s Delay zwischen Anfragen — AniList rate-limit ist ~90/min
      setTimeout(async () => {
        try {
          const data = await getMangaById(manga.anilistId);
          if (!data) return;

          const updates: Record<string, unknown> = {};
          if (data.status && data.status !== manga.status) updates.status = data.status;
          // Numerische Felder nur ueberschreiben, wenn AniList einen positiven
          // Wert liefert. Null heisst meist "unbekannt" — alten Wert behalten.
          if (data.chapters && data.chapters !== manga.chapters) {
            updates.chapters = data.chapters;
          }
          if (data.volumes && data.volumes !== manga.volumes) {
            updates.volumes = data.volumes;
          }
          if (data.averageScore && data.averageScore !== manga.averageScore) {
            updates.averageScore = data.averageScore;
          }
          if (data.format && data.format !== manga.format) updates.format = data.format;
          if (data.countryOfOrigin && data.countryOfOrigin !== manga.countryOfOrigin) {
            updates.countryOfOrigin = data.countryOfOrigin;
          }
          if (
            data.genres &&
            data.genres.length > 0 &&
            JSON.stringify(data.genres) !== JSON.stringify(manga.genres ?? [])
          ) {
            updates.genres = data.genres;
          }
          // Cover/Banner/Description nur fuellen wenn vorher leer — niemand
          // soll seinen manuellen Stand ueberschrieben bekommen.
          if (!manga.poster && data.coverImage?.large) updates.poster = data.coverImage.large;
          if (!manga.bannerImage && data.bannerImage) updates.bannerImage = data.bannerImage;
          if (!manga.description && data.description) updates.description = data.description;

          if (Object.keys(updates).length > 0) {
            await firebase
              .database()
              .ref(`users/${user.uid}/manga/${manga.anilistId}`)
              .update(updates);
          }
        } catch {
          // Silent fail per manga
        }
      }, i * 1000);
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
