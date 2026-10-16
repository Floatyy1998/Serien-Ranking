import { AutoStories, LocalLibrary, MenuBook } from '@mui/icons-material';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { mangaStandLabel } from '../../../lib/manga/progress';
import { dateLocale, t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import { Bookshelf } from '../components/Bookshelf';
import { ProgressSheet } from '../components/ProgressSheet';
import '../components/books.css';
import { useBookActions } from '../hooks/useBookActions';
import type { ReadingOverview } from '../hooks/useReadingOverview';
import { StatTile } from './BookStatsSection';
import { CurrentlyReadingSection } from './CurrentlyReadingSection';
import { ForYourShowsSection } from './ForYourShowsSection';

/** Lesejahr, Weiterlesen (Bücher + Manga), Bücher zu deinen Serien und das Lese-Regal. */
export const ReadingOverviewSections = ({ data }: { data: ReadingOverview }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const actions = useBookActions();
  const [progressBook, setProgressBook] = useState<Book | null>(null);
  const { year, yearStats, readingBooks, readingManga, shelf } = data;

  const hrefFor = useCallback(
    (b: Book) =>
      b.id.startsWith('manga-') ? `/manga/${b.id.slice(6)}` : `/books/${encodeURIComponent(b.id)}`,
    []
  );

  return (
    <>
      <section className="bk-section">
        <SectionHeader
          icon={<AutoStories />}
          iconColor={currentTheme.accent}
          title={t('Lesejahr {year}', { year })}
        />
        <div className="bk-pad">
          <div className="bk-stat-grid">
            <StatTile
              value={data.totalReading}
              label={t('Gerade am Lesen')}
              color={currentTheme.primary}
            />
            <StatTile value={data.finishedThisYear} label={t('Beendet {year}', { year })} />
            <StatTile
              value={yearStats.pagesRead.toLocaleString(dateLocale())}
              label={t('Buchseiten {year}', { year })}
            />
            <StatTile
              value={data.chapters.toLocaleString(dateLocale())}
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
                  {mangaStandLabel(m, true)}
                </span>
              </button>
            ))}
          </HorizontalScrollContainer>
        </section>
      )}

      <ForYourShowsSection suggestions={data.suggestions} />

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
    </>
  );
};
