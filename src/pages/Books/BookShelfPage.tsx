import { GridView, LocalLibrary, Sort } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useBooksList } from '../../contexts/BooksListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { progressPercent } from '../../lib/books/bookProgress';
import { t } from '../../services/i18n';
import type { Book, BookStatus } from '../../types/Book';
import { BookCover } from './components/BookCover';
import { Bookshelf } from './components/Bookshelf';
import './components/books.css';
import { bookPath, STATUS_LABELS } from './helpers';

type Filter = 'all' | BookStatus | 'hidden';
type SortKey = 'recent' | 'title' | 'author' | 'rating' | 'pages';
type ViewMode = 'shelf' | 'grid';

const FILTERS: Filter[] = ['all', 'reading', 'planned', 'completed', 'paused', 'dropped', 'hidden'];

const SORTS: { id: SortKey; label: () => string }[] = [
  { id: 'recent', label: () => t('Zuletzt') },
  { id: 'title', label: () => t('Titel') },
  { id: 'author', label: () => t('Autor') },
  { id: 'rating', label: () => t('Bewertung') },
  { id: 'pages', label: () => t('Seiten') },
];

const activity = (b: Book) =>
  new Date(b.completedAt || b.lastReadAt || b.startedAt || b.addedAt || 0).getTime();

function sortBooks(books: Book[], sort: SortKey): Book[] {
  const list = [...books];
  switch (sort) {
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'author':
      return list.sort((a, b) => (a.authors?.[0] ?? '').localeCompare(b.authors?.[0] ?? ''));
    case 'rating':
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || activity(b) - activity(a));
    case 'pages':
      return list.sort((a, b) => (b.pageCount ?? 0) - (a.pageCount ?? 0));
    default:
      return list.sort((a, b) => activity(b) - activity(a));
  }
}

export const BookShelfPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { bookList, hiddenBookList } = useBooksList();
  const filter = (
    FILTERS.includes(params.get('status') as Filter) ? params.get('status') : 'all'
  ) as Filter;
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<ViewMode>(() =>
    (localStorage.getItem('bookShelfView') as ViewMode) === 'grid' ? 'grid' : 'shelf'
  );

  const counts = useMemo(() => {
    const out: Record<Filter, number> = {
      all: bookList.length,
      reading: 0,
      planned: 0,
      completed: 0,
      paused: 0,
      dropped: 0,
      hidden: hiddenBookList.length,
    };
    for (const b of bookList) out[b.status] += 1;
    return out;
  }, [bookList, hiddenBookList]);

  const filtered = useMemo(() => {
    const base =
      filter === 'all'
        ? bookList
        : filter === 'hidden'
          ? hiddenBookList
          : bookList.filter((b) => b.status === filter);
    const sorted = sortBooks(base, sort);
    return view === 'shelf' && sort === 'recent' ? sorted.reverse() : sorted;
  }, [bookList, hiddenBookList, filter, sort, view]);

  const byYear = useMemo(() => {
    if (filter !== 'completed' || view !== 'shelf') return null;
    const groups = new Map<string, Book[]>();
    for (const b of filtered) {
      const key = b.completedAt ? String(new Date(b.completedAt).getFullYear()) : t('Früher');
      groups.set(key, [...(groups.get(key) ?? []), b]);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered, filter, view]);

  const setFilter = (next: Filter) =>
    setParams(next === 'all' ? {} : { status: next }, { replace: true });
  const toggleView = () => {
    const next = view === 'shelf' ? 'grid' : 'shelf';
    setView(next);
    try {
      localStorage.setItem('bookShelfView', next);
    } catch {
      /* egal */
    }
  };

  const filterLabel = (f: Filter) =>
    f === 'all' ? t('Alle') : f === 'hidden' ? t('Ausgeblendet') : STATUS_LABELS[f]();

  return (
    <PageLayout>
      <PageHeader
        title={t('Dein Regal')}
        subtitle={t('{n} Bücher', { n: bookList.length })}
        icon={<LocalLibrary />}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        actions={
          <button
            type="button"
            className="bk-icon-btn"
            onClick={toggleView}
            aria-label={view === 'shelf' ? t('Rasteransicht') : t('Regalansicht')}
            style={{ color: currentTheme.text.secondary }}
          >
            {view === 'shelf' ? <GridView /> : <LocalLibrary />}
          </button>
        }
      />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="bk-carousel" style={{ padding: 0, gap: 8 }}>
          {FILTERS.filter((f) => f === 'all' || counts[f] > 0).map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                className="bk-chip-btn"
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0,
                  color: active ? currentTheme.primary : currentTheme.text.secondary,
                  borderColor: active ? `${currentTheme.primary}80` : undefined,
                  background: active ? `${currentTheme.primary}1a` : undefined,
                }}
              >
                {filterLabel(f)}
                <span style={{ color: currentTheme.text.muted, fontWeight: 600 }}>{counts[f]}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Sort style={{ fontSize: 18, color: currentTheme.text.muted }} />
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="bk-chip-btn"
              onClick={() => setSort(s.id)}
              style={{
                minHeight: 32,
                fontSize: 12,
                color: sort === s.id ? currentTheme.text.secondary : currentTheme.text.muted,
                borderColor: sort === s.id ? `${currentTheme.text.secondary}55` : undefined,
              }}
            >
              {s.label()}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bk-card" style={{ textAlign: 'center', color: currentTheme.text.muted }}>
            {t('Hier steht noch nichts.')}
          </div>
        ) : view === 'shelf' ? (
          byYear ? (
            byYear.map(([year, books]) => (
              <div key={year} style={{ marginBottom: 8 }}>
                <div
                  className="bk-shelf-legend"
                  style={{ color: currentTheme.text.secondary, marginBottom: 8, marginTop: 4 }}
                >
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{year}</span>
                  <span style={{ color: currentTheme.text.muted }}>
                    {t('{n} Bücher', { n: books.length })}
                  </span>
                </div>
                <Bookshelf books={books} />
              </div>
            ))
          ) : (
            <Bookshelf books={filtered} />
          )
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map((b) => {
              const pct = progressPercent(b);
              return (
                <button
                  key={b.id}
                  type="button"
                  className="bk-carousel-item"
                  style={{ width: 'auto' }}
                  onClick={() => navigate(bookPath(b.id))}
                >
                  <BookCover book={b} />
                  {b.status === 'reading' && (
                    <div className="bk-progress" style={{ height: 4 }}>
                      <div
                        className="bk-progress-fill"
                        style={{ width: `${pct}%`, background: currentTheme.primary }}
                      />
                    </div>
                  )}
                  <span className="bk-item-title" style={{ color: currentTheme.text.secondary }}>
                    {b.title}
                  </span>
                  <span className="bk-item-sub" style={{ color: currentTheme.text.muted }}>
                    {b.authors?.[0] ?? ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div style={{ height: 'var(--page-bottom-gap)' }} />
      </div>
    </PageLayout>
  );
};
