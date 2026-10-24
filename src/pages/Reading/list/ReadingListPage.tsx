import { AutoStories, FilterList } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BackButton,
  EmptyState,
  GradientText,
  LoadingSpinner,
  PageLayout,
  SwipeableEpisodeRow,
} from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDeviceType } from '../../../hooks/platform/useDeviceType';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { remainingHours, remainingPages } from '../../../lib/books/bookProgress';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import { mangaRemainingLabel, mangaStand, mangaStandLabel } from '../../../lib/manga/progress';
import { tapScale } from '../../../lib/motion';
import {
  filterReadingList,
  parseReadingListFormat,
  parseReadingListSort,
  readingListEntries,
  readingListFormats,
  type ReadingListEntry,
  type ReadingListFormat,
  type ReadingListSort,
} from '../../../lib/reading/readingList';
import { usesArea } from '../../../lib/reading/readingMedium';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { BookCover } from '../../Books/components/BookCover';
import { bookPath, formatHours } from '../../Books/helpers';
import { useBookActions } from '../../Books/hooks/useBookActions';
import {
  getDisplayFormat,
  getDisplayFormatKey,
  inferStatus,
  STATUS_COLORS,
} from '../../Manga/mangaUtils';
import { saveReadProgress } from '../../Manga/saveReadProgress';

const BOOK_STEP = 10;
const SORT_KEY = 'readingListSort';
const FORMAT_KEY = 'readingListFormat';

const SORT_LABELS: Record<ReadingListSort, () => string> = {
  'name-asc': () => 'Name A-Z',
  'name-desc': () => 'Name Z-A',
  'progress-desc': () => t('Fortschritt ↓'),
  'progress-asc': () => t('Fortschritt ↑'),
  'recent-desc': () => t('Zuletzt gelesen'),
};
const SORTS = Object.keys(SORT_LABELS) as ReadingListSort[];

const FORMAT_LABELS: Record<ReadingListFormat, () => string> = {
  all: () => t('Alle'),
  books: () => t('Bücher'),
  MANGA: () => 'Manga',
  MANHWA: () => 'Manhwa',
  MANHUA: () => 'Manhua',
};

// Übernimmt beim ersten Besuch den Wert der alten Manga-Leseliste.
const readStored = (key: string, legacy: string): string | null => {
  try {
    return localStorage.getItem(key) ?? localStorage.getItem(legacy);
  } catch {
    return null;
  }
};

const formatKeyOf = (m: Manga) => getDisplayFormatKey(m.countryOfOrigin, m.format);

