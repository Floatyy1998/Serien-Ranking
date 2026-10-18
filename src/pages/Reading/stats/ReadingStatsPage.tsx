import {
  AutoStories,
  ChevronLeft,
  ChevronRight,
  CollectionsBookmark,
  Devices,
  Insights,
  Person,
  Sell,
  Star,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, LoadingSpinner, PageHeader, PageLayout } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookEvents } from '../../../hooks/books/useBookEvents';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import { bookTotals, computeBookYearStats } from '../../../lib/books/bookStats';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import { mangaUnit, volumesLabel } from '../../../lib/manga/progress';
import { usesArea } from '../../../lib/reading/readingMedium';
import {
  computeReadingYearStats,
  READING_STATUSES,
  statusCounts,
  tally,
  topMangaByProgress,
  type ReadingStatus,
} from '../../../lib/reading/readingStats';
import { dateLocale, t } from '../../../services/i18n';
import { calculateMangaStats } from '../../../services/wrapped/manga';
import type { Book } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';
import { BookCover } from '../../Books/components/BookCover';
import { Bookshelf } from '../../Books/components/Bookshelf';
import '../../Books/components/books.css';
import { bookPath } from '../../Books/helpers';
import { mangaAsShelfBook } from '../../Books/hooks/useReadingOverview';
import { MonthBars, StatTile } from '../../Books/sections/BookStatsSection';
import { getDisplayFormat } from '../../Manga/mangaUtils';
import { BOOK_FORMAT_LABEL, STATUS_LABEL, genreLabel } from './data/statsLabels';
import { useMangaYearEvents } from './hooks/useMangaYearEvents';
import { RankCard, type RankItem } from './parts/RankCard';
import { StackedMonthBars, type BarSeries } from './parts/StackedMonthBars';
import './ReadingStatsPage.css';

const NO_BOOKS: Book[] = [];
const NO_MANGA: Manga[] = [];
/** Wie in Wrapped: ein Band zählt für die Reihenfolge wie neun Kapitel. */
const CHAPTERS_PER_VOLUME = 9;

const shelfHref = (b: Book) =>
  b.id.startsWith('manga-') ? `/manga/${b.id.slice(6)}` : bookPath(b.id);

const titleCount = (n: number) => (n === 1 ? t('1 Titel') : t('{n} Titel', { n }));

const mangaAmountLabel = (chapters: number, volumes: number) =>
  chapters > 0 ? t('{n} Kapitel', { n: chapters }) : volumesLabel(volumes);

