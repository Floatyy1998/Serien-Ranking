import { Celebration, Schedule } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, LoadingSpinner, PageHeader, PageLayout } from '../../../components/ui';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDeviceType } from '../../../hooks/platform/useDeviceType';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import { tapScaleSmall } from '../../../lib/motion';
import {
  bookCatchUp,
  catchUpTotals,
  mangaCatchUp,
  seriesCatchUp,
  sortCatchUp,
  type CatchUpEntry,
  type CatchUpSort,
} from '../../../lib/reading/catchUp';
import { usesArea } from '../../../lib/reading/readingMedium';
import { t } from '../../../services/i18n';
import type { Book } from '../../../types/Book';
import { BookCover } from '../../Books/components/BookCover';
import '../../Books/components/books.css';
import { useOpenByTitle, useOpenResult } from '../../Books/discover/DiscoverParts';
import { bookPath, formatHours } from '../../Books/helpers';
import { useNextVolumes } from '../../Books/hooks/useNextVolumes';
import { useSeriesPartBooks } from '../../Books/hooks/useSeriesPartBooks';
import { StatTile } from '../../Books/sections/BookStatsSection';

const NO_BOOKS: Book[] = [];

const SORTS: { key: CatchUpSort; label: () => string }[] = [
  { key: 'open', label: () => t('Am meisten offen') },
  { key: 'progress', label: () => t('Fortschritt') },
  { key: 'recent', label: () => t('Am längsten nicht gelesen') },
];

