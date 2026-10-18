import {
  ArrowDownward,
  ArrowUpward,
  AutoStories,
  CheckCircle,
  Close,
  GridView,
  LocalLibrary,
  Search,
  Sort,
  Star,
  Visibility,
} from '@mui/icons-material';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState, PageHeader, PageLayout } from '../../../components/ui';
import { LoadingSpinner } from '../../../components/ui/feedback/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import { mangaStand, mangaStandLabel } from '../../../lib/manga/progress';
import {
  buildLibrary,
  collectLibraryGenres,
  countByStatus,
  encodeSortPref,
  filterLibrary,
  groupByYear,
  itemHref,
  LIBRARY_DEFAULT_DESC,
  LIBRARY_SORTS,
  libraryBase,
  libraryHref,
  matchesMedium,
  mediumOptions,
  parseMediumFilter,
  parseStatusFilter,
  readLibraryPrefs,
  shelfBooks,
  STATUS_FILTERS,
  type LibraryItem,
  type LibraryMediumFilter,
  type LibrarySortKey,
  type LibraryStatusFilter,
  type LibraryView,
} from '../../../lib/reading/library';
import { usesArea } from '../../../lib/reading/readingMedium';
import { t } from '../../../services/i18n';
import { BookCover } from '../../Books/components/BookCover';
import { Bookshelf } from '../../Books/components/Bookshelf';
import '../../Books/components/books.css';
import { useBookActions } from '../../Books/hooks/useBookActions';
import '../../Manga/MangaPage.css';
import { getDisplayFormat, STATUS_COLORS } from '../../Manga/mangaUtils';
import './ReadingLibraryPage.css';

const PAGE_SIZE: Record<LibraryView, number> = { shelf: 45, grid: 30 };

const STATUS_LABEL: Record<LibraryStatusFilter, () => string> = {
  all: () => t('Alle'),
  reading: () => t('Lese ich'),
  planned: () => t('Geplant'),
  completed: () => t('Beendet'),
  paused: () => t('Pausiert'),
  dropped: () => t('Abgebrochen'),
  owned: () => t('Im Besitz'),
  hidden: () => t('Versteckt'),
};

const MEDIUM_LABEL: Record<LibraryMediumFilter, () => string> = {
  all: () => t('Alle Medien'),
  books: () => t('Bücher'),
  manga: () => 'Manga',
  manhwa: () => 'Manhwa',
  manhua: () => 'Manhua',
};

const SORT_LABEL: Record<LibrarySortKey, () => string> = {
  recent: () => t('Zuletzt gelesen'),
  added: () => t('Zuletzt hinzugefügt'),
  title: () => t('Titel'),
  author: () => t('Autor'),
  rating: () => t('Bewertung'),
  progress: () => t('Fortschritt'),
  pages: () => t('Umfang'),
};

const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* egal */
    }
  },
};

const itemMeta = (item: LibraryItem): string => {
  if (item.manga) {
    return (
      mangaStandLabel(item.manga) || getDisplayFormat(item.manga.countryOfOrigin, item.manga.format)
    );
  }
  const b = item.book;
  if (b && item.status === 'reading' && b.pageCount) {
    return t('S. {page} / {total}', { page: b.currentPage, total: b.pageCount });
  }
  return item.author ?? '';
};

