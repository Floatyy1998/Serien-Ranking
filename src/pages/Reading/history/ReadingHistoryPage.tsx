import { CheckCircle, Description, History, MenuBook, Replay } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageLayout, ScrollToTopButton, SkeletonListRow } from '../../../components/ui';
import { EmptyState } from '../../../components/ui/feedback/EmptyState';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookEvents } from '../../../hooks/books/useBookEvents';
import { useMangaReadEvents } from '../../../hooks/manga/useMangaReadEvents';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import {
  bookEntryLabel,
  buildReadingHistory,
  historyYears,
  type MangaHistoryEntry,
  type ReadingHistoryDay,
  type ReadingHistoryEntry,
} from '../../../lib/reading/readHistory';
import { usesArea } from '../../../lib/reading/readingMedium';
import { getMangaCovers } from '../../../services/api/anilistService';
import { dateLocale, t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import { bookPath } from '../../Books/helpers';
import { CARD_PRESS, CARD_SPRING, cardSurface, chipStyle } from '../../RecentlyWatched/cardStyles';
import { TimeRangeChips } from '../../RecentlyWatched/RecentlyWatchedComponents';
import '../../RecentlyWatched/RecentlyWatchedPage.css';

const TIME_RANGES = [
  { days: 7, label: t('7 Tage') },
  { days: 30, label: t('30 Tage') },
  { days: 90, label: t('3 Monate') },
  { days: 365, label: t('1 Jahr') },
];

const CHIP_ICON = { fontSize: '14px' };

function formatDay(date: number, now: number): string {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday.getTime() - date) / 86400000);
  if (days <= 0) return t('Heute');
  if (days === 1) return t('Gestern');
  return new Date(date).toLocaleDateString(dateLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function chapterLabel(entry: MangaHistoryEntry): string {
  if (entry.chapters === null) {
    if (!entry.toChapter) return '';
    return entry.imported
      ? t('Stand nachgetragen: Kap. {n}', { n: entry.toChapter })
      : t('Stand: Kap. {n}', { n: entry.toChapter });
  }
  if (
    entry.fromChapter !== null &&
    entry.toChapter !== null &&
    entry.toChapter > entry.fromChapter
  ) {
    return t('Kap. {a}–{b}', { a: entry.fromChapter, b: entry.toChapter });
  }
  return entry.toChapter !== null ? t('Kap. {n}', { n: entry.toChapter }) : '';
}

function volumeLabel(entry: MangaHistoryEntry): string {
  if (entry.toVolume === null) return '';
  if (entry.volumes === null) {
    return entry.volumesImported
      ? t('Stand nachgetragen: Bd. {n}', { n: entry.toVolume })
      : t('Stand: Bd. {n}', { n: entry.toVolume });
  }
  if (entry.fromVolume !== null && entry.toVolume > entry.fromVolume) {
    return t('Bd. {a}–{b}', { a: entry.fromVolume, b: entry.toVolume });
  }
  return t('Bd. {n}', { n: entry.toVolume });
}

const entryKey = (entry: ReadingHistoryEntry) =>
  entry.kind === 'book' ? `b-${entry.id}` : `m-${entry.anilistId}`;

const entryHref = (entry: ReadingHistoryEntry) => {
  if (entry.kind === 'manga') return `/manga/${entry.anilistId}`;
  return entry.id.startsWith('manga-') ? `/manga/${entry.id.slice(6)}` : bookPath(entry.id);
};

const entryPoster = (entry: ReadingHistoryEntry, covers: Record<number, string>) =>
  (entry.kind === 'book'
    ? coverAtSize(entry.cover, 'M')
    : entry.poster || covers[entry.anilistId]) || PLACEHOLDER_SVG;

const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' });

/** Tageskopf wie im Serien-Verlauf: Zeitstrahl-Punkt, Datum, Seiten und Kapitel. */
const DayHeader = ({ day, now }: { day: ReadingHistoryDay; now: number }) => {
  const { currentTheme } = useTheme();
  const title = formatDay(day.date, now);
  return (
    <div className={`rw-day${title === t('Heute') ? ' rw-day--today' : ''}`}>
      <span className="rw-day__dot" />
      <h2 className="rw-day__title" style={{ color: currentTheme.text.primary }}>
        {title}
      </h2>
      <div className="rw-day__counts">
        {day.pages > 0 && (
          <span className="rw-day__count" style={chipStyle(currentTheme.primary)}>
            {t('{n} S.', { n: day.pages.toLocaleString(dateLocale()) })}
          </span>
        )}
        {day.chapters > 0 && (
          <span className="rw-day__count" style={chipStyle(currentTheme.status.success)}>
            {t('{n} Kap.', { n: day.chapters })}
          </span>
        )}
        {day.volumes > 0 && (
          <span className="rw-day__count" style={chipStyle(currentTheme.accent)}>
            {t('{n} Bd.', { n: day.volumes })}
          </span>
        )}
      </div>
    </div>
  );
};

interface EntryCardProps {
  entry: ReadingHistoryEntry;
  book?: Book;
  covers: Record<number, string>;
  mixed: boolean;
  onOpen: () => void;
}

/** Ein Titel an einem Tag — Karte wie im Serien-Verlauf. */
const EntryCard = ({ entry, book, covers, mixed, onOpen }: EntryCardProps) => {
  const { currentTheme } = useTheme();
  const isBook = entry.kind === 'book';
  const color = isBook ? currentTheme.primary : currentTheme.status.success;
  const accent = isBook
    ? `linear-gradient(to bottom, ${currentTheme.primary}, ${currentTheme.accent})`
    : `linear-gradient(to bottom, ${currentTheme.status.success}, ${currentTheme.status.info.main})`;
  const progress = isBook
    ? bookEntryLabel(entry)
    : [chapterLabel(entry), volumeLabel(entry)].filter(Boolean).join(' · ');
  const imported = isBook ? entry.imported : entry.imported || entry.volumesImported;
  const gain = isBook
    ? entry.pages > 0
      ? `+${entry.pages}`
      : null
    : entry.chapters
      ? `+${entry.chapters}`
      : entry.volumes
        ? t('+{n} Bd.', { n: entry.volumes })
        : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={CARD_PRESS}
      transition={CARD_SPRING}
      role="button"
      tabIndex={0}
      aria-label={t('{title} öffnen', { title: entry.title })}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="rw-card"
      style={{ ...cardSurface(currentTheme), ['--rw-accent' as string]: accent }}
    >
      <img
        src={entryPoster(entry, covers)}
        alt=""
        loading="lazy"
        decoding="async"
        className="rw-card__poster"
      />

      <div className="rw-card__body">
        <h3 className="rw-card__title" style={{ color: currentTheme.text.primary }}>
          {entry.title}
        </h3>
        <p className="rw-card__sub" style={{ color: currentTheme.text.secondary }}>
          {[
            isBook ? book?.authors?.[0] : null,
            mixed ? (isBook ? t('Buch') : 'Manga') : null,
            timeOf(entry.lastAt),
          ]
            .filter(Boolean)
            .join(' • ')}
        </p>

        <div className="rw-card__chips">
          {progress && (
            <span className="rw-chip" style={chipStyle(imported ? currentTheme.text.muted : color)}>
              {isBook ? <Description style={CHIP_ICON} /> : <MenuBook style={CHIP_ICON} />}
              {progress}
            </span>
          )}
          {gain && !imported && (
            <span className="rw-chip" style={chipStyle(currentTheme.accent)}>
              {gain}
            </span>
          )}
          {isBook && entry.finished && (
            <span className="rw-chip" style={chipStyle(currentTheme.status.success)}>
              <CheckCircle style={CHIP_ICON} />
              {t('Beendet')}
            </span>
          )}
          {entry.reread && (
            <span className="rw-chip" style={chipStyle(currentTheme.primary)}>
              <Replay style={CHIP_ICON} />
              {t('Erneut')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/** Lese-Verlauf über Bücher und Manga — aufgebaut wie der Verlauf für Serien und Filme. */
export const ReadingHistoryPage = () => {
  const { currentTheme } = useTheme();
  const { allBookList, bookList } = useBooksList();
  const { mangaList, hiddenMangaList } = useMangaList();
  const areas = useReadingAreas();
  const navigate = useNavigate();
  const showBooks = usesArea(areas, 'books');
  const showManga = usesArea(areas, 'manga');
  const [rangeDays, setRangeDays] = useState(30);
  const [query, setQuery] = useState('');
  const [now] = useState(() => Date.now());
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(200);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.offsetHeight || 200);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const years = useMemo(
    () => (showBooks ? historyYears(now, rangeDays) : []),
    [showBooks, now, rangeDays]
  );
  const { events: bookEvents, loading: booksLoading } = useBookEvents(years);
  const { events: mangaEvents, loading: mangaLoading } = useMangaReadEvents(rangeDays, now);

  const books = allBookList?.length ? allBookList : bookList;
  const manga = useMemo(
    () => [...mangaList, ...(hiddenMangaList || [])],
    [mangaList, hiddenMangaList]
  );
  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  const history = useMemo(
    () =>
      buildReadingHistory({
        bookEvents,
        books,
        mangaEvents,
        manga,
        now,
        rangeDays,
        showBooks,
        showManga,
      }),
    [bookEvents, books, mangaEvents, manga, now, rangeDays, showBooks, showManga]
  );
  const loading = (showBooks && booksLoading) || (showManga && mangaLoading);

  // Manga ohne Bild in der Bibliothek (z. B. inzwischen entfernt): Cover einmal bei AniList holen.
  const [covers, setCovers] = useState<Record<number, string>>({});
  const missingCovers = useMemo(
    () =>
      history.days
        .flatMap((d) => d.entries)
        .filter((e): e is MangaHistoryEntry => e.kind === 'manga' && !e.poster && e.anilistId > 0)
        .map((e) => e.anilistId)
        .sort((a, b) => a - b)
        .join(','),
    [history]
  );
  useEffect(() => {
    if (!missingCovers) return;
    let alive = true;
    getMangaCovers(missingCovers.split(',').map(Number))
      .then((found) => alive && setCovers((prev) => ({ ...prev, ...found })))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [missingCovers]);

  const days = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return history.days;
    return history.days
      .map((day) => ({
        ...day,
        entries: day.entries.filter((e) => e.title.toLowerCase().includes(needle)),
      }))
      .filter((day) => day.entries.length > 0);
  }, [history, query]);

  const mixed = useMemo(
    () => new Set(history.days.flatMap((d) => d.entries.map((e) => e.kind))).size > 1,
    [history]
  );

  const headerChip = (color: string, icon: React.ReactNode, value: string) => (
    <div className="rw-chip" style={{ ...chipStyle(color), fontSize: '13px', padding: '5px 11px' }}>
      {icon}
      {value}
    </div>
  );

  return (
    <PageLayout
      gradientColors={[currentTheme.status.success, currentTheme.primary]}
      style={{ height: 'var(--vh, 100vh)', display: 'flex', flexDirection: 'column' }}
    >
      <div
        ref={headerRef}
        className="rw-fixed-header"
        style={{ background: `${currentTheme.background.default}ee` }}
      >
        <PageHeader
          title={t('Verlauf')}
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.status.success}
          sticky={false}
          actions={
            history.totalPages > 0 || history.totalChapters > 0 ? (
              <div style={{ display: 'flex', gap: 6 }}>
                {history.totalPages > 0 &&
                  headerChip(
                    currentTheme.primary,
                    <Description style={CHIP_ICON} />,
                    history.totalPages.toLocaleString(dateLocale())
                  )}
                {history.totalChapters > 0 &&
                  headerChip(
                    currentTheme.status.success,
                    <MenuBook style={CHIP_ICON} />,
                    history.totalChapters.toLocaleString(dateLocale())
                  )}
              </div>
            ) : undefined
          }
        />

        <div className="rw-search-bar">
          <input
            type="text"
            placeholder={t('Buch oder Manga suchen...')}
            aria-label={t('Buch oder Manga suchen')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rw-search-input"
            style={{
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.text.primary,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rw-search-clear"
              aria-label={t('Suche löschen')}
              style={{ color: currentTheme.text.muted }}
            />
          )}
        </div>

        <TimeRangeChips
          timeRanges={TIME_RANGES}
          daysToShow={rangeDays}
          onTimeRangeChange={setRangeDays}
        />
      </div>

      <div
        data-scrollable="reading-history"
        className="rw-scroll-container"
        style={{ top: headerHeight }}
      >
        <div className="rw-content-area">
          <AnimatePresence mode="wait">
            {loading && history.days.length === 0 ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="status"
                aria-label={t('Verlauf wird geladen …')}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <SkeletonListRow key={i} avatarShape="card" />
                ))}
              </motion.div>
            ) : days.length === 0 ? (
              <EmptyState
                key="empty"
                icon={<History style={{ fontSize: '48px' }} />}
                iconColor={currentTheme.text.muted}
                title={query ? t('Nichts gefunden') : t('Kein Lese-Verlauf')}
                description={
                  query
                    ? t('Keine Ergebnisse für "{query}"', { query })
                    : t(
                        'Hier siehst du, was du zuletzt gelesen hast, sobald du deinen Lesestand einträgst.'
                      )
                }
                action={
                  query
                    ? { label: t('Suche löschen'), onClick: () => setQuery('') }
                    : { label: t('Zum Lesen'), onClick: () => navigate('/reading') }
                }
              />
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {days.map((day, index) => (
                  <motion.div
                    key={day.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index, 8) * 0.05 }}
                    className="rw-group"
                  >
                    <DayHeader day={day} now={now} />
                    <div className="rw-cards">
                      {day.entries.map((entry) => (
                        <EntryCard
                          key={entryKey(entry)}
                          entry={entry}
                          book={entry.kind === 'book' ? bookById.get(entry.id) : undefined}
                          covers={covers}
                          mixed={mixed}
                          onOpen={() => navigate(entryHref(entry))}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
                <div className="rw-bottom-spacer" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ScrollToTopButton scrollContainerSelector='[data-scrollable="reading-history"]' />
    </PageLayout>
  );
};
