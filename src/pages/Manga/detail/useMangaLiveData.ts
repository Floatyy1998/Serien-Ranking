import type firebase from 'firebase/compat/app';
import { useEffect, useState } from 'react';
import { getMangaById } from '../../../services/anilistService';
import {
  getMangaDexChapterDates,
  getMangaDexInfo,
  type MangaDexChapterInfo,
  type MangaDexInfo,
} from '../../../services/mangaUpdatesService';
import type { AniListMangaSearchResult, Manga } from '../../../types/Manga';
import { dbRef, paths } from '../../../services/db/ref';
import { shouldReopenCompleted } from '../mangaUtils';

interface UseMangaLiveDataArgs {
  user: firebase.User | null | undefined;
  anilistId: number;
  manga: Manga | undefined;
}

interface UseMangaLiveDataResult {
  anilistData: AniListMangaSearchResult | null;
  mangadexInfo: MangaDexInfo | null;
  chapterInfo: MangaDexChapterInfo | null;
}

/**
 * Fetches AniList details + (for releasing/hiatus titles) MangaDex live data
 * and persists newer chapter counts / release dates back to Firebase so list
 * views see up-to-date values.
 */
export const useMangaLiveData = ({
  user,
  anilistId,
  manga,
}: UseMangaLiveDataArgs): UseMangaLiveDataResult => {
  const [anilistData, setAnilistData] = useState<AniListMangaSearchResult | null>(null);
  const [mangadexInfo, setMangadexInfo] = useState<MangaDexInfo | null>(null);
  const [chapterInfo, setChapterInfo] = useState<MangaDexChapterInfo | null>(null);

  useEffect(() => {
    if (!anilistId) return;
    getMangaById(anilistId)
      .then(setAnilistData)
      .catch((error) => console.error('AniList-Daten konnten nicht geladen werden:', error));
  }, [anilistId]);

  // RELEASING und HIATUS — letztere koennen trotzdem neue Chapter bekommen
  // (Berserk → Studio Gaga, Vagabond → 2020er Comeback-Special).
  const mangaTitle = manga?.title;
  const mangaStatus = manga?.status;
  const mangaLatestChapterAvailable = manga?.latestChapterAvailable;
  const mangaLastReleaseDate = manga?.lastReleaseDate;
  const mangaChapters = manga?.chapters;
  const mangaReadStatus = manga?.readStatus;
  const mangaCurrentChapter = manga?.currentChapter;
  const mangaCompletedAt = manga?.completedAt;
  const mangaLastReadAt = manga?.lastReadAt;
  const shouldFetchLive = mangaStatus === 'RELEASING' || mangaStatus === 'HIATUS';

  useEffect(() => {
    if (!user || !mangaTitle || !shouldFetchLive) return;
    getMangaDexInfo(mangaTitle)
      .then(setMangadexInfo)
      .catch(() => {}); // bewusst still: MangaDex-Livedaten sind optionale Anreicherung
  }, [user, mangaTitle, shouldFetchLive]);

  useEffect(() => {
    if (!mangaTitle || !shouldFetchLive) return;
    getMangaDexChapterDates(mangaTitle)
      .then(setChapterInfo)
      .catch(() => {}); // bewusst still: MangaDex-Livedaten sind optionale Anreicherung
  }, [mangaTitle, shouldFetchLive]);

  // latestChapterAvailable + lastReleaseDate in Firebase persistieren. Listen-
  // Ansichten kennen nur die Firebase-Felder, brauchen also die persistierten
  // Werte. /search liefert bei manchen Titeln keinen latestChapter, /releases
  // hingegen schon — deshalb beide Quellen einrechnen.
  useEffect(() => {
    if (!user || !shouldFetchLive) return;
    const latestFromReleases = chapterInfo?.recentChapters?.length
      ? Math.max(...chapterInfo.recentChapters.map((c) => c.chapter))
      : 0;
    const live = Math.max(mangadexInfo?.latestChapter || 0, latestFromReleases);
    const newestRelease = chapterInfo?.recentChapters?.[0]?.publishedAt;

    const updates: Record<string, unknown> = {};
    if (live > 0 && live > (mangaLatestChapterAvailable || 0)) {
      updates.latestChapterAvailable = live;
    }
    if (newestRelease && newestRelease !== mangaLastReleaseDate) {
      updates.lastReleaseDate = newestRelease;
    }
    // Neues Kapitel fuer einen aufgeholten "abgeschlossenen" Manga: zurueck
    // auf "Lese ich", sonst taucht er in keiner Lese-Ansicht mehr auf.
    const persistedTotal = Math.max(mangaChapters || 0, mangaLatestChapterAvailable || 0);
    if (
      shouldReopenCompleted(
        {
          readStatus: mangaReadStatus,
          currentChapter: mangaCurrentChapter,
          completedAt: mangaCompletedAt,
          lastReadAt: mangaLastReadAt,
        },
        persistedTotal,
        Math.max(persistedTotal, live)
      )
    ) {
      updates.readStatus = 'reading';
    }
    if (Object.keys(updates).length > 0) {
      dbRef(paths.mangaItem(user.uid, anilistId))
        .update(updates)
        // bewusst still: Persistieren ist Best-effort, nächster Besuch versucht es erneut
        .catch(() => {});
    }
  }, [
    user,
    shouldFetchLive,
    mangadexInfo,
    chapterInfo,
    mangaLatestChapterAvailable,
    mangaLastReleaseDate,
    mangaChapters,
    mangaReadStatus,
    mangaCurrentChapter,
    mangaCompletedAt,
    mangaLastReadAt,
    anilistId,
  ]);

  return { anilistData, mangadexInfo, chapterInfo };
};