/** Leseliste: alles, was du liest oder lesen willst — Bücher und Manga gemischt, Wischen = weiterlesen. */
export const ReadingListPage = () => {
  const { user } = useAuth() || {};
  const { bookList, loading: booksLoading } = useBooksList();
  const { mangaList, loading: mangaLoading } = useMangaList();
  const areas = useReadingAreas();
  const actions = useBookActions();
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [showFilter, setShowFilter] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [sortOption, setSortOption] = useState<ReadingListSort>(
    () => parseReadingListSort(readStored(SORT_KEY, 'mangaReadingListSort')) ?? 'recent-desc'
  );
  const [formatFilter, setFormatFilter] = useState<ReadingListFormat>(
    () => parseReadingListFormat(readStored(FORMAT_KEY, 'mangaReadingListFormat')) ?? 'all'
  );

  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsets, setDragOffsets] = useState<Record<string, number>>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => setDebouncedFilter(filterInput));
    }, 250);
    return () => clearTimeout(timer);
  }, [filterInput]);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sortOption);
      localStorage.setItem(FORMAT_KEY, formatFilter);
    } catch {
      /* Speicher gesperrt — Auswahl gilt nur für diesen Besuch */
    }
  }, [sortOption, formatFilter]);

  const booksOn = usesArea(areas, 'books');
  const mangaOn = usesArea(areas, 'manga');

  const entries = useMemo(
    () => readingListEntries(booksOn ? bookList : [], mangaOn ? mangaList : [], formatKeyOf),
    [bookList, mangaList, booksOn, mangaOn]
  );
  const hasBooks = entries.some((e) => e.kind === 'book');
  const hasManga = entries.some((e) => e.kind === 'manga');
  const formats = readingListFormats(hasBooks, hasManga);
  const activeFormat = formats.includes(formatFilter) ? formatFilter : 'all';

  const items = useMemo(
    () =>
      filterReadingList(entries, {
        query: debouncedFilter,
        format: activeFormat,
        sort: sortOption,
      }),
    [entries, debouncedFilter, activeFormat, sortOption]
  );

  const markCompleting = useCallback((key: string, direction: 'left' | 'right') => {
    setSwipeDirections((prev) => ({ ...prev, [key]: direction }));
    setCompletingEpisodes((prev) => new Set(prev).add(key));
    setTimeout(() => {
      setCompletingEpisodes((prev) => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
    }, 250);
  }, []);

  const handleComplete = useCallback(
    async (entry: ReadingListEntry, direction: 'left' | 'right' = 'right') => {
      if (!user) return;
      if (entry.kind === 'book') {
        const { book } = entry;
        const page = book.currentPage || 0;
        if (book.pageCount && page >= book.pageCount) return;
        markCompleting(entry.key, direction);
        await actions.saveProgress(book, page + BOOK_STEP);
        return;
      }
      const { manga } = entry;
      const stand = mangaStand(manga);
      // Nie über das letzte erschienene Kapitel (bzw. den letzten Band) hinaus abhaken.
      if (stand.total && stand.current >= stand.total) return;
      markCompleting(entry.key, direction);
      await saveReadProgress(user.uid, manga, {
        next: stand.current + 1,
        previous: stand.current,
        total: stand.total || null,
      });
    },
    [user, actions, markCompleting]
  );

  const subtitle =
    hasBooks && !hasManga
      ? t('{n} Bücher zum Lesen', { n: items.length })
      : hasManga && !hasBooks
        ? t('{n} Manga zum Lesen', { n: items.length })
        : t('{n} Titel zum Lesen', { n: items.length });

  const emptyTitle = !mangaOn
    ? t('Keine Bücher zum Lesen')
    : !booksOn
      ? t('Keine Manga zum Lesen')
      : t('Nichts zum Lesen');
  const emptyText = !mangaOn
    ? t('Setze Bücher auf „Lese ich“ oder „Will ich lesen“, dann stehen sie hier.')
    : !booksOn
      ? t('Setze Manga auf „Lese ich“ oder „Geplant“, dann stehen sie hier.')
      : t('Setze Bücher oder Manga auf „Lese ich“ oder „Geplant“, dann stehen sie hier.');

  const loading = (booksOn && booksLoading) || (mangaOn && mangaLoading);

  const lineStyle = (size: number, color: string, extra?: CSSProperties) => ({
    fontSize: `${size}px`,
    margin: 0,
    color,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    ...extra,
  });

  const plannedBadge = (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 700,
        padding: '1px 5px',
        borderRadius: 4,
        marginLeft: 6,
        background: `${STATUS_COLORS.planned}20`,
        color: STATUS_COLORS.planned,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}
    >
      {t('Geplant')}
    </span>
  );

  const bookContent = (book: Book, planned: boolean) => {
    const page = book.currentPage || 0;
    const left = remainingPages(book);
    const hours = remainingHours(book);
    const done = left !== null && left <= 0;
    return {
      stand: book.pageCount
        ? t('S. {page} / {total}', { page, total: book.pageCount })
        : t('S. {page}', { page }),
      kind: t('Buch'),
      rest:
        left === null
          ? t('Seitenzahl unbekannt')
          : done
            ? t('Gelesen')
            : hours !== null && !planned
              ? `${t('{n} Seiten übrig', { n: left })} · ${formatHours(hours)}`
              : t('{n} Seiten übrig', { n: left }),
      canSwipe: !done,
    };
  };

  const mangaContent = (manga: Manga) => {
    const stand = mangaStand(manga);
    const caughtUp = stand.total > 0 && stand.current >= stand.total;
    const status = inferStatus(manga);
    return {
      stand: mangaStandLabel(manga, true),
      kind: caughtUp ? t('Aktuell') : getDisplayFormat(manga.countryOfOrigin, manga.format),
      rest:
        stand.remaining > 0
          ? stand.unit === 'volume'
            ? mangaRemainingLabel(stand)
            : t('{n} Kapitel übrig', { n: stand.remaining })
          : status === 'RELEASING'
            ? stand.unit === 'volume'
              ? t('Laufend · Wartet auf neue Bände')
              : t('Laufend · Wartet auf neue Kapitel')
            : status === 'HIATUS'
              ? t('Hiatus · Keine neuen Kapitel')
              : t('Fortschritt unbekannt'),
      canSwipe: !caughtUp,
    };
  };

  return (
    <PageLayout
      style={{
        height: 'var(--vh, 100dvh)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            padding: '20px',
            paddingTop: 'var(--nav-top)',
            background: `${currentTheme.background.default}90`,
            backdropFilter: 'var(--glass-filter-lg)',
            WebkitBackdropFilter: 'var(--glass-filter-lg)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <BackButton />
              <div>
                <GradientText
                  as="h1"
                  from={currentTheme.primary}
                  to={currentTheme.accent}
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                  }}
                >
                  {t('Leseliste')}
                </GradientText>
                <p
                  style={{
                    color: currentTheme.text.secondary,
                    fontSize: '14px',
                    margin: '4px 0 0 0',
                  }}
                >
                  {subtitle}
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              aria-label={t('Filter und Sortierung')}
              aria-expanded={showFilter}
              whileTap={tapScale}
              onClick={() => setShowFilter(!showFilter)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: showFilter
                  ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                  : 'rgba(255,255,255,0.05)',
                color: showFilter
                  ? getOptimalTextColor(currentTheme.primary)
                  : currentTheme.text.primary,
              }}
            >
              <FilterList />
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: 12 }}
              >
                <input
                  type="text"
                  placeholder={
                    hasBooks || !mangaOn ? t('Titel oder Autor suchen …') : t('Manga suchen...')
                  }
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.05)',
                    color: currentTheme.text.primary,
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                    marginBottom: 10,
                  }}
                />

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {SORTS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={sortOption === value}
                      onClick={() => startTransition(() => setSortOption(value))}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: 'none',
                        background:
                          sortOption === value
                            ? `${currentTheme.primary}25`
                            : 'rgba(255,255,255,0.05)',
                        color:
                          sortOption === value ? currentTheme.primary : currentTheme.text.secondary,
                        fontSize: 11,
                        fontWeight: sortOption === value ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {SORT_LABELS[value]()}
                    </button>
                  ))}
                </div>

                {formats.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {formats.map((f) => (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={activeFormat === f}
                        onClick={() => startTransition(() => setFormatFilter(f))}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 8,
                          border: `1px solid ${activeFormat === f ? currentTheme.primary : 'rgba(255,255,255,0.06)'}`,
                          background:
                            activeFormat === f ? `${currentTheme.primary}20` : 'transparent',
                          color:
                            activeFormat === f ? currentTheme.primary : currentTheme.text.secondary,
                          fontSize: 11,
                          fontWeight: activeFormat === f ? 600 : 400,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {FORMAT_LABELS[f]()}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        <div
          className="episodes-scroll-container hide-scrollbar"
          style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 100px' }}
        >
          {items.length === 0 ? (
            loading && entries.length === 0 ? (
              <LoadingSpinner text={t('Leseliste wird geladen …')} />
            ) : (
              <EmptyState
                icon={<AutoStories style={{ fontSize: 'inherit' }} />}
                title={entries.length > 0 ? t('Keine Treffer in dieser Liste') : emptyTitle}
                description={entries.length > 0 ? undefined : emptyText}
              />
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence mode="popLayout">
                {items.map((entry) => {
                  const { key, planned } = entry;
                  const isBook = entry.kind === 'book';
                  const info = isBook
                    ? bookContent(entry.book, planned)
                    : mangaContent(entry.manga);
                  const accent = planned ? STATUS_COLORS.planned : currentTheme.primary;

                  return (
                    <SwipeableEpisodeRow
                      key={key}
                      itemKey={key}
                      poster={
                        isBook
                          ? coverAtSize(entry.book.cover, 'M') || PLACEHOLDER_SVG
                          : entry.manga.poster
                      }
                      posterAlt={entry.title}
                      posterOverlay={
                        isBook ? (
                          <BookCover
                            book={entry.book}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              aspectRatio: 'auto',
                              pointerEvents: 'none',
                            }}
                          />
                        ) : undefined
                      }
                      accentColor={accent}
                      isCompleting={completingEpisodes.has(key)}
                      isSwiping={swipingEpisodes.has(key)}
                      dragOffset={dragOffsets[key] || 0}
                      swipeDirection={swipeDirections[key]}
                      canSwipe={info.canSwipe}
                      staysAfterComplete
                      onSwipeStart={() => setSwipingEpisodes((prev) => new Set(prev).add(key))}
                      onSwipeDrag={(offset) =>
                        setDragOffsets((prev) => ({ ...prev, [key]: offset }))
                      }
                      onSwipeEnd={() => {
                        setSwipingEpisodes((prev) => {
                          const s = new Set(prev);
                          s.delete(key);
                          return s;
                        });
                        setDragOffsets((prev) => ({ ...prev, [key]: 0 }));
                      }}
                      onComplete={(dir) => void handleComplete(entry, dir)}
                      onPosterClick={() =>
                        navigate(
                          entry.kind === 'book'
                            ? bookPath(entry.book.id)
                            : `/manga/${entry.manga.anilistId}`
                        )
                      }
                      action={null}
                      content={
                        <>
                          <h2
                            style={lineStyle(isMobile ? 13 : 16, 'inherit', {
                              fontWeight: 700,
                              margin: '0 0 2px 0',
                              letterSpacing: '-0.01em',
                            })}
                          >
                            {entry.title}
                          </h2>
                          <p
                            style={lineStyle(
                              isMobile ? 11 : 14,
                              planned ? STATUS_COLORS.planned : currentTheme.accent,
                              { fontWeight: 500 }
                            )}
                          >
                            {info.stand}
                            {' · '}
                            {info.kind}
                            {planned && plannedBadge}
                          </p>
                          <p
                            style={lineStyle(isMobile ? 10 : 13, currentTheme.text.secondary, {
                              margin: '2px 0 0 0',
                              opacity: 0.6,
                            })}
                          >
                            {info.rest}
                          </p>
                          <div
                            style={{
                              marginTop: 6,
                              height: 3,
                              background: 'rgba(255,255,255,0.08)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${entry.progress}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                          </div>
                        </>
                      }
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
