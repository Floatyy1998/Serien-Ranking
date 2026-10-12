import { ChevronLeft, ChevronRight, Insights, Person, Sell, Star } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useBooksList } from '../../contexts/BooksListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBookEvents } from '../../hooks/books/useBookEvents';
import { computeBookYearStats, type RankedName } from '../../lib/books/bookStats';
import { dateLocale, t } from '../../services/i18n';
import { BookCover } from './components/BookCover';
import { Bookshelf } from './components/Bookshelf';
import './components/books.css';
import { bookPath } from './helpers';
import { MonthBars, StatTile } from './sections/BookStatsSection';

const RankList: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: RankedName[];
  unit: (n: number) => string;
}> = ({ title, icon, items, unit }) => {
  const { currentTheme } = useTheme();
  if (items.length === 0) return null;
  const max = items[0].count;
  return (
    <div className="bk-card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 800,
          marginBottom: 12,
          color: currentTheme.text.secondary,
        }}
      >
        {icon}
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}
            >
              <span
                style={{
                  color: currentTheme.text.secondary,
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.name}
              </span>
              <span style={{ color: currentTheme.text.muted, flexShrink: 0 }}>
                {unit(item.count)}
              </span>
            </div>
            <div className="bk-progress" style={{ height: 5 }}>
              <div
                className="bk-progress-fill"
                style={{ width: `${(item.count / max) * 100}%`, background: currentTheme.accent }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BookStatsPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { bookList } = useBooksList();
  const [now] = useState(() => Date.now());
  const currentYear = new Date(now).getFullYear();
  const [year, setYear] = useState(currentYear);
  const { events } = useBookEvents([year]);
  const stats = useMemo(
    () => computeBookYearStats(bookList, events, year, now),
    [bookList, events, year, now]
  );
  const isCurrent = year === currentYear;

  const allTime = useMemo(() => {
    const done = bookList.filter((b) => b.status === 'completed');
    return {
      books: done.length,
      pages: done.reduce((sum, b) => sum + (b.pageCount ?? 0), 0),
    };
  }, [bookList]);

  return (
    <PageLayout>
      <PageHeader
        title={t('Lese-Statistik')}
        subtitle={t('Dein Lesejahr in Zahlen')}
        icon={<Insights />}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
      />
      <div
        style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingBottom: 'var(--page-bottom-gap)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button
            type="button"
            className="bk-icon-btn"
            onClick={() => setYear((y) => y - 1)}
            aria-label={t('Vorheriges Jahr')}
            style={{ color: currentTheme.text.secondary }}
          >
            <ChevronLeft />
          </button>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 24,
              color: currentTheme.text.secondary,
              minWidth: 70,
              textAlign: 'center',
            }}
          >
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

        <div className="bk-stat-grid">
          <StatTile
            value={stats.booksFinished}
            label={t('Bücher beendet')}
            color={currentTheme.primary}
          />
          <StatTile
            value={stats.pagesRead.toLocaleString(dateLocale())}
            label={t('Seiten gelesen')}
          />
          <StatTile
            value={stats.pagesPerDay.toLocaleString(dateLocale())}
            label={t('Seiten pro Tag')}
          />
          <StatTile value={stats.activeDays} label={t('Lesetage')} />
          {isCurrent && <StatTile value={stats.streak} label={t('Tage Lese-Serie')} />}
          <StatTile
            value={
              stats.avgRating !== null
                ? (stats.avgRating / 2).toLocaleString(dateLocale(), { maximumFractionDigits: 1 })
                : '–'
            }
            label={t('Ø Sterne')}
          />
          <StatTile value={allTime.books} label={t('Bücher insgesamt')} />
          <StatTile
            value={allTime.pages.toLocaleString(dateLocale())}
            label={t('Seiten insgesamt')}
          />
        </div>

        <div className="bk-grid-2">
          <div className="bk-card">
            <div
              className="bk-muted"
              style={{ color: currentTheme.text.muted, marginBottom: 10, fontWeight: 700 }}
            >
              {t('Seiten pro Monat')}
            </div>
            <MonthBars
              values={stats.pagesByMonth}
              color={currentTheme.primary}
              currentMonth={isCurrent ? new Date(now).getMonth() : undefined}
            />
          </div>
          <div className="bk-card">
            <div
              className="bk-muted"
              style={{ color: currentTheme.text.muted, marginBottom: 10, fontWeight: 700 }}
            >
              {t('Beendete Bücher pro Monat')}
            </div>
            <MonthBars
              values={stats.finishedByMonth}
              color={currentTheme.accent}
              currentMonth={isCurrent ? new Date(now).getMonth() : undefined}
            />
          </div>
        </div>

        {stats.longestBook && (
          <button
            type="button"
            className="bk-card bk-tap"
            onClick={() => navigate(bookPath(stats.longestBook?.id ?? ''))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textAlign: 'left',
              font: 'inherit',
              cursor: 'pointer',
              color: 'inherit',
              width: '100%',
            }}
          >
            {(() => {
              const book = bookList.find((b) => b.id === stats.longestBook?.id);
              return book ? <BookCover book={book} width={56} /> : null;
            })()}
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span className="bk-source-kicker" style={{ color: currentTheme.status.warning }}>
                {t('Dickstes Buch')}
              </span>
              <span style={{ fontWeight: 800, color: currentTheme.text.secondary }}>
                {stats.longestBook.title}
              </span>
              <span className="bk-muted" style={{ color: currentTheme.text.muted }}>
                {t('{n} Seiten', { n: stats.longestBook.pages })}
              </span>
            </span>
          </button>
        )}

        <div className="bk-grid-2">
          <RankList
            title={t('Meistgelesene Autoren')}
            icon={<Person style={{ fontSize: 18, color: currentTheme.primary }} />}
            items={stats.topAuthors}
            unit={(n) => (n === 1 ? t('1 Buch') : t('{n} Bücher', { n }))}
          />
          <RankList
            title={t('Lieblingsgenres')}
            icon={<Sell style={{ fontSize: 18, color: currentTheme.accent }} />}
            items={stats.topCategories}
            unit={(n) => (n === 1 ? t('1 Buch') : t('{n} Bücher', { n }))}
          />
        </div>

        {stats.finishedBooks.length > 0 && (
          <div className="bk-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 800,
                marginBottom: 12,
                color: currentTheme.text.secondary,
              }}
            >
              <Star style={{ fontSize: 18, color: currentTheme.status.warning }} />
              {t('Gelesen {year}', { year })}
            </div>
            <Bookshelf books={[...stats.finishedBooks].reverse()} />
          </div>
        )}
      </div>
    </PageLayout>
  );
};
