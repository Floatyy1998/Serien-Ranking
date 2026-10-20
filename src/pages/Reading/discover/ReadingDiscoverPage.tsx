import { AutoStories, NewReleases, Search, Star, TrendingUp, Whatshot } from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState, PageHeader, PageLayout, SectionHeader } from '../../../components/ui';
import { LoadingSpinner } from '../../../components/ui/feedback/LoadingSpinner';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookShelves, useShelfMore, type ShelfRequest } from '../../../hooks/books/useBookShelf';
import { useMangaForBook, useOwnedBooks } from '../../../hooks/books/useOwnedBooks';
import { useDeviceType } from '../../../hooks/platform/useDeviceType';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { curateShelf } from '../../../lib/books/discoverMix';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import {
  chartFilters,
  chartMedia,
  interleaveStable,
  roundRobin,
  type ChartFilter,
} from '../../../lib/reading/discoverCharts';
import { ANILIST_GENRE_FOR } from '../../../lib/reading/genreMap';
import { suggestionAreas } from '../../../lib/reading/readingMedium';
import { discoverManga, type DiscoverCategory } from '../../../services/api/anilistService';
import type { ShelfId } from '../../../services/api/bookDiscovery';
import { t } from '../../../services/i18n';
import type { BookSearchResult } from '../../../types/Book';
import type { AniListMangaSearchResult, Manga } from '../../../types/Manga';
import '../../Books/components/books.css';
import { GenreTiles, useOpenResult } from '../../Books/discover/DiscoverParts';
import { ShelfDedupeContext } from '../../Books/discover/discoverDedupe';
import '../../Books/discover/discover.css';
import { useAddFlow } from '../../Books/discover/useAddFlow';
import { useBookYear } from '../../Books/hooks/useBookYear';
import { useBookSections } from '../../Books/useBookSections';
import { MangaPosterCard } from '../../Manga/components/MangaPosterCard';
import '../../Manga/components/MangaCards.css';
import { useAddManga } from '../../Manga/useAddManga';
import '../ReadingPage.css';
import { ForYouMixedRow, GenreMixedRow, NewMixedRow } from './MixedDiscover';
import './ReadingDiscoverPage.css';

const CATEGORIES: { id: DiscoverCategory; label: () => string; icon: ReactNode }[] = [
  { id: 'trending', label: () => t('Trend'), icon: <TrendingUp style={{ fontSize: 18 }} /> },
  { id: 'popular', label: () => t('Beliebt'), icon: <Whatshot style={{ fontSize: 18 }} /> },
  { id: 'top_rated', label: () => t('Top bewertet'), icon: <Star style={{ fontSize: 18 }} /> },
  { id: 'upcoming', label: () => t('Bald'), icon: <NewReleases style={{ fontSize: 18 }} /> },
];

const FILTER_LABEL: Record<ChartFilter, () => string> = {
  all: () => t('Alle'),
  books: () => t('Bücher'),
  JP: () => 'Manga',
  KR: () => 'Manhwa',
  CN: () => 'Manhua',
};

const CHART_SHELVES: ShelfId[] = ['fantasy', 'thriller', 'romance', 'scifi', 'ya', 'classics'];
const MANGA_PAGE = 30;
const MIN_RATINGS = 5;

const bookScore = (r: BookSearchResult) =>
  r.avgRating && (r.ratingCount ?? 0) >= MIN_RATINGS ? (r.avgRating * 2).toFixed(1) : undefined;

const bookRequests = (category: DiscoverCategory): ShelfRequest[] => {
  if (category === 'trending') return [{ id: 'new', sort: 'popular', limit: 80 }];
  if (category === 'upcoming') return [];
  const sort = category === 'top_rated' ? 'top' : 'popular';
  return CHART_SHELVES.map((id) => ({ id, sort }));
};

interface MangaChart {
  key: string;
  results: AniListMangaSearchResult[];
  page: number;
  hasNext: boolean;
}

/** AniList-Charts mit Seiten; lädt nur, wenn Manga im Chart vorkommen. */
function useMangaChart(category: DiscoverCategory, country: string, enabled: boolean) {
  const key = `${category}|${country}`;
  const [chart, setChart] = useState<MangaChart | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    discoverManga(category, 1, MANGA_PAGE, country)
      .then(({ results, hasNextPage }) => {
        if (alive) setChart({ key, results, page: 1, hasNext: hasNextPage });
      })
      .catch(() => {
        if (alive) setChart({ key, results: [], page: 1, hasNext: false });
      });
    return () => {
      alive = false;
    };
  }, [category, country, enabled, key]);

  const current = enabled && chart?.key === key ? chart : null;

  const fetchMore = useCallback(() => {
    if (!current || !current.hasNext || busyRef.current) return;
    busyRef.current = true;
    setLoadingMore(true);
    const next = current.page + 1;
    discoverManga(category, next, MANGA_PAGE, country)
      .then(({ results, hasNextPage }) =>
        setChart((prev) => {
          if (!prev || prev.key !== key || prev.page + 1 !== next) return prev;
          const seen = new Set(prev.results.map((m) => m.id));
          return {
            key,
            results: [...prev.results, ...results.filter((m) => !seen.has(m.id))],
            page: next,
            hasNext: hasNextPage,
          };
        })
      )
      .catch((error) => console.error('Weitere Manga konnten nicht geladen werden:', error))
      .finally(() => {
        busyRef.current = false;
        setLoadingMore(false);
      });
  }, [current, category, country, key]);

  return {
    results: current?.results ?? [],
    loading: enabled && !current,
    done: !enabled || (!!current && !current.hasNext),
    loadingMore,
    fetchMore,
  };
}