/** Gemeinsame Lese-Statistik für Bücher und Manga: Lesejahr und Bibliothek. */
export const ReadingStatsPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const areas = useReadingAreas();
  const { bookList, loading: booksLoading } = useBooksList();
  const { mangaList, loading: mangaLoading } = useMangaList();
  const [now] = useState(() => Date.now());
  const currentYear = new Date(now).getFullYear();
  const [year, setYear] = useState(currentYear);
  const isCurrent = year === currentYear;
  const currentMonth = isCurrent ? new Date(now).getMonth() : undefined;

  const showBooks = usesArea(areas, 'books') && bookList.length > 0;
  const showManga = usesArea(areas, 'manga') && mangaList.length > 0;
  const books = showBooks ? bookList : NO_BOOKS;
  const manga = showManga ? mangaList : NO_MANGA;

  const { events: bookEvents } = useBookEvents(showBooks ? [year] : []);
  const { events: mangaEvents } = useMangaYearEvents(year, showManga);

  const bookStats = useMemo(
    () => computeBookYearStats(books, bookEvents, year, now),
    [books, bookEvents, year, now]
  );
  const stats = useMemo(
    () =>
      computeReadingYearStats({ books, bookEvents, manga, mangaEvents, uid, year, now }, bookStats),
    [books, bookEvents, manga, mangaEvents, uid, year, now, bookStats]
  );

  const topManga = useMemo<RankItem[]>(() => {
    const byId = new Map(manga.map((m) => [m.anilistId, m]));
    const open = (id: number) => () => navigate(`/manga/${id}`);
    const fromEvents = calculateMangaStats(mangaEvents, year)?.topManga ?? [];
    if (fromEvents.length > 0) {
      return fromEvents.map((m) => ({
        key: `m-${m.anilistId}`,
        label: byId.get(m.anilistId)?.title || m.title,
        detail: mangaAmountLabel(m.chapters, m.volumes ?? 0),
        amount: m.chapters + (m.volumes ?? 0) * CHAPTERS_PER_VOLUME,
        image: byId.get(m.anilistId)?.poster || PLACEHOLDER_SVG,
        onClick: open(m.anilistId),
      }));
    }
    return topMangaByProgress(stats.mangaRead).map((m) => {
      const byVolume = mangaUnit(m) === 'volume';
      return {
        key: `m-${m.anilistId}`,
        label: m.title,
        detail: byVolume
          ? volumesLabel(m.currentVolume || 0)
          : t('{n} Kapitel', { n: m.currentChapter }),
        amount: byVolume ? (m.currentVolume || 0) * CHAPTERS_PER_VOLUME : m.currentChapter,
        image: m.poster || PLACEHOLDER_SVG,
        onClick: open(m.anilistId),
      };
    });
  }, [manga, mangaEvents, year, stats.mangaRead, navigate]);

  const genres = useMemo<RankItem[]>(
    () =>
      stats.topGenres.map((g) => ({
        key: g.key,
        label: genreLabel(g.key),
        detail: titleCount(g.count),
        amount: g.count,
      })),
    [stats.topGenres]
  );

  const authors = useMemo<RankItem[]>(
    () =>
      bookStats.topAuthors.map((a) => ({
        key: a.name,
        label: a.name,
        detail: a.count === 1 ? t('1 Buch') : t('{n} Bücher', { n: a.count }),
        amount: a.count,
      })),
    [bookStats.topAuthors]
  );

  const shelf = useMemo(
    () =>
      [...bookStats.finishedBooks, ...stats.finishedManga.map(mangaAsShelfBook)].sort(
        (a, b) => new Date(a.completedAt || 0).getTime() - new Date(b.completedAt || 0).getTime()
      ),
    [bookStats.finishedBooks, stats.finishedManga]
  );

  const library = useMemo(() => {
    const totals = bookTotals(books);
    const status = statusCounts(books, manga);
    const formats = tally([
      ...books.map((b) => `b:${b.format ?? 'print'}`),
      ...manga.map((m) => `m:${getDisplayFormat(m.countryOfOrigin, m.format)}`),
    ]);
    return {
      booksRead: totals.booksRead,
      pagesRead: totals.pagesRead,
      chapters: manga.reduce((sum, m) => sum + (m.currentChapter || 0), 0),
      volumes: manga.reduce((sum, m) => sum + (m.currentVolume || 0), 0),
      status,
      statusTotal: books.length + manga.length,
      formats,
      platforms: tally(
        manga.map((m) => m.readingPlatform?.trim()),
        6
      ),
    };
  }, [books, manga]);

  const statusColor: Record<ReadingStatus, string> = {
    reading: currentTheme.primary,
    planned: currentTheme.text.muted,
    completed: currentTheme.status.success,
    paused: currentTheme.status.warning,
    dropped: currentTheme.status.error,
  };

  const formatLabel = (key: string) =>
    key.startsWith('b:')
      ? (BOOK_FORMAT_LABEL[key.slice(2) as keyof typeof BOOK_FORMAT_LABEL]?.() ?? key.slice(2))
      : key.slice(2);

  const header = (
    <PageHeader
      title={t('Lese-Statistik')}
      subtitle={t('Dein Lesejahr in Zahlen')}
      icon={<Insights />}
      gradientFrom={currentTheme.primary}
      gradientTo={currentTheme.accent}
    />
  );

  if (!showBooks && !showManga) {
    const loading =
      (usesArea(areas, 'books') && booksLoading) || (usesArea(areas, 'manga') && mangaLoading);
    return (
      <PageLayout>
        {header}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <EmptyState
            icon={<AutoStories />}
            title={t('Noch nichts gelesen')}
            description={t('Sobald du liest, siehst du hier dein Lesejahr in Zahlen.')}
            action={{ label: t('Zum Lesen'), onClick: () => navigate('/reading') }}
          />
        )}
      </PageLayout>
    );
  }

  const yearEmpty =
    stats.pagesRead === 0 &&
    stats.chaptersRead === 0 &&
    stats.volumesRead === 0 &&
    stats.booksFinished === 0 &&
    stats.mangaFinished === 0;
  const showVolumes = showManga && stats.volumesRead > 0;
  const longest = bookStats.longestBook;
  const longestBook = longest ? books.find((b) => b.id === longest.id) : undefined;

  const finishedSeries: BarSeries[] = [
    ...(showBooks
      ? [{ label: t('Bücher'), color: currentTheme.primary, values: stats.finishedBooksByMonth }]
      : []),
    ...(showManga
      ? [{ label: t('Manga'), color: currentTheme.accent, values: stats.finishedMangaByMonth }]
      : []),
  ];

  return (
    <PageLayout>
      {header}
      <div className="rs-body">
        <div className="rs-year">
          <button
            type="button"
            className="bk-icon-btn"
            onClick={() => setYear((y) => y - 1)}
            aria-label={t('Vorheriges Jahr')}
            style={{ color: currentTheme.text.secondary }}
          >
            <ChevronLeft />
          </button>
          <span className="rs-year-label" style={{ color: currentTheme.text.secondary }}>
            {year}
          </span>
          <button
            type="button"
            className="bk-icon-btn"
            onClick={() => setYear((y) => Math.min(currentYear, y + 1))}
            disabled={isCurrent}
            aria-label={t('Nächstes Jahr')}
            style={{ color: currentTheme.text.secondary, opacity: isCurrent ? 0.35 : 1 }}
          >
            <ChevronRight />
          </button>
        </div>

        {yearEmpty && (
          <p className="rs-hint" style={{ color: currentTheme.text.muted }}>
            {t('Für {year} gibt es noch keine Lese-Daten.', { year })}
          </p>
        )}

        <div className="bk-stat-grid">
          {showBooks && (
            <StatTile
              value={stats.booksFinished}
              label={t('Bücher beendet')}
              color={currentTheme.primary}
            />
          )}
          {showManga && (
            <StatTile
              value={stats.mangaFinished}
              label={t('Manga beendet')}
              color={currentTheme.accent}
            />
          )}
          {showBooks && (
            <StatTile
              value={stats.pagesRead.toLocaleString(dateLocale())}
              label={t('Seiten gelesen')}
            />
          )}
          {showManga && (
            <StatTile
              value={stats.chaptersRead.toLocaleString(dateLocale())}
              label={t('Kapitel gelesen')}
            />
          )}
          {showVolumes && (
            <StatTile
              value={stats.volumesRead.toLocaleString(dateLocale())}
              label={t('Bände gelesen')}
            />
          )}
          <StatTile value={stats.activeDays} label={t('Lesetage')} />
          {isCurrent && (
            <StatTile
              value={stats.streak}
              label={stats.streak === 1 ? t('Tag Lese-Serie') : t('Tage Lese-Serie')}
              color={stats.streak > 2 ? currentTheme.status.warning : undefined}
            />
          )}
          <StatTile
            value={
              stats.avgRating !== null
                ? stats.avgRating.toLocaleString(dateLocale(), { minimumFractionDigits: 1 })
                : '–'
            }
            label={
              stats.ratedCount > 0
                ? `${t('Ø Bewertung')} · ${t('{n} bewertet', { n: stats.ratedCount })}`
                : t('Ø Bewertung')
            }
          />
          {showBooks && (
            <StatTile
              value={stats.pagesPerDay.toLocaleString(dateLocale())}
              label={t('Seiten pro Tag')}
            />
          )}
          {showManga && (
            <StatTile
              value={stats.chaptersPerDay.toLocaleString(dateLocale())}
              label={t('Kapitel pro Tag')}
            />
          )}
        </div>

        <div className="bk-grid-2">
          {showBooks && (
            <div className="bk-card">
              <div className="rs-card-title" style={{ color: currentTheme.text.muted }}>
                {t('Seiten pro Monat')}
              </div>
              <MonthBars
                values={bookStats.pagesByMonth}
                color={currentTheme.primary}
                currentMonth={currentMonth}
              />
            </div>
          )}
          {showManga && (
            <div className="bk-card">
              <div className="rs-card-title" style={{ color: currentTheme.text.muted }}>
                {t('Kapitel pro Monat')}
              </div>
              <MonthBars
                values={stats.chaptersByMonth}
                color={currentTheme.accent}
                currentMonth={currentMonth}
              />
            </div>
          )}
          {showVolumes && (
            <div className="bk-card">
              <div className="rs-card-title" style={{ color: currentTheme.text.muted }}>
                {t('Bände pro Monat')}
              </div>
              <MonthBars
                values={stats.volumesByMonth}
                color={currentTheme.accent}
                currentMonth={currentMonth}
              />
            </div>
          )}
          <div className="bk-card">
            <div className="rs-card-title" style={{ color: currentTheme.text.muted }}>
              {t('Beendet pro Monat')}
            </div>
            <StackedMonthBars series={finishedSeries} currentMonth={currentMonth} />
          </div>
        </div>

        {longest && (
          <button
            type="button"
            className="bk-card rs-longest"
            onClick={() => navigate(bookPath(longest.id))}
          >
            {longestBook && <BookCover book={longestBook} width={56} />}
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span className="bk-source-kicker" style={{ color: currentTheme.status.warning }}>
                {t('Dickstes Buch')}
              </span>
              <span style={{ fontWeight: 800, color: currentTheme.text.secondary }}>
                {longest.title}
              </span>
              <span className="bk-muted" style={{ color: currentTheme.text.muted }}>
                {t('{n} Seiten', { n: longest.pages })}
              </span>
            </span>
          </button>
        )}

        <div className="bk-grid-2">
          <RankCard
            title={t('Lieblingsgenres')}
            icon={<Sell style={{ color: currentTheme.accent }} />}
            items={genres}
          />
          <RankCard
            title={t('Meistgelesene Autoren')}
            icon={<Person style={{ color: currentTheme.primary }} />}
            items={authors}
          />
          <RankCard
            title={t('Meistgelesene Manga')}
            icon={<AutoStories style={{ color: currentTheme.primary }} />}
            items={topManga}
          />
        </div>

        {shelf.length > 0 && (
          <div className="bk-card">
            <div className="rs-card-title" style={{ color: currentTheme.text.secondary }}>
              <Star style={{ color: currentTheme.status.warning }} />
              {t('Gelesen {year}', { year })}
            </div>
            <Bookshelf books={shelf} hrefFor={shelfHref} />
          </div>
        )}

        <div className="bk-divider rs-divider" style={{ color: currentTheme.text.muted }}>
          {t('Deine Bibliothek')}
        </div>

        <div className="bk-stat-grid">
          {showBooks && <StatTile value={library.booksRead} label={t('Bücher insgesamt')} />}
          {showBooks && (
            <StatTile
              value={library.pagesRead.toLocaleString(dateLocale())}
              label={t('Seiten insgesamt')}
            />
          )}
          {showManga && (
            <StatTile
              value={library.chapters.toLocaleString(dateLocale())}
              label={t('Gesamt Kapitel')}
            />
          )}
          {showManga && library.volumes > 0 && (
            <StatTile value={library.volumes.toLocaleString(dateLocale())} label={t('Bände')} />
          )}
        </div>

        <div className="bk-grid-2">
          <div className="bk-card">
            <div className="rs-card-title" style={{ color: currentTheme.text.secondary }}>
              <CollectionsBookmark style={{ color: currentTheme.primary }} />
              {t('Status-Verteilung')}
            </div>
            <div className="rs-status">
              {READING_STATUSES.filter((s) => library.status[s] > 0).map((s) => (
                <div key={s} className="rs-status-row">
                  <span className="rs-status-dot" style={{ background: statusColor[s] }} />
                  <span style={{ color: currentTheme.text.secondary }}>{STATUS_LABEL[s]()}</span>
                  <span className="rs-status-count" style={{ color: currentTheme.text.secondary }}>
                    {library.status[s]}
                  </span>
                  <span className="bk-progress" style={{ height: 5 }}>
                    <span
                      className="bk-progress-fill"
                      style={{
                        width: `${(library.status[s] / Math.max(1, library.statusTotal)) * 100}%`,
                        background: statusColor[s],
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {library.formats.length > 0 && (
            <div className="bk-card">
              <div className="rs-card-title" style={{ color: currentTheme.text.secondary }}>
                <AutoStories style={{ color: currentTheme.accent }} />
                {t('Formate')}
              </div>
              <div className="rs-chips">
                {library.formats.map((f) => (
                  <span
                    key={f.key}
                    className="rs-chip"
                    style={{ color: currentTheme.text.secondary }}
                  >
                    <strong>{f.count}</strong>
                    {formatLabel(f.key)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {library.platforms.length > 0 && (
            <div className="bk-card">
              <div className="rs-card-title" style={{ color: currentTheme.text.secondary }}>
                <Devices style={{ color: currentTheme.primary }} />
                {t('Lese-Plattformen')}
              </div>
              <div className="rs-chips">
                {library.platforms.map((p) => (
                  <span
                    key={p.key}
                    className="rs-chip"
                    style={{ color: currentTheme.text.secondary }}
                  >
                    <strong>{p.count}</strong>
                    {p.key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
