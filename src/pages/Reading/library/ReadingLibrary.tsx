import {
  CheckCircle,
  Checklist,
  EditNote,
  FilterList,
  GridView,
  LibraryBooks,
  LocalLibrary,
  TaskAlt,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BottomSheet } from '../../../components/ui';
import { GradientText } from '../../../components/ui/display/GradientText';
import { ThemedSelect } from '../../../components/ui/input/ThemedSelect';
import { ChoiceSheet, type Choice } from '../../../components/ui/selection/ChoiceSheet';
import { SelectionBar, type SelectionAction } from '../../../components/ui/selection/SelectionBar';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLongPress } from '../../../hooks/ui/useLongPress';
import { useReadingAreas } from '../../../hooks/ui/useReadingAreas';
import { useSelection } from '../../../hooks/ui/useSelection';
import { mangaStandLabel } from '../../../lib/manga/progress';
import {
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
import { t } from '../../../services/i18n';
import type { Book, BookStatus } from '../../../types/Book';
import { BookCover } from '../../Books/components/BookCover';
import { Bookshelf } from '../../Books/components/Bookshelf';
import '../../Books/components/books.css';
import { useBookActions } from '../../Books/hooks/useBookActions';
import '../../Manga/MangaPage.css';
import { getDisplayFormat, STATUS_COLORS } from '../../Manga/mangaUtils';
import { RatingReadCard } from '../../Ratings/RatingReadCard';
import './ReadingLibrary.css';
import { useLibraryBulk } from './useLibraryBulk';

const PAGE_SIZE: Record<LibraryView, number> = { shelf: 60, grid: 48 };

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

/** Schlüssel des Bibliothekseintrags zu einem Regalbuch (Manga stehen als „manga-<id>" im Regal). */
const shelfKey = (book: Pick<Book, 'id'>): string =>
  book.id.startsWith('manga-') ? `m:${book.id.slice(6)}` : `b:${book.id}`;

type BulkSheet = 'read' | 'status' | null;

interface ReadingLibraryProps {
  items: LibraryItem[];
  /** Suche aus dem Kopf der Bewertungsseite. */
  search: string;
}

/**
 * Reiter „Lesen" der Bewertungsseite: Bücher und Manga als Regal oder Raster, Filter (Status, Medium,
 * Genre, Sortierung) über den Filter-Knopf, Mehrfachauswahl per langem Druck.
 */
export const ReadingLibrary: React.FC<ReadingLibraryProps> = ({ items, search }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const areas = useReadingAreas();
  const { toggleHideManga } = useMangaList();
  const bookActions = useBookActions();

  const [prefs] = useState(() => readLibraryPrefs(storage.get));
  const [sortPref, setSortPref] = useState({ sort: prefs.sort, flip: prefs.flip });
  const [viewPref, setViewPref] = useState<LibraryView | null>(prefs.view);
  const [genre, setGenre] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  const query = search.trim();

  const filtered = useMemo(
    () => filterLibrary(items, { status, medium, query, genre: activeGenre, sort, flip }),
    [items, status, medium, query, activeGenre, sort, flip]
  );

  const filteredKeys = useMemo(() => filtered.map((i) => i.key), [filtered]);
  const selection = useSelection(filteredKeys);
  const bulk = useLibraryBulk();
  const [bulkSheet, setBulkSheet] = useState<BulkSheet>(null);
  const picked = useMemo(() => filtered.filter((i) => selection.has(i.key)), [filtered, selection]);
  const press = useLongPress<string>((key) =>
    selection.active ? selection.toggle(key) : selection.start(key)
  );
  const selecting = selection.active;
  const onHiddenTab = status === 'hidden';
  const displayView: LibraryView = view;
  const shelfSelection = selecting
    ? {
        isPicked: (book: Book) => selection.has(shelfKey(book)),
        toggle: (book: Book) => selection.toggle(shelfKey(book)),
      }
    : undefined;

  const viewKey = `${status}|${medium}|${query}|${activeGenre}|${sort}|${flip}|${displayView}`;
  const pageSize = PAGE_SIZE[displayView];
  const shown = Math.max(limit.key === viewKey ? limit.n : 0, pageSize);
  const visible = useMemo(() => filtered.slice(0, shown), [filtered, shown]);
  const remaining = filtered.length - visible.length;
  const byYear = useMemo(
    () =>
      status === 'completed' && displayView === 'shelf' ? groupByYear(visible, t('Früher')) : null,
    [visible, status, displayView]
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

  const setView = (next: LibraryView) => {
    setViewPref(next);
    storage.set('readingLibraryView', next);
  };

  const unhide = (item: LibraryItem) => {
    if (item.manga) void toggleHideManga(item.manga.anilistId, false);
    else if (item.book) void bookActions.toggleHidden(item.book);
  };

  const resetFilters = () => {
    setGenre(null);
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('status');
        next.delete('medium');
        return next;
      },
      { replace: true }
    );
  };
  const activeFilters = [status !== 'all', medium !== 'all', !!activeGenre].filter(Boolean).length;

  const finish = (ok: boolean) => {
    if (ok) selection.exit();
  };
  const applyStatus = (next: BookStatus, earlier = false) =>
    void bulk.setStatus(picked, next, earlier).then(finish);
  const allOwned = picked.length > 0 && picked.every((i) => i.owned);
  const allHave = (s: BookStatus) => picked.length > 0 && picked.every((i) => i.status === s);

  const bulkActions: SelectionAction[] = onHiddenTab
    ? [
        {
          key: 'unhide',
          label: t('Einblenden'),
          icon: <Visibility style={{ fontSize: 20 }} />,
          primary: true,
          onClick: () => void bulk.setHidden(picked, false).then(finish),
        },
      ]
    : [
        {
          key: 'read',
          label: t('Gelesen'),
          icon: <TaskAlt style={{ fontSize: 20 }} />,
          primary: true,
          onClick: () => setBulkSheet('read'),
        },
        {
          key: 'status',
          label: t('Status'),
          icon: <EditNote style={{ fontSize: 20 }} />,
          onClick: () => setBulkSheet('status'),
        },
        {
          key: 'owned',
          label: allOwned ? t('Nicht im Besitz') : t('Im Besitz'),
          icon: <LibraryBooks style={{ fontSize: 20 }} />,
          onClick: () => void bulk.setOwned(picked, !allOwned).then(finish),
        },
        {
          key: 'hide',
          label: t('Ausblenden'),
          icon: <VisibilityOff style={{ fontSize: 20 }} />,
          onClick: () => void bulk.setHidden(picked, true).then(finish),
        },
      ];

  const readChoices: Choice[] = [
    {
      key: 'today',
      label: t('Heute beendet'),
      hint: t('Zählt für dein Leseziel und den Jahresrückblick'),
      icon: <TaskAlt />,
      onPick: () => applyStatus('completed'),
    },
    {
      key: 'earlier',
      label: t('Früher gelesen'),
      hint: t('Ohne Datum, zählt nicht für dieses Jahr'),
      icon: <CheckCircle />,
      onPick: () => applyStatus('completed', true),
    },
  ];
  const statusChoices: Choice[] = (['reading', 'planned', 'paused', 'dropped'] as const).map(
    (s) => ({
      key: s,
      label: STATUS_LABEL[s](),
      current: allHave(s),
      icon: <span className="manga-pill-dot" style={{ background: STATUS_COLORS[s] }} />,
      onPick: () => applyStatus(s),
    })
  );

  const toggleStyle = (active: boolean) =>
    active
      ? { background: currentTheme.primary, color: currentTheme.background.default }
      : { color: currentTheme.text.muted };

  if (items.length === 0) {
    return (
      <div className="rf-empty" style={{ color: currentTheme.text.muted }}>
        {t(
          'Leg dein erstes Buch oder deinen ersten Manga an – hier siehst du dann deinen Lesestand.'
        )}
      </div>
    );
  }

  return (
    <>
      <div className="ratings-density-toggle" role="group" aria-label={t('Ansicht')}>
        <button
          type="button"
          className={`ratings-density-btn${selecting ? ' active' : ''}`}
          onClick={() => (selecting ? selection.exit() : selection.start())}
          aria-pressed={selecting}
          title={selecting ? t('Auswahl beenden') : t('Auswählen')}
          aria-label={selecting ? t('Auswahl beenden') : t('Auswählen')}
          style={toggleStyle(selecting)}
        >
          <Checklist fontSize="small" />
        </button>
        {!onHiddenTab && (
          <>
            <button
              type="button"
              className={`ratings-density-btn${displayView === 'grid' ? ' active' : ''}`}
              onClick={() => setView('grid')}
              aria-pressed={displayView === 'grid'}
              title={t('Rasteransicht')}
              aria-label={t('Rasteransicht')}
              style={toggleStyle(displayView === 'grid')}
            >
              <GridView fontSize="small" />
            </button>
            <button
              type="button"
              className={`ratings-density-btn${displayView === 'shelf' ? ' active' : ''}`}
              onClick={() => setView('shelf')}
              aria-pressed={displayView === 'shelf'}
              title={t('Regalansicht')}
              aria-label={t('Regalansicht')}
              style={toggleStyle(displayView === 'shelf')}
            >
              <LocalLibrary fontSize="small" />
            </button>
          </>
        )}
      </div>

      {(query || activeFilters > 0) && (
        <div className="rl-result-line" style={{ color: currentTheme.text.muted }}>
          {t('{n} Titel', { n: filtered.length })}
          {activeFilters > 0 && (
            <button
              type="button"
              className="rl-reset"
              onClick={resetFilters}
              style={{ color: currentTheme.primary }}
            >
              {t('Filter zurücksetzen')}
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rf-empty" style={{ color: currentTheme.text.muted }}>
          {query || activeFilters > 0 ? t('Nichts gefunden') : t('Hier steht noch nichts.')}
        </div>
      ) : onHiddenTab && !selecting ? (
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
      ) : displayView === 'shelf' ? (
        <div className="rl-shelves">
          {byYear ? (
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
                <Bookshelf
                  books={shelfBooks(group)}
                  hrefFor={libraryHref}
                  onLongPress={(book) =>
                    selecting ? selection.toggle(shelfKey(book)) : selection.start(shelfKey(book))
                  }
                  selection={shelfSelection}
                />
              </div>
            ))
          ) : (
            <Bookshelf
              books={shelfBooks(visible)}
              hrefFor={libraryHref}
              onLongPress={(book) =>
                selecting ? selection.toggle(shelfKey(book)) : selection.start(shelfKey(book))
              }
              selection={shelfSelection}
            />
          )}
        </div>
      ) : (
        <div className="ratings-grid">
          {visible.map((item) => (
            <RatingReadCard
              key={item.key}
              item={item}
              theme={currentTheme}
              selected={selecting ? selection.has(item.key) : undefined}
              pressProps={press(item.key)}
              onOpen={() => (selecting ? selection.toggle(item.key) : navigate(itemHref(item)))}
            />
          ))}
        </div>
      )}

      {remaining > 0 && (
        <button
          type="button"
          className="bk-chip-btn rl-more"
          onClick={() => setLimit({ key: viewKey, n: shown + pageSize })}
          style={{ color: currentTheme.text.secondary }}
        >
          {t('Mehr anzeigen')}
          <span style={{ color: currentTheme.text.muted, fontWeight: 600 }}>{remaining}</span>
        </button>
      )}
      <div style={{ height: selecting ? 150 : 96 }} />

      {!selecting && (
        <Tooltip title={t('Filter & Sortierung')} arrow>
          <button
            type="button"
            data-fab
            className="rl-fab"
            onClick={() => setFiltersOpen(true)}
            aria-label={t('Filter & Sortierung')}
            style={{
              // Inline, damit die mitwandernde Zurück-Leiste über dem Knopf andockt (liest style.bottom).
              bottom: 'calc(var(--dock-top) + 12px)',
              background: `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}cc 100%)`,
              color: currentTheme.text.secondary,
              boxShadow: `0 4px 20px ${currentTheme.accent}50, 0 2px 8px rgba(0, 0, 0, 0.2)`,
            }}
          >
            <FilterList />
            {activeFilters > 0 && (
              <span className="rl-fab-count" style={{ background: currentTheme.primary }}>
                {activeFilters}
              </span>
            )}
          </button>
        </Tooltip>
      )}

      <BottomSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        ariaLabel={t('Filter & Sortierung')}
      >
        {filtersOpen && (
          <div className="rl-filter-panel">
            <div className="rl-filter-head">
              <GradientText
                as="h2"
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  margin: 0,
                }}
              >
                {t('Filter & Sortierung')}
              </GradientText>
              {activeFilters > 0 && (
                <button
                  type="button"
                  className="rl-filter-reset"
                  onClick={resetFilters}
                  style={{
                    background: `${currentTheme.accent}1a`,
                    borderColor: `${currentTheme.accent}4d`,
                    color: currentTheme.accent,
                  }}
                >
                  {t('Zurücksetzen')}
                </button>
              )}
            </div>

            <FilterSection label={t('Lesestatus')} columns={2}>
              {STATUS_FILTERS.filter((f) => f === 'all' || counts[f] > 0).map((f) => (
                <FilterTile key={f} active={f === status} onClick={() => setParam('status', f)}>
                  {f !== 'all' && STATUS_COLORS[f] && (
                    <span className="manga-pill-dot" style={{ background: STATUS_COLORS[f] }} />
                  )}
                  <span className="rl-filter-tile-label">{STATUS_LABEL[f]()}</span>
                  <span className="rl-filter-tile-count">{counts[f]}</span>
                </FilterTile>
              ))}
            </FilterSection>

            {mediums.length > 1 && (
              <FilterSection label={t('Medium')} columns={mediums.length > 3 ? 3 : mediums.length}>
                {mediums.map((m) => (
                  <FilterTile
                    key={m}
                    active={m === medium}
                    center
                    onClick={() => setParam('medium', m)}
                  >
                    {MEDIUM_LABEL[m]()}
                  </FilterTile>
                ))}
              </FilterSection>
            )}

            {!onHiddenTab && (
              <FilterSection label={t('Sortierung')}>
                <ThemedSelect
                  value={encodeSortPref(sort, flip)}
                  ariaLabel={t('Sortierung')}
                  width="100%"
                  onChange={(value) => {
                    const [key, flipped] = value.split(':') as [LibrarySortKey, string];
                    const next = { sort: key, flip: flipped === '1' };
                    setSortPref(next);
                    storage.set('readingLibrarySort', value);
                  }}
                  options={LIBRARY_SORTS.flatMap((key) =>
                    [false, true].map((flipped) => {
                      const desc = LIBRARY_DEFAULT_DESC[key] !== flipped;
                      return {
                        value: encodeSortPref(key, flipped),
                        label: `${SORT_LABEL[key]()} ${desc ? '↓' : '↑'}`,
                      };
                    })
                  )}
                />
              </FilterSection>
            )}

            {genres.length > 1 && (
              <FilterSection label={t('Genre')} columns={3} scroll>
                {[{ key: null, name: t('Alle'), count: base.length }, ...genres].map((g) => (
                  <FilterTile
                    key={g.key ?? 'all'}
                    active={g.key === activeGenre}
                    center
                    small
                    onClick={() => setGenre(g.key)}
                  >
                    {g.name}
                  </FilterTile>
                ))}
              </FilterSection>
            )}
          </div>
        )}
      </BottomSheet>

      {selecting && (
        <SelectionBar
          count={picked.length}
          total={filtered.length}
          allSelected={selection.allSelected}
          onToggleAll={selection.toggleAll}
          onClose={selection.exit}
          actions={bulkActions}
          busy={bulk.busy}
        />
      )}
      <ChoiceSheet
        open={bulkSheet === 'read'}
        title={t('Als gelesen markieren')}
        subtitle={t('{n} Titel', { n: picked.length })}
        choices={readChoices}
        onClose={() => setBulkSheet(null)}
      />
      <ChoiceSheet
        open={bulkSheet === 'status'}
        title={t('Status ändern')}
        subtitle={t('{n} Titel', { n: picked.length })}
        choices={statusChoices}
        onClose={() => setBulkSheet(null)}
      />
    </>
  );
};

const FilterSection = ({
  label,
  columns,
  scroll = false,
  children,
}: {
  label: string;
  columns?: number;
  scroll?: boolean;
  children: React.ReactNode;
}) => {
  const { currentTheme } = useTheme();
  return (
    <div className="rl-filter-section">
      <span className="rl-filter-label" style={{ color: currentTheme.text.secondary }}>
        {label}
      </span>
      {columns ? (
        <div
          className={`rl-filter-grid${scroll ? ' rl-filter-grid--scroll' : ''}`}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

/** Kachel im Stil des Serien-/Film-Filters (Glas, aktiv im Akzentverlauf). */
const FilterTile = ({
  active,
  center = false,
  small = false,
  onClick,
  children,
}: {
  active: boolean;
  center?: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  const { currentTheme } = useTheme();
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`rl-filter-tile${center ? ' rl-filter-tile--center' : ''}${small ? ' rl-filter-tile--small' : ''}`}
      onClick={onClick}
      style={{
        background: active
          ? `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}cc 100%)`
          : 'var(--glass-medium)',
        borderColor: active ? 'transparent' : currentTheme.border.default,
        color: currentTheme.text.secondary,
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
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