type ChartEntry =
  { kind: 'book'; book: BookSearchResult } | { kind: 'manga'; manga: AniListMangaSearchResult };

const ChartSkeleton = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="mpc" aria-hidden>
        <div className="mpc-art" />
      </div>
    ))}
  </>
);

/** Entdecken für Bücher und Manga: Charts oben, darunter die gemischten Reihen. */
export const ReadingDiscoverPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { isMobile } = useDeviceType();
  const areas = useReadingAreas();
  const { bookList, loading: booksLoading } = useBooksList();
  const { mangaList, hiddenMangaList, loading: mangaLoading } = useMangaList();
  const bookYear = useBookYear();
  const books = useBookSections({ bookYear });
  const { openAdd, sheet: addSheet } = useAddFlow();
  const { add: addManga, addingId } = useAddManga();
  const openBook = useOpenResult();
  const ownedBook = useOwnedBooks();
  const mangaForBook = useMangaForBook();

  const loaded = !booksLoading && !mangaLoading;
  const suggest = suggestionAreas(areas, bookList.length > 0, mangaList.length > 0);

  const paramCategory = CATEGORIES.find((c) => c.id === params.get('category'))?.id;
  const full = !!paramCategory;
  const [localCategory, setLocalCategory] = useState<DiscoverCategory>('trending');
  const [filter, setFilter] = useState<ChartFilter>('all');
  const wanted = paramCategory ?? localCategory;
  const category = wanted === 'upcoming' && !suggest.manga ? 'trending' : wanted;
  const upcoming = category === 'upcoming';
  const filters = chartFilters(suggest, upcoming);
  const activeFilter = filters.includes(filter) ? filter : 'all';
  const media = chartMedia(activeFilter, suggest, upcoming);
  const country = activeFilter === 'all' || activeFilter === 'books' ? 'all' : activeFilter;

  const manga = useMangaChart(category, country, loaded && media.manga);
  const requests = useMemo(
    () => (loaded && media.books ? bookRequests(category) : []),
    [loaded, media.books, category]
  );
  const { lists, loading: shelvesLoading } = useBookShelves(requests, { eager: true });
  // Bücher blättern nur weiter, wenn keine Manga mehr nachkommen — sonst stünden sie ungenutzt hinten.
  const canPageBooks =
    full && category === 'trending' && requests.length > 0 && !shelvesLoading && manga.done;
  const {
    sentinelRef,
    items: moreBooks,
    loadingMore: moreBooksLoading,
    exhausted: booksExhausted,
  } = useShelfMore('new', { sort: 'popular' }, canPageBooks);

  const chartBooks = useMemo(() => {
    const merged =
      category === 'trending' ? [...(lists[0] ?? []), ...moreBooks] : roundRobin(lists);
    return curateShelf(merged, { isOwned: () => false, perAuthor: 1 }).items;
  }, [lists, moreBooks, category]);
  const booksDone = !requests.length || (!shelvesLoading && (!canPageBooks || booksExhausted));

  const ownedManga = useMemo(() => {
    const map = new Map<number, Manga>();
    for (const m of [...mangaList, ...hiddenMangaList]) map.set(m.anilistId, m);
    return map;
  }, [mangaList, hiddenMangaList]);

  const entries = useMemo(() => {
    const all = interleaveStable<ChartEntry, ChartEntry>(
      chartBooks.map((book) => ({ kind: 'book', book })),
      manga.results.map((m) => ({ kind: 'manga', manga: m })),
      booksDone,
      manga.done
    );
    return full ? all : all.slice(0, isMobile ? 6 : 12);
  }, [chartBooks, manga.results, manga.done, booksDone, full, isMobile]);

  const chartLoading = !loaded || manga.loading || (requests.length > 0 && shelvesLoading);

  const { fetchMore } = manga;
  useEffect(() => {
    if (!full) return;
    const container = document.querySelector('.mobile-content');
    if (!container) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (container.scrollHeight - container.scrollTop - container.clientHeight < 500) {
          fetchMore();
        }
      });
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [full, fetchMore]);

  const pickCategory = (id: DiscoverCategory) => {
    if (full) setParams({ category: id }, { replace: true });
    else setLocalCategory(id);
  };
  const openFull = () => setParams({ category });

  const genreShelves = suggest.books
    ? books.genres.shelves
    : books.genres.shelves.filter((id) => id in ANILIST_GENRE_FOR);

  const renderEntry = (entry: ChartEntry) => {
    if (entry.kind === 'book') {
      const r = entry.book;
      const owned = !!(ownedBook(r) || mangaForBook(r));
      return (
        <MangaPosterCard
          key={`b-${r.id}`}
          title={r.title}
          poster={coverAtSize(r.cover, 'M') || r.coverFallback || PLACEHOLDER_SVG}
          badge={t('Buch')}
          meta={r.authors?.[0]}
          score={bookScore(r)}
          owned={owned}
          action={
            owned
              ? undefined
              : { label: '+', ariaLabel: t('Buch hinzufügen'), onClick: () => openAdd(r) }
          }
          onClick={() => openBook(r)}
        />
      );
    }
    const m = entry.manga;
    const title = m.title.english || m.title.romaji;
    const owned = ownedManga.has(m.id);
    return (
      <MangaPosterCard
        key={`m-${m.id}`}
        title={title}
        poster={m.coverImage.large}
        format={m.format}
        countryOfOrigin={m.countryOfOrigin}
        meta={m.startDate?.year ? String(m.startDate.year) : undefined}
        score={m.averageScore ? (m.averageScore / 10).toFixed(1) : undefined}
        owned={owned}
        action={
          owned
            ? undefined
            : {
                label: '+',
                ariaLabel: t('{title} zur Sammlung hinzufügen', { title }),
                disabled: addingId === m.id,
                onClick: () => void addManga(m),
              }
        }
        onClick={() => navigate(`/manga/${m.id}`)}
      />
    );
  };

  return (
    <PageLayout>
      <PageHeader
        title={t('Entdecken')}
        subtitle={
          full
            ? CATEGORIES.find((c) => c.id === category)?.label()
            : suggest.books && suggest.manga
              ? t('Bücher und Manga')
              : undefined
        }
        icon={<AutoStories />}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        actions={
          <button
            type="button"
            className="bk-icon-btn"
            aria-label={areas === 'manga' ? t('Manga suchen') : t('Buch suchen')}
            onClick={() => navigate(areas === 'manga' ? '/manga/search' : '/books/search')}
            style={{ color: currentTheme.text.secondary }}
          >
            <Search />
          </button>
        }
      />

      <section className="manga-section rdc-charts">
        {!full && (
          <SectionHeader
            icon={<TrendingUp />}
            iconColor={currentTheme.primary}
            title={t('Charts')}
            onSeeAll={openFull}
            seeAllLabel={t('Alle')}
          />
        )}
        <div className="rdc-tabs" role="tablist" aria-label={t('Charts')}>
          {CATEGORIES.filter((c) => c.id !== 'upcoming' || suggest.manga).map((c) => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`rdc-tab${active ? ' rdc-tab--active' : ''}`}
                onClick={() => pickCategory(c.id)}
              >
                {c.icon}
                {c.label()}
              </button>
            );
          })}
        </div>
        {filters.length > 0 && (
          <div className="manga-pill-row rdc-filters">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={f === activeFilter}
                className={`manga-pill ${f === activeFilter ? 'manga-pill--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {FILTER_LABEL[f]()}
              </button>
            ))}
          </div>
        )}

        {chartLoading && entries.length === 0 ? (
          <div className="manga-result-grid rdc-grid">
            <ChartSkeleton count={isMobile ? 6 : 12} />
          </div>
        ) : entries.length > 0 ? (
          <div className="manga-result-grid rdc-grid">{entries.map(renderEntry)}</div>
        ) : (
          <EmptyState
            icon={<AutoStories style={{ fontSize: 44 }} />}
            title={t('Nichts gefunden')}
            description={t('In dieser Kategorie gibt es gerade nichts zu entdecken.')}
          />
        )}
        <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
        {full && (manga.loadingMore || moreBooksLoading) && (
          <LoadingSpinner text={t('Mehr laden...')} />
        )}
        {!full && entries.length > 0 && (
          <button
            type="button"
            className="bk-chip-btn rdc-more"
            onClick={openFull}
            style={{ color: currentTheme.text.secondary }}
          >
            {t('Mehr anzeigen')}
          </button>
        )}
      </section>

      {!full && loaded && (
        <ShelfDedupeContext.Provider value={books.dedupe}>
          <NewMixedRow showBooks={suggest.books} showManga={suggest.manga} />
          <ForYouMixedRow
            showBooks={suggest.books}
            showManga={suggest.manga}
            genres={books.genres.favorite}
            caption={books.genres.caption}
            onEditGenres={books.genres.edit}
          />
          <GenreTiles
            preferred={books.genres.picked}
            onEditFavorites={books.genres.edit}
            onOpenGenre={(genre) => navigate(`/reading/genre/${genre}`)}
            only={suggest.books ? undefined : Object.keys(ANILIST_GENRE_FOR)}
          />
          {genreShelves.map((genre) => (
            <GenreMixedRow
              key={genre}
              id={genre}
              showBooks={suggest.books}
              showManga={suggest.manga}
            />
          ))}
        </ShelfDedupeContext.Provider>
      )}

      <div style={{ height: 'var(--page-bottom-gap)' }} />
      {addSheet}
      {books.sheets}
    </PageLayout>
  );
};
