import {
  ArrowDownward,
  ArrowUpward,
  Close,
  GridView,
  LocalLibrary,
  Search,
  Sort,
} from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useBooksList } from '../../contexts/BooksListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { progressPercent } from '../../lib/books/bookProgress';
import {
  bookGenres,
  collectGenres,
  DEFAULT_DESC,
  matchesQuery,
  sortShelf,
  type ShelfSortKey,
} from '../../lib/books/shelfView';
import { t } from '../../services/i18n';
import type { Book, BookStatus } from '../../types/Book';
import { BookCover } from './components/BookCover';
import { Bookshelf } from './components/Bookshelf';
import './components/books.css';
import { bookPath, STATUS_LABELS } from './helpers';

type Filter = 'all' | BookStatus | 'owned' | 'hidden';
type ViewMode = 'shelf' | 'grid';

const FILTERS: Filter[] = [
  'all',
  'reading',
  'planned',
  'completed',
  'paused',
  'dropped',
  'owned',
  'hidden',
];

const SORTS: { id: ShelfSortKey; label: () => string }[] = [
  { id: 'recent', label: () => t('Zuletzt') },
  { id: 'title', label: () => t('Titel') },
  { id: 'author', label: () => t('Autor') },
  { id: 'rating', label: () => t('Bewertung') },
  { id: 'pages', label: () => t('Seiten') },
];

const PAGE_SIZE: Record<ViewMode, number> = { shelf: 45, grid: 30 };

const readSortPref = (): { sort: ShelfSortKey; flip: boolean } => {
  try {
    const [sort, flip] = (localStorage.getItem('bookShelfSort') ?? '').split(':');
    if (SORTS.some((s) => s.id === sort)) return { sort: sort as ShelfSortKey, flip: flip === '1' };
  } catch {
    /* egal */
  }
  return { sort: 'recent', flip: false };
};

