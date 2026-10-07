/** Manga-Bereich mit Beispielsammlung (echte AniList-Daten) — nur für /dev/ui-preview. */

import type firebase from 'firebase/compat/app';
import { useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { MangaListContext } from '../../contexts/MangaListContext';
import { discoverManga } from '../../services/api/anilistService';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import { MangaDetailPage } from '../Manga/MangaDetailPage';
import { MangaLayoutPage } from '../Manga/MangaLayoutPage';
import { MangaPage } from '../Manga/MangaPage';
import { MangaSearchPage } from '../Manga/MangaSearchPage';
import { getDisplayFormatKey } from '../Manga/mangaUtils';

const PREVIEW_UID = 'preview-user';
const DAY = 86400000;

const STATUSES: Manga['readStatus'][] = [
  'reading',
  'reading',
  'completed',
  'reading',
  'planned',
  'paused',
  'completed',
  'reading',
  'planned',
  'dropped',
  'completed',
  'reading',
  'planned',
  'completed',
];

const toManga = (r: AniListMangaSearchResult, i: number, now: number): Manga => {
  const readStatus = STATUSES[i % STATUSES.length];
  const total = r.chapters || 120 + i * 13;
  const current =
    readStatus === 'completed'
      ? total
      : readStatus === 'planned'
        ? 0
        : Math.max(1, Math.round(total * ((i * 37) % 90) * 0.01));
  const iso = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();
  return {
    nmr: i + 1,
    anilistId: r.id,
    title: r.title.english || r.title.romaji,
    titleRomaji: r.title.romaji,
    poster: r.coverImage.large,
    bannerImage: r.bannerImage || undefined,
    description: r.description || undefined,
    chapters: r.chapters,
    volumes: r.volumes,
    status: r.status,
    format: getDisplayFormatKey(r.countryOfOrigin, r.format),
    countryOfOrigin: r.countryOfOrigin,
    genres: r.genres,
    averageScore: r.averageScore,
    rating: readStatus === 'completed' && i % 4 !== 2 ? { [PREVIEW_UID]: 7 + (i % 4) } : {},
    currentChapter: current,
    readStatus,
    addedAt: iso(i * 3 + 1),
    lastReadAt: readStatus === 'planned' ? undefined : iso(i + 0.2),
    startedAt: readStatus === 'planned' ? undefined : iso(i * 3 + 20),
    completedAt: readStatus === 'completed' ? iso(i * 9 + 30) : undefined,
    latestChapterAvailable: r.status === 'RELEASING' ? total + (i % 3) + 1 : undefined,
    lastReleaseDate: r.status === 'RELEASING' ? iso((i % 4) + 0.5) : undefined,
    readingPlatform: i % 3 === 0 ? 'Webtoon' : undefined,
  };
};

const fakeUser = {
  uid: PREVIEW_UID,
  displayName: 'Bärbel',
  photoURL: null,
} as unknown as firebase.User;

const MangaPreviewShell = ({ children }: { children: (list: Manga[]) => React.ReactNode }) => {
  const [results, setResults] = useState<AniListMangaSearchResult[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    void discoverManga('popular', 1, 18).then(({ results: r }) => setResults(r));
  }, []);

  const list = useMemo(() => results.map((r, i) => toManga(r, i, now)), [results, now]);
  const auth = useMemo(
    () => ({
      user: fakeUser,
      setUser: () => {},
      authStateResolved: true,
      onboardingComplete: true,
      setOnboardingComplete: () => {},
    }),
    []
  );
  const manga = useMemo(
    () => ({
      mangaList: list,
      allMangaList: list,
      hiddenMangaList: [],
      loading: list.length === 0,
      refetchManga: () => {},
      toggleHideManga: async () => {},
      isOffline: false,
      isStale: false,
    }),
    [list]
  );

  if (list.length === 0) return <p style={{ padding: 24 }}>Lade Beispieldaten …</p>;

  return (
    <AuthContext.Provider value={auth}>
      <MangaListContext.Provider value={manga}>
        <div className="mobile-content" style={{ height: '100vh', overflowY: 'auto' }}>
          {children(list)}
        </div>
      </MangaListContext.Provider>
    </AuthContext.Provider>
  );
};

export const MangaOverviewPreview = () => (
  <MangaPreviewShell>{() => <MangaPage />}</MangaPreviewShell>
);

const DetailRoute = ({ id }: { id: number }) => (
  <Routes location={`/dev/ui-preview/manga/${id}`}>
    <Route path="manga/:id" element={<MangaDetailPage />} />
  </Routes>
);

export const MangaDetailOwnedPreview = () => {
  const index = Number(new URLSearchParams(window.location.search).get('i') || '0');
  return (
    <MangaPreviewShell>
      {(list) => <DetailRoute id={list[Math.min(index, list.length - 1)].anilistId} />}
    </MangaPreviewShell>
  );
};

export const MangaDetailForeignPreview = () => (
  <MangaPreviewShell>{() => <DetailRoute id={30002} />}</MangaPreviewShell>
);

export const MangaSearchPreview = () => (
  <MangaPreviewShell>{() => <MangaSearchPage />}</MangaPreviewShell>
);

export const MangaLayoutPreview = () => (
  <MangaPreviewShell>{() => <MangaLayoutPage />}</MangaPreviewShell>
);
