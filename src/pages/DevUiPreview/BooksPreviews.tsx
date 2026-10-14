import type firebase from 'firebase/compat/app';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { showCoinEgg } from '../../components/reading/coinEasterEgg';
import { AuthContext, useAuth } from '../../contexts/AuthContext';
import { BooksListContext } from '../../contexts/BooksListContext';
import { MovieListContext } from '../../contexts/MovieListContext';
import { SeriesListContext } from '../../contexts/SeriesListContext';
import { tmdbFetch } from '../../services/api/tmdbClient';
import { useOwnPhotoURL } from '../../services/profile/ownProfilePhoto';
import type { Book, BookStatus } from '../../types/Book';
import { BookDetailPage } from '../Books/BookDetailPage';
import { BookImportPage } from '../Books/BookImportPage';
import { BookSearchPage } from '../Books/BookSearchPage';
import { BookShelfPage } from '../Books/BookShelfPage';
import { BooksPage } from '../Books/BooksPage';
import { BookStatsPage } from '../Books/BookStatsPage';
import { FriendBooksInsights } from '../FriendProfile/FriendBooksInsights';
import { ReadingHubPage } from '../Books/ReadingHubPage';

const cover = (id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`;

type Seed = [string, string, number, string, number, number, string, BookStatus, number?, string?];

/** Titel, Autor, Cover-ID, ISBN, Seiten, Jahr, Werk-ID, Status, Seite/Bewertung, Abschlussmonat */
const SEEDS: Seed[] = [
  [
    'Der Name des Windes',
    'Patrick Rothfuss',
    12619682,
    '9783608938159',
    736,
    2007,
    'OL8479867W',
    'reading',
    214,
  ],
  [
    'Der Astronaut',
    'Andy Weir',
    14615813,
    '9783453322837',
    496,
    2021,
    'OL21745884W',
    'reading',
    401,
  ],
  [
    'Die Mitternachtsbibliothek',
    'Matt Haig',
    11182315,
    '9783426282564',
    304,
    2020,
    'OL20965973W',
    'reading',
    38,
  ],
  [
    'Der Letzte Wunsch',
    'Andrzej Sapkowski',
    15239396,
    '9783423262644',
    342,
    1993,
    'OL2577482W',
    'completed',
    9,
    '2026-01-14',
  ],
  [
    'Das Erbe der Elfen',
    'Andrzej Sapkowski',
    9354968,
    '9783423247009',
    379,
    1994,
    'OL2577486W',
    'completed',
    8,
    '2026-02-20',
  ],
  [
    'Die Zeit der Verachtung',
    'Andrzej Sapkowski',
    14425809,
    '9783423262453',
    331,
    1995,
    'OL2577481W',
    'completed',
    10,
    '2026-04-02',
  ],
  [
    'Der Schwarm',
    'Frank Schätzing',
    13011325,
    '9783462033748',
    898,
    2004,
    'OL276211W',
    'completed',
    7,
    '2026-06-11',
  ],
  [
    'Tschick',
    'Wolfgang Herrndorf',
    8418261,
    '9783871347108',
    248,
    2010,
    'OL16621819W',
    'completed',
    9,
    '2026-07-03',
  ],
  [
    'QualityLand',
    'Marc-Uwe Kling',
    10478960,
    '9783548291888',
    371,
    2017,
    'OL19792034W',
    'completed',
    8,
    '2026-08-19',
  ],
  [
    'Der Kleine Hobbit',
    'J.R.R. Tolkien',
    14626130,
    '9783423202770',
    310,
    1937,
    'OL27482W',
    'completed',
    10,
    '2026-09-24',
  ],
  ['Momo', 'Michael Ende', 14571396, '9783522202756', 269, 1973, 'OL2271626W', 'completed', 9],
  [
    'Harry Potter und der Stein der Weisen',
    'J. K. Rowling',
    15157474,
    '9783551313119',
    302,
    1997,
    'OL82563W',
    'completed',
    8,
  ],
  [
    'Die Tribute von Panem',
    'Suzanne Collins',
    12878037,
    '9783841501349',
    397,
    2008,
    'OL5735363W',
    'planned',
  ],
  [
    'Der Wüstenplanet',
    'Frank Herbert',
    6390607,
    '9783453186835',
    608,
    1965,
    'OL893414W',
    'planned',
  ],
  [
    'Die Herren von Winterfell',
    'George R. R. Martin',
    14430493,
    '9783442267743',
    571,
    1997,
    'OL1955907W',
    'planned',
  ],
];

function buildBooks(): Book[] {
  return SEEDS.map(([title, author, coverId, isbn, pages, year, ol, status, extra, done], i) => ({
    id: `ol-${ol}`,
    title,
    authors: [author],
    cover: cover(coverId),
    isbn13: isbn,
    pageCount: pages,
    publishedYear: year,
    olWorkId: ol,
    source: 'openlibrary' as const,
    status,
    currentPage: status === 'reading' ? (extra ?? 0) : status === 'completed' ? pages : 0,
    rating: status === 'completed' ? (extra ?? 0) : undefined,
    addedAt: new Date(2026, 0, 2 + i).toISOString(),
    startedAt: status !== 'planned' ? new Date(2026, 8, 20 + i).toISOString() : undefined,
    lastReadAt:
      status === 'reading' ? new Date(Date.now() - i * 3_600_000 * 20).toISOString() : undefined,
    completedAt: done ? new Date(`${done}T18:00:00`).toISOString() : undefined,
    categories: i % 2 ? ['Fantasy'] : ['Science Fiction', 'Roman'],
    wishedAt:
      status === 'planned' && i % 2 === 0 ? new Date(2026, 9, 1 + i).toISOString() : undefined,
  }));
}

const fakeUser = {
  uid: 'preview-user',
  displayName: 'Bärbel',
  photoURL: null,
} as unknown as firebase.User;

const SHOWS: { id: number; kind: 'tv' | 'movie'; title: string }[] = [
  { id: 71912, kind: 'tv', title: 'The Witcher' },
  { id: 1399, kind: 'tv', title: 'Game of Thrones' },
  { id: 91239, kind: 'tv', title: 'Bridgerton' },
  { id: 56570, kind: 'tv', title: 'Outlander' },
  { id: 438631, kind: 'movie', title: 'Dune' },
  { id: 550, kind: 'movie', title: 'Fight Club' },
];

const BooksPreviewShell = ({
  children,
  empty,
  extra,
}: {
  children: React.ReactNode;
  empty?: boolean;
  extra?: Book[];
}) => {
  const books = useMemo(() => (empty ? [] : [...(extra ?? []), ...buildBooks()]), [empty, extra]);
  const [posters, setPosters] = useState<Record<number, string>>({});

  useEffect(() => {
    let alive = true;
    void Promise.all(
      SHOWS.map(async (s) => {
        const data = await tmdbFetch<{ poster_path?: string }>(`${s.kind}/${s.id}`).catch(
          () => null
        );
        return [s.id, data?.poster_path ?? ''] as const;
      })
    ).then((list) => alive && setPosters(Object.fromEntries(list)));
    return () => {
      alive = false;
    };
  }, []);

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
  const bookCtx = useMemo(
    () => ({
      bookList: books,
      allBookList: books,
      hiddenBookList: [],
      loading: false,
      refetchBooks: () => {},
      isOffline: false,
      isStale: false,
    }),
    [books]
  );
  const seriesCtx = useMemo(
    () =>
      ({
        seriesList: SHOWS.filter((s) => s.kind === 'tv').map((s) => ({
          id: s.id,
          title: s.title,
          poster: { poster: posters[s.id] || '' },
        })),
      }) as unknown as React.ContextType<typeof SeriesListContext>,
    [posters]
  );
  const movieCtx = useMemo(
    () =>
      ({
        movieList: SHOWS.filter((s) => s.kind === 'movie').map((s) => ({
          id: s.id,
          title: s.title,
          poster: { poster: posters[s.id] || '' },
        })),
        loading: false,
        refetchMovies: () => {},
        isOffline: false,
        isStale: false,
      }) as unknown as React.ContextType<typeof MovieListContext>,
    [posters]
  );

  return (
    <AuthContext.Provider value={auth}>
      <SeriesListContext.Provider value={seriesCtx}>
        <MovieListContext.Provider value={movieCtx}>
          <BooksListContext.Provider value={bookCtx}>
            <div className="mobile-content" style={{ height: '100vh', overflowY: 'auto' }}>
              {children}
            </div>
          </BooksListContext.Provider>
        </MovieListContext.Provider>
      </SeriesListContext.Provider>
    </AuthContext.Provider>
  );
};

export const BooksOverviewPreview = () => (
  <BooksPreviewShell>
    <BooksPage />
  </BooksPreviewShell>
);

export const BooksEmptyPreview = () => (
  <BooksPreviewShell empty>
    <BooksPage />
  </BooksPreviewShell>
);

export const BookDetailPreview = () => {
  const index = Number(new URLSearchParams(window.location.search).get('i') || '0');
  const seed = SEEDS[Math.min(index, SEEDS.length - 1)];
  return (
    <BooksPreviewShell>
      <Routes location={`/dev/ui-preview/books/ol-${seed[6]}`}>
        <Route path="books/:bookId" element={<BookDetailPage />} />
      </Routes>
    </BooksPreviewShell>
  );
};

const MANGA_VOLUME: Book = {
  id: 'gb-onepiece-18',
  title: 'One Piece 18',
  subtitle: 'Piraten, Abenteuer und der größte Schatz der Welt!',
  authors: ['Eiichiro Oda'],
  publisher: 'Carlsen Manga',
  categories: ['Comics & Graphic Novels'],
  isbn13: '9783646704389',
  pageCount: 224,
  publishedYear: 2015,
  source: 'google',
  status: 'completed',
  currentPage: 224,
  addedAt: '2026-10-10T12:00:00.000Z',
};

const MANGA_VOLUME_LIST = [MANGA_VOLUME];

/** Ein Manga-Band, der schon als Buch gespeichert ist — Detailseite bietet den Wechsel zum Manga an. */
export const BookDetailMangaPreview = () => (
  <BooksPreviewShell extra={MANGA_VOLUME_LIST}>
    <Routes location={`/dev/ui-preview/books/${MANGA_VOLUME.id}`}>
      <Route path="books/:bookId" element={<BookDetailPage />} />
    </Routes>
  </BooksPreviewShell>
);

export const BookSearchPreview = () => (
  <BooksPreviewShell>
    <BookSearchPage />
  </BooksPreviewShell>
);

export const BookShelfPreview = () => (
  <BooksPreviewShell>
    <BookShelfPage />
  </BooksPreviewShell>
);

export const FriendBooksInsightsPreview = () => {
  const books = useMemo(() => buildBooks(), []);
  return (
    <BooksPreviewShell>
      <div style={{ padding: '24px 16px' }}>
        <FriendBooksInsights friendName="Florian" books={books} />
      </div>
    </BooksPreviewShell>
  );
};

export const BookStatsPreview = () => (
  <BooksPreviewShell>
    <BookStatsPage />
  </BooksPreviewShell>
);

export const BookImportPreview = () => (
  <BooksPreviewShell>
    <BookImportPage />
  </BooksPreviewShell>
);

export const ReadingHubPreview = () => (
  <BooksPreviewShell>
    <ReadingHubPage />
  </BooksPreviewShell>
);

const PREVIEW_AVATAR = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b8def"/><stop offset="1" stop-color="#9b5de5"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="17" fill="#f1d3b8"/><path d="M18 100c4-22 18-32 32-32s28 10 32 32Z" fill="#f1d3b8"/></svg>'
)}`;

/** Flos Münze; Klick spielt sie erneut. Bild-Variante: eigenes Profilbild wie im Dock. */
export const CoinEggPreview = ({ photo = false }: { photo?: boolean }) => {
  const { user } = useAuth() || {};
  const ownPhoto = useOwnPhotoURL(user?.photoURL) || PREVIEW_AVATAR;
  const play = useCallback(
    () => showCoinEgg(photo ? { photoURL: ownPhoto, photoChance: 1 } : {}),
    [photo, ownPhoto]
  );
  useEffect(() => {
    let id = 0;
    const img = new Image();
    img.onload = img.onerror = () => {
      id = window.setTimeout(play, 300);
    };
    img.src = ownPhoto;
    return () => {
      img.onload = img.onerror = null;
      window.clearTimeout(id);
    };
  }, [play, ownPhoto]);
  return (
    <div onClick={play}>
      <BooksPreviewShell>
        <BooksPage />
      </BooksPreviewShell>
    </div>
  );
};