export const BookShelfPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { bookList, hiddenBookList } = useBooksList();
  const filter = (
    FILTERS.includes(params.get('status') as Filter) ? params.get('status') : 'all'
  ) as Filter;
  const [pref, setPref] = useState(readSortPref);
  const { sort, flip } = pref;
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [limit, setLimit] = useState<{ key: string; n: number }>({ key: '', n: 0 });
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
      owned: 0,
      hidden: hiddenBookList.length,
    };
    for (const b of bookList) {
      out[b.status] += 1;
      if (b.ownedAt) out.owned += 1;
    }
    return out;
  }, [bookList, hiddenBookList]);

  const statusBase = useMemo(
    () =>
      filter === 'all'
        ? bookList
        : filter === 'hidden'
          ? hiddenBookList
          : filter === 'owned'
            ? bookList.filter((b) => !!b.ownedAt)
            : bookList.filter((b) => b.status === filter),
    [bookList, hiddenBookList, filter]
  );

  const genres = useMemo(() => collectGenres(statusBase), [statusBase]);
  const activeGenre = genre && genres.some((g) => g.name === genre) ? genre : null;

  const filtered = useMemo(() => {
    const narrowed = statusBase.filter(
      (b) => matchesQuery(b, query) && (!activeGenre || bookGenres(b).includes(activeGenre))
    );
    return sortShelf(narrowed, sort, flip);
  }, [statusBase, query, activeGenre, sort, flip]);

  const viewKey = `${filter}|${query}|${activeGenre}|${sort}|${flip}|${view}`;
  const shown = Math.max(limit.key === viewKey ? limit.n : 0, PAGE_SIZE[view]);
  const visible = useMemo(() => filtered.slice(0, shown), [filtered, shown]);
  const remaining = filtered.length - visible.length;

  const byYear = useMemo(() => {
    if (filter !== 'completed' || view !== 'shelf') return null;
    const groups = new Map<string, Book[]>();
    for (const b of visible) {
      const key = b.completedAt ? String(new Date(b.completedAt).getFullYear()) : t('Früher');
      groups.set(key, [...(groups.get(key) ?? []), b]);
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [visible, filter, view]);

  const setFilter = (next: Filter) =>
    setParams(next === 'all' ? {} : { status: next }, { replace: true });
  const pickSort = (id: ShelfSortKey) => {
    const next = { sort: id, flip: id === sort ? !flip : false };
    setPref(next);
    try {
      localStorage.setItem('bookShelfSort', `${next.sort}:${next.flip ? 1 : 0}`);
    } catch {
      /* egal */
    }
  };
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
    f === 'all'
      ? t('Alle')
      : f === 'hidden'
        ? t('Ausgeblendet')
        : f === 'owned'
          ? t('Im Besitz')
          : STATUS_LABELS[f]();

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
        <label className="bk-search" style={{ color: currentTheme.text.muted }}>
          <Search style={{ fontSize: 20 }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Im Regal suchen')}
            aria-label={t('Im Regal suchen')}
            style={{ color: currentTheme.text.primary }}
          />
          {query && (
            <button
              type="button"
              className="bk-search-clear"
              onClick={() => setQuery('')}
              aria-label={t('Suche löschen')}
              style={{ color: currentTheme.text.muted }}
            >
              <Close style={{ fontSize: 18 }} />
            </button>
          )}
        </label>
        {genres.length > 1 && (
          <div className="bk-carousel" style={{ padding: 0, gap: 6 }}>
            {[{ name: null, count: statusBase.length }, ...genres].map((g) => {
              const active = g.name === activeGenre;
              return (
                <button
                  key={g.name ?? 'all'}
                  type="button"
                  className="bk-chip-btn"
                  onClick={() => setGenre(g.name)}
                  style={{
                    flexShrink: 0,
                    minHeight: 32,
                    fontSize: 12,
                    color: active ? currentTheme.accent : currentTheme.text.muted,
                    borderColor: active ? `${currentTheme.accent}80` : undefined,
                    background: active ? `${currentTheme.accent}1a` : undefined,
                  }}
                >
                  {g.name ?? t('Alle Genres')}
                  <span style={{ opacity: 0.7, fontWeight: 600 }}>{g.count}</span>
                </button>
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Sort style={{ fontSize: 18, color: currentTheme.text.muted }} />
          {SORTS.map((s) => {
            const active = sort === s.id;
            const desc = DEFAULT_DESC[s.id] !== flip;
            return (
              <button
                key={s.id}
                type="button"
                className="bk-chip-btn"
                onClick={() => pickSort(s.id)}
                style={{
                  minHeight: 32,
                  fontSize: 12,
                  color: active ? currentTheme.text.secondary : currentTheme.text.muted,
                  borderColor: active ? `${currentTheme.text.secondary}55` : undefined,
                }}
              >
                {s.label()}
                {active &&
                  (desc ? (
                    <ArrowDownward style={{ fontSize: 14 }} />
                  ) : (
                    <ArrowUpward style={{ fontSize: 14 }} />
                  ))}
              </button>
            );
          })}
        </div>
        {(query || activeGenre) && (
          <div style={{ fontSize: 12.5, color: currentTheme.text.muted }}>
            {t('{n} Bücher', { n: filtered.length })}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bk-card" style={{ textAlign: 'center', color: currentTheme.text.muted }}>
            {query || activeGenre ? t('Nichts gefunden') : t('Hier steht noch nichts.')}
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
            <Bookshelf books={visible} />
          )
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))',
              gap: 16,
            }}
          >
            {visible.map((b) => {
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
        {remaining > 0 && (
          <button
            type="button"
            className="bk-chip-btn"
            onClick={() => setLimit({ key: viewKey, n: shown + PAGE_SIZE[view] })}
            style={{ alignSelf: 'center', color: currentTheme.text.secondary }}
          >
            {t('Mehr anzeigen')}
            <span style={{ color: currentTheme.text.muted, fontWeight: 600 }}>{remaining}</span>
          </button>
        )}
        <div style={{ height: 'var(--page-bottom-gap)' }} />
      </div>
    </PageLayout>
  );
};
