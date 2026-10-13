import { AutoStories, LocalLibrary, MenuBook } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText, HorizontalScrollContainer, SectionHeader } from '../../components/ui';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBooksForYourShows } from '../../hooks/books/useBasedOnBooks';
import { useBookEvents } from '../../hooks/books/useBookEvents';
import { sortByRecentActivity } from '../../lib/books/bookProgress';
import { computeBookYearStats } from '../../lib/books/bookStats';
import { tapScaleSmall } from '../../lib/motion';
import { dateLocale, t } from '../../services/i18n';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { Bookshelf } from './components/Bookshelf';
import { ProgressSheet } from './components/ProgressSheet';
import { ReadingSwitch } from '../../components/reading/ReadingSwitch';
import './components/books.css';
import { useBookActions } from './hooks/useBookActions';
import { StatTile } from './sections/BookStatsSection';
import { CurrentlyReadingSection } from './sections/CurrentlyReadingSection';
import { ForYourShowsSection } from './sections/ForYourShowsSection';

const mangaAsShelfBook = (m: Manga): Book => ({
  id: `manga-${m.anilistId}`,
  title: m.title,
  authors: [],
  cover: m.poster,
  status: 'completed',
  currentPage: 0,
  pageCount: m.volumes ? m.volumes * 190 : undefined,
  addedAt: m.addedAt ?? '',
  completedAt: m.completedAt,
  rating: m.rating ? Object.values(m.rating)[0] : undefined,
});

