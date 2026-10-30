import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/data/useEnhancedFirebaseCache';
import { getMangaDetails } from '../services/api/mangaDetails';
import { getMangaChaptersBatch, mangaChapterKey } from '../services/api/mangaUpdatesService';
import { getDisplayFormatKey, shouldReopenCompleted } from '../pages/Manga/mangaUtils';
import type { Manga } from '../types/Manga';
import { dbRef, paths, updateIfExists, userPath } from '../services/db/ref';
import { MangaListContext } from './MangaListContext';

const ANILIST_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1x pro Tag
const ANILIST_REFRESH_KEY_PREFIX = 'mangaAniListRefreshLastRun:';
const UNKNOWN_CHAPTERS_RETRY_MS = 90 * 1000;

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
    // Fragmente ohne anilistId/title (Teil-Update auf gelöschten Eintrag) nie anzeigen.
    () => (mangaData ? Object.values(mangaData).filter((m) => m?.anilistId && m.title) : []),
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
  // Der Stand kommt mit EINER Batch-Anfrage aus dem Backend (lokale Datei dort,
  // MAX aus search + releases, kein Firebase). Titel, die das Backend noch nicht
  // kennt, holt es im Hintergrund nach; sie werden einmal nach kurzer Zeit erneut
  // abgefragt, sonst beim nächsten Start.
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

    toFetch.forEach((manga) => refreshedIdsRef.current.add(manga.anilistId));

    const applyChapters = async (mangaList: Manga[]): Promise<Manga[]> => {
      const snapshots = await getMangaChaptersBatch(mangaList.map((m) => m.title));
      const unknown: Manga[] = [];
      for (const manga of mangaList) {
        const snapshot = snapshots[mangaChapterKey(manga.title)];
        if (!snapshot) {
          unknown.push(manga);
          continue;
        }
        try {
          const live = snapshot.c || 0;
          const updates: Record<string, unknown> = {};
          const persistedTotal = Math.max(manga.chapters || 0, manga.latestChapterAvailable || 0);
          if (live > 0 && live > (manga.latestChapterAvailable || 0)) {
            updates.latestChapterAvailable = live;
          }
          // Neues Kapitel fuer einen aufgeholten "abgeschlossenen" Manga:
          // zurueck auf "Lese ich", sonst bleibt er fuer immer aus der Liste.
          if (shouldReopenCompleted(manga, persistedTotal, Math.max(persistedTotal, live))) {
            updates.readStatus = 'reading';
          }
          if (snapshot.d && snapshot.d !== manga.lastReleaseDate) {
            updates.lastReleaseDate = snapshot.d;
          }
          if (Object.keys(updates).length > 0) {
            await updateIfExists(paths.mangaItem(user.uid, manga.anilistId), updates);
          }
        } catch {
          // Silent fail per manga
        }
      }
      return unknown;
    };

    void applyChapters(toFetch).then((unknown) => {
      if (unknown.length > 0) {
        setTimeout(() => void applyChapters(unknown), UNKNOWN_CHAPTERS_RETRY_MS);
      }
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
    // Alle sofort als „dran" merken: Unsere eigenen Schreibzugriffe ändern die Liste und starten den Effekt neu.
    toRefresh.forEach((manga) => anilistRefreshedIdsRef.current.add(manga.anilistId));

    // Nacheinander mit 1 s Abstand — das AniList-Limit liegt bei ~90/min. Ist AniList nicht erreichbar
    // (Netzfehler), bricht die Reihe nach dem ersten Fehlschlag ab, statt für jeden Titel ins Leere zu
    // funken; der Tag gilt dann nicht als erledigt. Bei 429 ist das Limit erreicht: Rest heute auslassen.
    void (async () => {
      for (const [i, manga] of toRefresh.entries()) {
        if (i > 0) await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const data = await getMangaDetails(manga.anilistId);
          if (!data) continue;

          const updates: Record<string, unknown> = {};
          if (data.status && data.status !== manga.status) updates.status = data.status;
          // Numerische Felder nur ueberschreiben, wenn AniList einen positiven
          // Wert liefert. Null heisst meist "unbekannt" — alten Wert behalten.
          if (data.chapters && data.chapters !== manga.chapters) {
            updates.chapters = data.chapters;
          }
          if (data.chapters) {
            const persistedTotal = Math.max(manga.chapters || 0, manga.latestChapterAvailable || 0);
            const nextTotal = Math.max(persistedTotal, data.chapters);
            if (shouldReopenCompleted(manga, persistedTotal, nextTotal)) {
              updates.readStatus = 'reading';
            }
          }
          if (data.volumes && data.volumes !== manga.volumes) {
            updates.volumes = data.volumes;
          }
          if (data.averageScore && data.averageScore !== manga.averageScore) {
            updates.averageScore = data.averageScore;
          }
          const formatKey = getDisplayFormatKey(data.countryOfOrigin, data.format);
          if (data.format && formatKey !== manga.format) updates.format = formatKey;
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
            await updateIfExists(paths.mangaItem(user.uid, manga.anilistId), updates);
          }
        } catch (err) {
          if (err instanceof TypeError) {
            localStorage.removeItem(storageKey);
            toRefresh.slice(i).forEach((m) => anilistRefreshedIdsRef.current.delete(m.anilistId));
            return;
          }
          if (/\b429\b/.test((err as Error)?.message ?? '')) return;
          // Einzelner Titel gescheitert (gelöscht, Serverfehler) — die übrigen trotzdem abgleichen.
        }
      }
    })();
  }, [user, loading, allMangaList]);

  const toggleHideManga = useCallback(
    async (anilistId: number, hidden: boolean) => {
      if (!user) return;
      await dbRef(userPath(user.uid, 'manga', anilistId, 'hidden')).set(hidden);
    },
    [user]
  );

  // Memoize so consumers re-render only when the underlying data shifts.
  const contextValue = useMemo(
    () => ({
      mangaList,
      allMangaList,
      hiddenMangaList,
      loading,
      refetchManga: refetch,
      toggleHideManga,
      isOffline,
      isStale,
    }),
    [
      mangaList,
      allMangaList,
      hiddenMangaList,
      loading,
      refetch,
      toggleHideManga,
      isOffline,
      isStale,
    ]
  );

  return <MangaListContext.Provider value={contextValue}>{children}</MangaListContext.Provider>;
};