/** Eine Bibliothek für Bücher und Manga: Regal oder Raster, Status, Medium, Genre, Sortierung. */
export const ReadingLibraryPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth() || {};
  const areas = useReadingAreas();
  const { bookList, hiddenBookList, loading: booksLoading } = useBooksList();
  const { mangaList, hiddenMangaList, loading: mangaLoading, toggleHideManga } = useMangaList();
  const bookActions = useBookActions();
  const showBooks = usesArea(areas, 'books');
  const showManga = usesArea(areas, 'manga');

  const [prefs] = useState(() => readLibraryPrefs(storage.get));
  const [sortPref, setSortPref] = useState({ sort: prefs.sort, flip: prefs.flip });
  const [viewPref, setViewPref] = useState<LibraryView | null>(prefs.view);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [limit, setLimit] = useState<{ key: string; n: number }>({ key: '', n: 0 });
  const { sort, flip } = sortPref;
  const view: LibraryView = viewPref ?? (areas === 'manga' ? 'grid' : 'shelf');

  useEffect(() => {
    if (storage.get('readingLibrarySort') === null) {
      storage.set('readingLibrarySort', encodeSortPref(prefs.sort, prefs.flip));
    }
    if (prefs.view && storage.get('readingLibraryView') === null) {
      storage.set('readingLibraryView', prefs.view);
    }
  }, [prefs]);

  const items = useMemo(
    () =>
      buildLibrary({
        books: bookList,
        hiddenBooks: hiddenBookList,
        manga: mangaList,
        hiddenManga: hiddenMangaList,
        showBooks,
        showManga,
        uid: user?.uid,
      }),
    [bookList, hiddenBookList, mangaList, hiddenMangaList, showBooks, showManga, user?.uid]
  );

  const mediums = useMemo(() => mediumOptions(items), [items]);
  const wantedMedium = parseMediumFilter(params.get('medium'));
  const medium = mediums.includes(wantedMedium) ? wantedMedium : 'all';
  const counts = useMemo(
    () => countByStatus(items.filter((i) => matchesMedium(i, medium))),
    [items, medium]
  );
  const wantedStatus = parseStatusFilter(params.get('status'));
  const status = wantedStatus === 'all' || counts[wantedStatus] > 0 ? wantedStatus : 'all';

  const base = useMemo(() => libraryBase(items, status, medium), [items, status, medium]);
  const genres = useMemo(() => collectLibraryGenres(base), [base]);
  const activeGenre = genre && genres.some((g) => g.key === genre) ? genre : null;

  const filtered = useMemo(
    () => filterLibrary(items, { status, medium, query, genre: activeGenre, sort, flip }),
    [items, status, medium, query, activeGenre, sort, flip]
  );

  const viewKey = `${status}|${medium}|${query}|${activeGenre}|${sort}|${flip}|${view}`;
  const pageSize = PAGE_SIZE[view];
  const shown = Math.max(limit.key === viewKey ? limit.n : 0, pageSize);
  const visible = useMemo(() => filtered.slice(0, shown), [filtered, shown]);
  const remaining = filtered.length - visible.length;
  const byYear = useMemo(
    () => (status === 'completed' && view === 'shelf' ? groupByYear(visible, t('Früher')) : null),
    [visible, status, view]
  );

  const setParam = (key: 'status' | 'medium', value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'all') next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true }
    );

  const pickSort = (id: LibrarySortKey) => {
    const next = { sort: id, flip: id === sort ? !flip : false };
    setSortPref(next);
    storage.set('readingLibrarySort', encodeSortPref(next.sort, next.flip));
  };

  const toggleView = () => {
    const next = view === 'shelf' ? 'grid' : 'shelf';
    setViewPref(next);
    storage.set('readingLibraryView', next);
  };

  const unhide = (item: LibraryItem) => {
    if (item.manga) void toggleHideManga(item.manga.anilistId, false);
    else if (item.book) void bookActions.toggleHidden(item.book);
  };

  const total = counts.all;
  const loading = (showBooks && booksLoading) || (showManga && mangaLoading);
  const chipStyle = (active: boolean, color: string) => ({
    flexShrink: 0,
    color: active ? color : currentTheme.text.secondary,
    borderColor: active ? `${color}80` : undefined,
    background: active ? `${color}1a` : undefined,
  });

  const header = (
    <PageHeader
      title={t('Deine Bibliothek')}
      subtitle={items.length > 0 ? t('{n} Titel', { n: total }) : undefined}
      icon={<LocalLibrary />}
      gradientFrom={currentTheme.primary}
      gradientTo={currentTheme.accent}
      actions={
        items.length > 0 ? (
          <button
            type="button"
            className="bk-icon-btn"
            onClick={toggleView}
            aria-label={view === 'shelf' ? t('Rasteransicht') : t('Regalansicht')}
            style={{ color: currentTheme.text.secondary }}
          >
            {view === 'shelf' ? <GridView /> : <LocalLibrary />}
          </button>
        ) : undefined
      }
    />
  );

  if (items.length === 0) {
    return (
      <PageLayout>
        {header}
        {loading ? (
          <LoadingSpinner text={t('Sammlung wird geladen …')} />
        ) : (
          <EmptyState
            icon={<AutoStories style={{ fontSize: 48 }} />}
            title={t('Deine Bibliothek')}
            description={
              areas === 'manga'
                ? t('Suche nach Manga, Manhwa oder Manhua und füge sie hinzu.')
                : areas === 'books'
                  ? t('Such dein aktuelles Buch oder hol deine Bibliothek von Goodreads rüber.')
                  : t(
                      'Leg dein erstes Buch oder deinen ersten Manga an – hier siehst du dann deinen Lesestand.'
                    )
            }
            action={
              areas === 'manga'
                ? { label: t('Manga suchen'), onClick: () => navigate('/manga/search') }
                : { label: t('Buch suchen'), onClick: () => navigate('/books/search') }
            }
          />
        )}
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {header}
      <div className="rl-body">
        <div className="bk-carousel rl-chips" role="tablist" aria-label={t('Lesestatus')}>
          {STATUS_FILTERS.filter((f) => f === 'all' || counts[f] > 0).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={f === status}
              className="bk-chip-btn"
              onClick={() => setParam('status', f)}
              style={chipStyle(f === status, currentTheme.primary)}
            >
              {f !== 'all' && STATUS_COLORS[f] && (
                <span className="manga-pill-dot" style={{ background: STATUS_COLORS[f] }} />
              )}
              {STATUS_LABEL[f]()}
              <span style={{ color: currentTheme.text.muted, fontWeight: 600 }}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {mediums.length > 1 && (
          <div className="bk-carousel rl-chips" aria-label={t('Medium')}>
            {mediums.map((m) => (
              <button
                key={m}
                type="button"
                className="bk-chip-btn rl-chip-small"
                aria-pressed={m === medium}
                onClick={() => setParam('medium', m)}
                style={chipStyle(m === medium, currentTheme.primary)}
              >
                {MEDIUM_LABEL[m]()}
              </button>
            ))}
          </div>
        )}

        <label className="bk-search" style={{ color: currentTheme.text.muted }}>
          <Search style={{ fontSize: 20 }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('In der Bibliothek suchen')}
            aria-label={t('In der Bibliothek suchen')}
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
          <div className="bk-carousel rl-chips" style={{ gap: 6 }}>
            {[{ key: null, name: t('Alle Genres'), count: base.length }, ...genres].map((g) => (
              <button
                key={g.key ?? 'all'}
                type="button"
                className="bk-chip-btn rl-chip-small"
                aria-pressed={g.key === activeGenre}
                onClick={() => setGenre(g.key)}
                style={{
                  ...chipStyle(g.key === activeGenre, currentTheme.accent),
                  color: g.key === activeGenre ? currentTheme.accent : currentTheme.text.muted,
                }}
              >
                {g.name}
                <span style={{ opacity: 0.7, fontWeight: 600 }}>{g.count}</span>
              </button>
            ))}
          </div>
        )}

        {status !== 'hidden' && (
          <div className="rl-sorts">
            <Sort style={{ fontSize: 18, color: currentTheme.text.muted }} />
            {LIBRARY_SORTS.map((s) => {
              const active = sort === s;
              const desc = LIBRARY_DEFAULT_DESC[s] !== flip;
              return (
                <button
                  key={s}
                  type="button"
                  className="bk-chip-btn rl-chip-small"
                  aria-pressed={active}
                  onClick={() => pickSort(s)}
                  style={{
                    color: active ? currentTheme.text.secondary : currentTheme.text.muted,
                    borderColor: active ? `${currentTheme.text.secondary}55` : undefined,
                  }}
                >
                  {SORT_LABEL[s]()}
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
        )}

        {(query || activeGenre) && (
          <div style={{ fontSize: 12.5, color: currentTheme.text.muted }}>
            {t('{n} Titel', { n: filtered.length })}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bk-card" style={{ textAlign: 'center', color: currentTheme.text.muted }}>
            {query || activeGenre ? t('Nichts gefunden') : t('Hier steht noch nichts.')}
          </div>
        ) : status === 'hidden' ? (
          <div className="rl-hidden-list">
            {visible.map((item) => (
              <HiddenRow
                key={item.key}
                item={item}
                onOpen={() => navigate(itemHref(item))}
                onUnhide={() => unhide(item)}
              />
            ))}
          </div>
        ) : view === 'shelf' ? (
          byYear ? (
            byYear.map(([year, group]) => (
              <div key={year} style={{ marginBottom: 8 }}>
                <div
                  className="bk-shelf-legend"
                  style={{ color: currentTheme.text.secondary, marginBottom: 8, marginTop: 4 }}
                >
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{year}</span>
                  <span style={{ color: currentTheme.text.muted }}>
                    {t('{n} Titel', { n: group.length })}
                  </span>
                </div>
                <Bookshelf books={shelfBooks(group)} hrefFor={libraryHref} />
              </div>
            ))
          ) : (
            <Bookshelf books={shelfBooks(visible)} hrefFor={libraryHref} />
          )
        ) : (
          <div className="manga-collection-grid">
            {visible.map((item) => (
              <LibraryCard key={item.key} item={item} onOpen={() => navigate(itemHref(item))} />
            ))}
          </div>
        )}

        {remaining > 0 && (
          <button
            type="button"
            className="bk-chip-btn"
            onClick={() => setLimit({ key: viewKey, n: shown + pageSize })}
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

const LibraryCard = ({ item, onOpen }: { item: LibraryItem; onOpen: () => void }) => {
  const statusColor = STATUS_COLORS[item.status];
  const stand = item.manga ? mangaStand(item.manga) : null;
  const showProgress = item.progress > 0 && item.status !== 'completed';

  return (
    <div
      className="manga-collection-item"
      role="button"
      tabIndex={0}
      aria-label={item.title}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="manga-collection-card">
        {item.book ? (
          <BookCover book={item.book} className="rl-card-cover" />
        ) : (
          <img
            className="manga-collection-poster"
            src={item.manga?.poster}
            alt={item.title}
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="manga-collection-overlay">
          <div className="manga-collection-top">
            <span
              className="manga-collection-status"
              style={{ '--status-color': statusColor } as React.CSSProperties}
            >
              {item.status === 'completed' ? (
                <CheckCircle style={{ fontSize: 12 }} />
              ) : (
                <span className="manga-collection-status-dot" />
              )}
              {STATUS_LABEL[item.status]()}
            </span>
            {item.rating > 0 && (
              <span className="manga-collection-rating">
                <Star style={{ fontSize: 12 }} />
                {item.rating}
              </span>
            )}
          </div>
          <div className="manga-collection-bottom">
            <div className="manga-collection-title">{item.title}</div>
            <div className="manga-collection-meta">
              <span className="rl-card-meta">{itemMeta(item)}</span>
              {item.status === 'reading' && stand && stand.remaining > 0 && (
                <span className="manga-collection-unread">
                  {stand.unit === 'volume'
                    ? t('{n} Bd. offen', { n: stand.remaining })
                    : t('{n} offen', { n: stand.remaining })}
                </span>
              )}
            </div>
            {showProgress && (
              <div className="manga-collection-progress" aria-hidden>
                <span style={{ width: `${item.progress}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HiddenRow = ({
  item,
  onOpen,
  onUnhide,
}: {
  item: LibraryItem;
  onOpen: () => void;
  onUnhide: () => void;
}) => {
  const { currentTheme } = useTheme();
  const meta = item.manga
    ? [mangaStandLabel(item.manga, true), item.progress ? `${item.progress}%` : '']
        .filter(Boolean)
        .join(' · ')
    : itemMeta(item);

  return (
    <div
      className="rl-hidden-row"
      role="button"
      tabIndex={0}
      aria-label={t('{title} öffnen', { title: item.title })}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{ background: `${currentTheme.text.primary}06` }}
    >
      {item.book ? (
        <BookCover book={item.book} width={50} />
      ) : (
        <img
          className="rl-hidden-poster"
          src={item.manga?.poster}
          alt={item.title}
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="rl-hidden-text">
        <div className="rl-hidden-title" style={{ color: currentTheme.text.primary }}>
          {item.title}
        </div>
        {meta && (
          <div style={{ fontSize: 12, color: currentTheme.text.secondary, marginTop: 2 }}>
            {meta}
          </div>
        )}
      </div>
      <button
        type="button"
        className="rl-unhide"
        onClick={(e) => {
          e.stopPropagation();
          onUnhide();
        }}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ background: `${currentTheme.primary}15`, color: currentTheme.primary }}
      >
        <Visibility style={{ fontSize: 16 }} />
        {t('Einblenden')}
      </button>
    </div>
  );
};