/** Aufholen: offene Kapitel, angefangene Bücher und erschienene nächste Bände in einer Liste. */
export const ReadingCatchUpPage = () => {
  const { currentTheme } = useTheme();
  const { bookList, loading: booksLoading } = useBooksList();
  const { mangaList, loading: mangaLoading } = useMangaList();
  const areas = useReadingAreas();
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [sortBy, setSortBy] = useState<CatchUpSort>('open');
  const [now] = useState(() => Date.now());

  const booksOn = usesArea(areas, 'books');
  const mangaOn = usesArea(areas, 'manga');
  const { progress: nextVolumes } = useNextVolumes(booksOn ? bookList : NO_BOOKS, now);

  const series = useMemo(() => (booksOn ? seriesCatchUp(nextVolumes) : []), [nextVolumes, booksOn]);
  const entries = useMemo(
    () => [
      ...(mangaOn ? mangaCatchUp(mangaList) : []),
      ...(booksOn ? bookCatchUp(bookList) : []),
      ...series,
    ],
    [mangaList, bookList, series, booksOn, mangaOn]
  );
  const sorted = useMemo(() => sortCatchUp(entries, sortBy), [entries, sortBy]);
  const totals = useMemo(() => catchUpTotals(entries), [entries]);

  const lookups = useMemo(
    () =>
      series.flatMap((e) =>
        e.kind === 'series' ? [{ part: e.series.next.part, author: e.series.author }] : []
      ),
    [series]
  );
  const found = useSeriesPartBooks(lookups);
  const { open: openByTitle } = useOpenByTitle();
  const openResult = useOpenResult();

  const loading = (booksOn && booksLoading) || (mangaOn && mangaLoading);
  const hasMangaEntries = entries.some((e) => e.kind === 'manga');
  const hasBookEntries = entries.some((e) => e.kind !== 'manga');

  const subtitle = !entries.length
    ? undefined
    : hasMangaEntries && hasBookEntries
      ? t('{n} Titel · {m} Kapitel · {p} Seiten offen', {
          n: totals.titles,
          m: totals.chapters,
          p: totals.pages.toLocaleString(),
        })
      : hasMangaEntries
        ? t('{n} Manga · {m} Kapitel offen', { n: totals.titles, m: totals.chapters })
        : t('{n} Titel · {p} Seiten offen', {
            n: totals.titles,
            p: totals.pages.toLocaleString(),
          });

  const emptyText = !mangaOn
    ? t('Du bist bei allen Büchern auf dem aktuellen Stand.')
    : !booksOn
      ? t('Du bist bei allen Manga auf dem aktuellen Stand.')
      : t('Du bist bei allen Büchern und Manga auf dem aktuellen Stand.');

  const openEntry = (entry: CatchUpEntry) => {
    if (entry.kind === 'manga') navigate(`/manga/${entry.manga.anilistId}`);
    else if (entry.kind === 'book') navigate(bookPath(entry.book.id));
    else {
      const match = found[entry.series.next.part.wikidataId];
      if (match) openResult(match);
      else void openByTitle(entry.series.next.part.title, entry.series.author);
    }
  };

  const posterOf = (entry: CatchUpEntry): ReactNode => {
    const size = isDesktop ? { width: 72, height: 108 } : { width: 60, height: 90 };
    if (entry.kind === 'manga') {
      return (
        <img
          src={entry.manga.poster}
          alt=""
          style={{ ...size, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          loading="lazy"
          decoding="async"
        />
      );
    }
    if (entry.kind === 'book') return <BookCover book={entry.book} width={size.width} />;
    const match = found[entry.series.next.part.wikidataId];
    return (
      <BookCover
        book={{
          id: entry.key,
          title: entry.title,
          authors: entry.series.author ? [entry.series.author] : [],
          cover: match?.cover,
        }}
        fallbackSrc={match?.coverFallback}
        width={size.width}
      />
    );
  };

  const textOf = (entry: CatchUpEntry): { meta: string; sub?: string; side: string } => {
    if (entry.kind === 'manga') {
      return {
        meta: `${t('Kap.')} ${entry.current} / ${entry.total} · ${t('{n} offen', { n: entry.open })}`,
        side: `${Math.round(entry.progress)}%`,
      };
    }
    if (entry.kind === 'book') {
      return {
        meta: `${t('S. {page} / {total}', {
          page: entry.book.currentPage || 0,
          total: entry.book.pageCount ?? 0,
        })} · ${t('{n} Seiten übrig', { n: entry.pagesLeft })}`,
        sub: formatHours(entry.hoursLeft),
        side: `${Math.round(entry.progress)}%`,
      };
    }
    const { series } = entry;
    return {
      meta: series.seriesName
        ? `${series.seriesName} · ${t('Band {n}', { n: series.next.part.position })}`
        : t('Band {n}', { n: series.next.part.position }),
      sub: t('Schon erschienen'),
      side: t('Neu'),
    };
  };

  return (
    <PageLayout>
      <PageHeader
        title={t('Aufholen')}
        gradientFrom={currentTheme.accent}
        gradientTo={currentTheme.primary}
        subtitle={subtitle}
        icon={<Schedule />}
      />

      <div style={{ padding: '0 16px' }}>
        {entries.length > 0 && (
          <div className="bk-stat-grid" style={{ marginBottom: 20 }}>
            <StatTile
              value={totals.titles}
              label={t('Titel offen')}
              color={currentTheme.text.primary}
            />
            {mangaOn && (
              <StatTile
                value={totals.chapters.toLocaleString()}
                label={t('Kapitel offen')}
                color={currentTheme.text.primary}
              />
            )}
            {booksOn && (
              <StatTile
                value={totals.pages.toLocaleString()}
                label={t('Seiten offen')}
                color={currentTheme.text.primary}
              />
            )}
            <StatTile
              value={`${Math.round(totals.avgProgress)}%`}
              label={t('Ø Fortschritt')}
              color={currentTheme.accent}
            />
          </div>
        )}

        {entries.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={sortBy === s.key}
                onClick={() => setSortBy(s.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: sortBy === s.key ? `${currentTheme.primary}25` : 'transparent',
                  color: sortBy === s.key ? currentTheme.primary : currentTheme.text.secondary,
                  fontSize: 12,
                  fontWeight: sortBy === s.key ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {s.label()}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            // minmax(0, …): das Auto-Minimum von 1fr ist die min-content-Breite der Zeile und sprengt den Viewport.
            gridTemplateColumns: isDesktop
              ? 'repeat(auto-fill, minmax(min(100%, 460px), 1fr))'
              : 'minmax(0, 1fr)',
            gap: 10,
            alignItems: 'start',
            paddingBottom: 'var(--page-bottom-gap)',
          }}
        >
          {sorted.map((entry) => {
            const { meta, sub, side } = textOf(entry);
            return (
              <motion.div
                key={entry.key}
                role="button"
                tabIndex={0}
                aria-label={t('{title} öffnen', { title: entry.title })}
                onClick={() => openEntry(entry)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openEntry(entry);
                  }
                }}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 12,
                  borderRadius: 14,
                  background: `${currentTheme.text.primary}06`,
                  cursor: 'pointer',
                  alignItems: 'center',
                  minWidth: 0,
                }}
                whileTap={tapScaleSmall}
              >
                <div style={{ flexShrink: 0 }}>{posterOf(entry)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: currentTheme.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: currentTheme.text.secondary,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {meta}
                  </div>
                  {sub && (
                    <div
                      style={{
                        fontSize: 12,
                        color:
                          entry.kind === 'series' ? currentTheme.accent : currentTheme.text.muted,
                        marginTop: 2,
                      }}
                    >
                      {sub}
                    </div>
                  )}
                  {entry.kind !== 'series' && (
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: `${currentTheme.text.primary}10`,
                        marginTop: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${entry.progress}%`,
                          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: entry.kind === 'series' ? 13 : 18,
                    fontWeight: 800,
                    color: currentTheme.accent,
                    fontFamily: 'var(--font-display)',
                    flexShrink: 0,
                  }}
                >
                  {side}
                </div>
              </motion.div>
            );
          })}
        </div>

        {entries.length === 0 &&
          (loading ? (
            <LoadingSpinner text={t('Wird geladen …')} />
          ) : (
            <EmptyState
              icon={<Celebration style={{ fontSize: 'inherit' }} />}
              title={t('Alles aufgeholt!')}
              description={emptyText}
            />
          ))}
      </div>
    </PageLayout>
  );
};