export const ReadingHubPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { bookList } = useBooksList();
  const { mangaList } = useMangaList();
  const actions = useBookActions();
  const [progressBook, setProgressBook] = useState<Book | null>(null);
  const [now] = useState(() => Date.now());
  const year = new Date(now).getFullYear();
  const { events } = useBookEvents([year]);
  const yearStats = useMemo(
    () => computeBookYearStats(bookList, events, year, now),
    [bookList, events, year, now]
  );
  const { suggestions } = useBooksForYourShows();

  const readingBooks = useMemo(
    () => sortByRecentActivity(bookList).filter((b) => b.status === 'reading'),
    [bookList]
  );
  const readingManga = useMemo(
    () =>
      mangaList
        .filter((m) => m.readStatus === 'reading')
        .sort(
          (a, b) => new Date(b.lastReadAt || 0).getTime() - new Date(a.lastReadAt || 0).getTime()
        )
        .slice(0, 16),
    [mangaList]
  );

  const mangaDoneThisYear = useMemo(
    () =>
      mangaList.filter(
        (m) =>
          m.readStatus === 'completed' &&
          m.completedAt &&
          new Date(m.completedAt).getFullYear() === year
      ),
    [mangaList, year]
  );

  const shelf = useMemo(() => {
    const books = bookList.filter((b) => b.status === 'completed');
    const manga = mangaList.filter((m) => m.readStatus === 'completed').map(mangaAsShelfBook);
    return [...books, ...manga]
      .sort(
        (a, b) =>
          new Date(a.completedAt || a.addedAt || 0).getTime() -
          new Date(b.completedAt || b.addedAt || 0).getTime()
      )
      .slice(-70);
  }, [bookList, mangaList]);

  const hrefFor = useCallback(
    (b: Book) =>
      b.id.startsWith('manga-') ? `/manga/${b.id.slice(6)}` : `/books/${encodeURIComponent(b.id)}`,
    []
  );

  const totalReading = readingBooks.length + readingManga.length;
  const chapters = mangaList.reduce((sum, m) => sum + (m.currentChapter || 0), 0);

  return (
    <div className="bk-page" style={{ background: currentTheme.background.default }}>
      <header className="bk-deck-wrap">
        <ReadingSwitch active="all" />
        <div className="bk-deck liquid-glass">
          <div
            className="bk-deck-glow"
            aria-hidden
            style={{
              background: `radial-gradient(ellipse, ${currentTheme.accent}30, transparent 70%)`,
            }}
          />
          <div className="bk-deck-top">
            <div style={{ minWidth: 0 }}>
              <GradientText
                as="h1"
                from={currentTheme.primary}
                to={currentTheme.accent}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 1.2vw + 16px, 30px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <AutoStories style={{ fontSize: '0.95em', color: currentTheme.primary }} />
                {t('Lesen')}
              </GradientText>
              <p className="bk-deck-sub" style={{ color: currentTheme.text.secondary }}>
                {t('Bücher und Manga an einem Ort')}
              </p>
            </div>
          </div>
          <div className="bk-deck-row">
            {[
              {
                key: 'books',
                icon: <LocalLibrary />,
                label: t('Bücher'),
                value: bookList.length,
                to: '/books',
              },
              {
                key: 'manga',
                icon: <MenuBook />,
                label: 'Manga',
                value: mangaList.length,
                to: '/manga',
              },
            ].map((tile) => (
              <motion.button
                key={tile.key}
                type="button"
                whileTap={tapScaleSmall}
                className="bk-pod"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                }}
                onClick={() => navigate(tile.to, { replace: true })}
              >
                <span style={{ color: currentTheme.primary, display: 'flex' }}>{tile.icon}</span>
                <span
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <span className="bk-pod-value" style={{ color: currentTheme.text.secondary }}>
                    {tile.value}
                  </span>
                  <span className="bk-pod-label" style={{ color: currentTheme.text.muted }}>
                    {tile.label}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      <section className="bk-section">
        <SectionHeader
          icon={<AutoStories />}
          iconColor={currentTheme.accent}
          title={t('Lesejahr {year}', { year })}
        />
        <div className="bk-pad">
          <div className="bk-stat-grid">
            <StatTile
              value={totalReading}
              label={t('Gerade am Lesen')}
              color={currentTheme.primary}
            />
            <StatTile
              value={yearStats.booksFinished + mangaDoneThisYear.length}
              label={t('Beendet {year}', { year })}
            />
            <StatTile
              value={yearStats.pagesRead.toLocaleString(dateLocale())}
              label={t('Buchseiten {year}', { year })}
            />
            <StatTile
              value={chapters.toLocaleString(dateLocale())}
              label={t('Manga-Kapitel gesamt')}
            />
          </div>
        </div>
      </section>

      <CurrentlyReadingSection
        books={readingBooks}
        title={t('Bücher weiterlesen')}
        onQuickAdd={(book, pages) =>
          void actions.saveProgress(book, (book.currentPage || 0) + pages)
        }
        onOpenProgress={setProgressBook}
      />

      {readingManga.length > 0 && (
        <section className="bk-section">
          <SectionHeader
            icon={<MenuBook />}
            iconColor={currentTheme.primary}
            title={t('Manga weiterlesen')}
            onSeeAll={() => navigate('/manga/reading-list')}
            seeAllLabel={t('Alle')}
          />
          <HorizontalScrollContainer scrollerClassName="bk-carousel">
            {readingManga.map((m) => (
              <button
                key={m.anilistId}
                type="button"
                className="bk-carousel-item"
                style={{ width: 118 }}
                onClick={() => navigate(`/manga/${m.anilistId}`)}
              >
                <span
                  style={{
                    aspectRatio: '2 / 3',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.06)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                  }}
                >
                  {m.poster && (
                    <img
                      src={m.poster}
                      alt=""
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  )}
                </span>
                <span className="bk-item-title" style={{ color: currentTheme.text.secondary }}>
                  {m.title}
                </span>
                <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
                  {m.chapters
                    ? t('Kap. {n} / {m}', { n: m.currentChapter || 0, m: m.chapters })
                    : t('Kap. {n}', { n: m.currentChapter || 0 })}
                </span>
              </button>
            ))}
          </HorizontalScrollContainer>
        </section>
      )}

      <ForYourShowsSection suggestions={suggestions} />

      {shelf.length > 0 && (
        <section className="bk-section">
          <SectionHeader
            icon={<LocalLibrary />}
            iconColor={currentTheme.status.warning}
            title={t('Dein Lese-Regal')}
          />
          <div className="bk-pad">
            <Bookshelf books={shelf} hrefFor={hrefFor} />
            <div className="bk-shelf-legend" style={{ color: currentTheme.text.muted }}>
              <span>{t('Bücher und abgeschlossene Manga, nach Lesedatum')}</span>
            </div>
          </div>
        </section>
      )}

      <ProgressSheet
        book={progressBook}
        onClose={() => setProgressBook(null)}
        onSave={(page, total) => {
          if (progressBook) void actions.saveProgress(progressBook, page, total);
          setProgressBook(null);
        }}
        onFinish={() => {
          if (progressBook) void actions.changeStatus(progressBook, 'completed');
          setProgressBook(null);
        }}
      />
    </div>
  );
};
