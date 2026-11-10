/**
 * RatingsPage - Performance-Optimized Ratings Collection
 *
 * Slim composition component. Business logic lives in useRatingsData.
 * Subcomponents: RatingsHeader, RatingItemCard, RatingsEmptyState.
 *
 * Key optimizations:
 * - CSS content-visibility:auto for native browser virtualization
 * - CSS Grid media queries instead of JS window.innerWidth
 * - Pre-computed ratings & progress in useMemo (calculated once)
 * - React.memo on grid items to prevent unnecessary re-renders
 * - Event delegation: single click handler on grid container
 * - No Framer Motion on grid items
 * - Progressive rendering via rAF batches
 */

import {
  Album,
  Checklist,
  GridView,
  MoreHoriz,
  PlaylistAdd,
  PlaylistRemove,
  ViewList,
  Visibility,
} from '@mui/icons-material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBooksList } from '../../contexts/BooksListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { usePersistedState } from '../../hooks/data/usePersistedState';
import { useMangaList } from '../../contexts/MangaListContext';
import { useReadingAreas } from '../../hooks/ui/useReadingAreas';
import { buildLibrary } from '../../lib/reading/library';
import { usesArea } from '../../lib/reading/readingMedium';
import { ReadingLibrary } from '../Reading/library/ReadingLibrary';
import { t } from '../../services/i18n';
import { QuickFilter, SkeletonRatingsGrid } from '../../components/ui';
import { ChoiceSheet, type Choice } from '../../components/ui/selection/ChoiceSheet';
import { SelectionBar, type SelectionAction } from '../../components/ui/selection/SelectionBar';
import { openMediaActions } from '../../features/mediaActions/openMediaActions';
import { useLongPress } from '../../hooks/ui/useLongPress';
import { useSelection } from '../../hooks/ui/useSelection';
import { RatingCompactRow } from './RatingCompactRow';
import { RatingFolderActionsSheet, RatingFolderBar, RatingFolderGrid } from './RatingFolderGrid';
import { RatingFolderSheet, type RatingFolderSheetState } from './RatingFolderSheet';
import { ShareFolderSheet } from './ShareFolderSheet';
import { deleteFolderWithUndo } from './deleteFolderWithUndo';
import {
  folderDisplayName,
  folderItemKey,
  isRewatchFolder,
  withRewatchFolder,
} from '../../lib/rating/ratingFolders';
import { RatingItemCard } from './RatingItemCard';
import { RatingsEmptyState } from './RatingsEmptyState';
import { RatingsHeader } from './RatingsHeader';
import { useRatingsBulk } from './useRatingsBulk';
import { useRatingsData } from './useRatingsData';
import type { PreparedItem } from './ratingsHelpers';

const selectKey = (item: Pick<PreparedItem, 'id' | 'isMovie'>) =>
  `${item.isMovie ? 'm' : 's'}-${item.id}`;

/** Schlüssel der angetippten Karte (Event-Delegation über das Raster). */
const keyFromEvent = (e: React.SyntheticEvent): string | null => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('.ratings-grid-item');
  if (!el?.dataset.id) return null;
  return `${el.dataset.movie !== undefined ? 'm' : 's'}-${el.dataset.id}`;
};

type BulkSheet = 'watched' | 'list' | null;
import './RatingsPage.css';

export const RatingsPage: React.FC = () => {
  const { currentTheme, getMobilePageBackground } = useTheme();

  const {
    user,
    activeTab,
    itemsToRender,
    currentItems,
    seriesCount,
    moviesCount,
    stats,
    filters,
    handleTabChange,
    handleQuickFilterChange,
    handleGridClick,
    scrollRef,
    quickFilter,
    folders,
    activeFolder,
    folderPreviews,
    handleFolderChange,
  } = useRatingsData();

  // Reiter „Lesen": Bücher und Manga zusammen — die ganze Bibliothek mit ihren Filtern.
  const { bookList, hiddenBookList, loading: booksLoading } = useBooksList();
  const { mangaList, hiddenMangaList, loading: mangaLoading } = useMangaList();
  const areas = useReadingAreas();
  const readingItems = useMemo(
    () =>
      buildLibrary({
        books: bookList,
        hiddenBooks: hiddenBookList,
        manga: mangaList,
        hiddenManga: hiddenMangaList,
        showBooks: usesArea(areas, 'books'),
        showManga: usesArea(areas, 'manga'),
        uid: user?.uid,
      }),
    [areas, bookList, hiddenBookList, mangaList, hiddenMangaList, user?.uid]
  );
  const readingCount = useMemo(() => readingItems.filter((i) => !i.hidden).length, [readingItems]);
  const onBooks = activeTab === 'books';
  const headerStats = useMemo(() => {
    if (!onBooks) return stats;
    const rated = readingItems.filter((i) => !i.hidden && i.rating > 0);
    const sum = rated.reduce((total, i) => total + i.rating, 0);
    return { count: rated.length, average: rated.length ? sum / rated.length : 0 };
  }, [onBooks, readingItems, stats]);
  const readingLoading = booksLoading || mangaLoading;
  useEffect(() => {
    if (onBooks && !readingLoading && readingItems.length === 0) handleTabChange('series');
  }, [onBooks, readingLoading, readingItems.length, handleTabChange]);

  const folderOverview = activeTab === 'folders' && !activeFolder;
  const folderSearch = (filters.search || '').trim().toLowerCase();
  const visibleFolders = useMemo(
    () =>
      folderSearch
        ? folders.filter((f) => folderDisplayName(f).toLowerCase().includes(folderSearch))
        : folders,
    [folders, folderSearch]
  );

  // Ordner öffnen/verlassen startet oben, statt die Scrollhöhe der Übersicht zu erben.
  const openFolderId = activeFolder?.id ?? null;
  const lastFolderId = useRef(openFolderId);
  useEffect(() => {
    if (lastFolderId.current === openFolderId) return;
    lastFolderId.current = openFolderId;
    for (let el = scrollRef.current?.parentElement; el; el = el.parentElement) {
      if (el.scrollTop > 0) el.scrollTo({ top: 0 });
    }
    if (window.scrollY > 0) window.scrollTo(0, 0);
  }, [openFolderId, scrollRef]);

  const [actionFolder, setActionFolder] = useState<NonNullable<typeof activeFolder> | null>(null);
  const [shareFolderId, setShareFolderId] = useState<string | null>(null);
  const shareFolder = useMemo(
    () => (shareFolderId ? (folders.find((f) => f.id === shareFolderId) ?? null) : null),
    [folders, shareFolderId]
  );
  const [folderSheet, setFolderSheet] = useState<RatingFolderSheetState>({ open: false });
  const openNewFolder = useCallback(() => setFolderSheet({ open: true, folder: null }), []);
  const openEditFolder = useCallback(
    (folder: NonNullable<typeof activeFolder>) => setFolderSheet({ open: true, folder }),
    []
  );
  const closeFolderSheet = useCallback(() => setFolderSheet({ open: false }), []);
  const handleFolderDeleted = useCallback(
    (id: string) => {
      if (activeFolder?.id === id) handleFolderChange(null);
    },
    [activeFolder, handleFolderChange]
  );

  // D5 — Dichte-Modus: Cinematic-Grid ↔ Kompakt-Zeilen (persistiert lokal).
  const [density, setDensity] = usePersistedState<'cinematic' | 'compact'>(
    'ratingsDensity',
    'cinematic'
  );
  const { allSeriesList } = useSeriesList();
  const seriesById = useMemo(() => {
    const map = new Map<number, (typeof allSeriesList)[number]>();
    for (const s of allSeriesList) map.set(s.id, s);
    return map;
  }, [allSeriesList]);

  // Rang nur zeigen, wenn die effektive Sortierung rating-desc ist (spiegelt
  // effectiveSortBy aus useRatingsData: „recently-added" erzwingt date-desc,
  // „ongoing" erzwingt rating-desc).
  const rankedByRating =
    quickFilter !== 'recently-added' &&
    (quickFilter === 'ongoing' || (filters.sortBy || 'rating-desc') === 'rating-desc');

  const selectable = !onBooks && !folderOverview;
  const selectableKeys = useMemo(
    () => (selectable ? currentItems.map(selectKey) : []),
    [selectable, currentItems]
  );
  const selection = useSelection(selectableKeys);
  const selecting = selection.active && selectable;
  const picked = useMemo(
    () => (selecting ? currentItems.filter((i) => selection.has(selectKey(i))) : []),
    [selecting, currentItems, selection]
  );
  const bulk = useRatingsBulk();
  const [bulkSheet, setBulkSheet] = useState<BulkSheet>(null);
  const press = useLongPress<string>((key) =>
    selection.active ? selection.toggle(key) : selection.start(key)
  );
  const onGridClick = (e: React.MouseEvent) => {
    if (!selecting) return handleGridClick(e);
    const key = keyFromEvent(e);
    if (key) selection.toggle(key);
  };
  const changeTab = (id: string) => {
    selection.exit();
    handleTabChange(id);
  };
  const changeFolder = (id: string | null) => {
    selection.exit();
    handleFolderChange(id);
  };

  const finish = (ok: boolean) => {
    if (ok) selection.exit();
  };
  const anyMovie = picked.some((i) => i.isMovie);
  const allOwned = picked.length > 0 && picked.every((i) => i.owned);
  const single = picked.length === 1 ? picked[0] : null;
  const bulkActions = (
    [
      {
        key: 'watched',
        label: t('Gesehen'),
        icon: <Visibility style={{ fontSize: 20 }} />,
        primary: true,
        // Nur Filme kennen „früher gesehen"; Serien bekommen alle erschienenen Folgen.
        onClick: () =>
          anyMovie ? setBulkSheet('watched') : void bulk.markWatched(picked, false).then(finish),
      },
      {
        key: 'owned',
        label: allOwned ? t('Nicht im Besitz') : t('Im Besitz'),
        icon: <Album style={{ fontSize: 20 }} />,
        onClick: () => void bulk.setOwned(picked, !allOwned).then(finish),
      },
      {
        key: 'list',
        label: t('Liste'),
        icon: <PlaylistAdd style={{ fontSize: 20 }} />,
        onClick: () => setBulkSheet('list'),
      },
      activeFolder && {
        key: 'unlist',
        label: t('Aus Liste'),
        icon: <PlaylistRemove style={{ fontSize: 20 }} />,
        onClick: () => void bulk.removeFromFolder(picked, activeFolder).then(finish),
      },
      single && {
        key: 'more',
        label: t('Mehr'),
        icon: <MoreHoriz style={{ fontSize: 20 }} />,
        onClick: () => {
          selection.exit();
          openMediaActions({
            type: single.isMovie ? 'movie' : 'series',
            id: single.id,
            title: single.title,
            poster: single.posterUrl,
          });
        },
      },
    ] as (SelectionAction | false | null)[]
  ).filter((a): a is SelectionAction => !!a);

  const watchedChoices: Choice[] = [
    {
      key: 'today',
      label: t('Heute gesehen'),
      hint: t('Zählt für deinen Jahresrückblick'),
      icon: <Visibility />,
      onPick: () => void bulk.markWatched(picked, false).then(finish),
    },
    {
      key: 'earlier',
      label: t('Früher gesehen'),
      hint: t('Ohne Datum, zählt nicht für dieses Jahr'),
      icon: <Visibility />,
      onPick: () => void bulk.markWatched(picked, true).then(finish),
    },
  ];
  const listChoices: Choice[] = withRewatchFolder(folders)
    .filter((f) => f.id !== activeFolder?.id)
    .map((folder) => ({
      key: folder.id,
      label: folderDisplayName(folder),
      current:
        picked.length > 0 &&
        picked.every((i) => folder.items.has(folderItemKey(i.isMovie ? 'movie' : 'series', i.id))),
      icon: <PlaylistAdd />,
      onPick: () => void bulk.addToFolder(picked, folder).then(finish),
    }));

  if (!user) {
    return (
      <div
        className="ratings-page ratings-page--loading"
        style={{
          background: getMobilePageBackground(),
          color: currentTheme.text.primary,
          paddingTop: 80,
        }}
      >
        <SkeletonRatingsGrid count={12} />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="ratings-page"
      style={{
        background: currentTheme.background.default,
        color: currentTheme.text.primary,
      }}
    >
      {/* Decorative Background */}
      <div
        className="ratings-decorative-bg"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.accent}30, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.primary}20, transparent)
          `,
        }}
      />

      {/* Sticky Header */}
      <RatingsHeader
        theme={currentTheme}
        stats={headerStats}
        activeTab={activeTab}
        seriesCount={seriesCount}
        moviesCount={moviesCount}
        booksCount={readingCount}
        folderCount={folders.length}
        searchValue={filters.search || ''}
        onSearchChange={(v) => handleQuickFilterChange({ search: v })}
        onTabChange={changeTab}
      />

      {/* Items Grid / Kompakt-Liste (D5) */}
      <div className={`ratings-content${selecting ? ' ratings-content--selecting' : ''}`}>
        {folderOverview && (
          <RatingFolderGrid
            theme={currentTheme}
            folders={visibleFolders}
            previews={folderPreviews}
            onOpen={changeFolder}
            onCreate={openNewFolder}
            onLongPress={setActionFolder}
          />
        )}

        {activeFolder && (
          <RatingFolderBar
            theme={currentTheme}
            folder={activeFolder}
            count={folderPreviews[activeFolder.id]?.count ?? 0}
            onBack={() => changeFolder(null)}
            onEdit={() => openEditFolder(activeFolder)}
            onShare={() => setShareFolderId(activeFolder.id)}
          />
        )}

        {itemsToRender.length > 0 && (
          <div className="ratings-density-toggle" role="group" aria-label={t('Ansicht')}>
            {selectable && (
              <button
                type="button"
                className={`ratings-density-btn${selecting ? ' active' : ''}`}
                onClick={() => (selecting ? selection.exit() : selection.start())}
                aria-pressed={selecting}
                title={selecting ? t('Auswahl beenden') : t('Auswählen')}
                aria-label={selecting ? t('Auswahl beenden') : t('Auswählen')}
                style={
                  selecting
                    ? { background: currentTheme.primary, color: currentTheme.background.default }
                    : { color: currentTheme.text.muted }
                }
              >
                <Checklist fontSize="small" />
              </button>
            )}
            <button
              type="button"
              className={`ratings-density-btn${density === 'cinematic' ? ' active' : ''}`}
              onClick={() => setDensity('cinematic')}
              aria-pressed={density === 'cinematic'}
              title={t('Cinematic-Ansicht')}
              style={
                density === 'cinematic'
                  ? { background: currentTheme.primary, color: currentTheme.background.default }
                  : { color: currentTheme.text.muted }
              }
            >
              <GridView fontSize="small" />
            </button>
            <button
              type="button"
              className={`ratings-density-btn${density === 'compact' ? ' active' : ''}`}
              onClick={() => setDensity('compact')}
              aria-pressed={density === 'compact'}
              title={t('Kompakte Listen-Ansicht')}
              style={
                density === 'compact'
                  ? { background: currentTheme.primary, color: currentTheme.background.default }
                  : { color: currentTheme.text.muted }
              }
            >
              <ViewList fontSize="small" />
            </button>
          </div>
        )}

        {onBooks ? (
          <ReadingLibrary items={readingItems} search={filters.search || ''} />
        ) : itemsToRender.length > 0 ? (
          density === 'compact' ? (
            <div
              className="ratings-list"
              data-media-actions="off"
              {...press(keyFromEvent)}
              onClick={onGridClick}
            >
              {itemsToRender.map((item, idx) => (
                <RatingCompactRow
                  key={`${item.isMovie ? 'm' : 's'}-${item.id}`}
                  item={item}
                  series={item.isMovie ? undefined : seriesById.get(item.id)}
                  uid={user?.uid}
                  theme={currentTheme}
                  rank={rankedByRating ? idx + 1 : undefined}
                  selected={selecting ? selection.has(selectKey(item)) : undefined}
                />
              ))}
              <div className="ratings-spacer" />
            </div>
          ) : (
            <div
              className="ratings-grid"
              data-media-actions="off"
              {...press(keyFromEvent)}
              onClick={onGridClick}
            >
              {itemsToRender.map((item) => (
                <RatingItemCard
                  key={`${item.isMovie ? 'm' : 's'}-${item.id}`}
                  item={item}
                  theme={currentTheme}
                  selected={selecting ? selection.has(selectKey(item)) : undefined}
                />
              ))}
              <div className="ratings-spacer" />
            </div>
          )
        ) : activeFolder ? (
          <div className="rf-empty" style={{ color: currentTheme.text.muted }}>
            {(folderPreviews[activeFolder.id]?.count ?? 0) > 0
              ? t('Keine Treffer in dieser Liste')
              : t('Diese Liste ist noch leer')}
            <button
              type="button"
              className="rf-chip"
              onClick={() => openEditFolder(activeFolder)}
              style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
            >
              {t('Titel hinzufügen')}
            </button>
          </div>
        ) : activeTab !== 'folders' && currentItems.length === 0 ? (
          <RatingsEmptyState
            theme={currentTheme}
            activeTab={activeTab}
            hasQuickFilter={!!quickFilter || !!filters.year}
          />
        ) : null}
      </div>

      {selecting && <div style={{ height: 150 }} />}

      {/* QuickFilter FAB */}
      {!folderOverview && !onBooks && !selecting && (
        <QuickFilter
          onFilterChange={handleQuickFilterChange}
          isMovieMode={activeTab === 'movies'}
          isRatingsMode={true}
          initialFilters={filters}
        />
      )}

      {selecting && (
        <SelectionBar
          count={picked.length}
          total={currentItems.length}
          allSelected={selection.allSelected}
          onToggleAll={selection.toggleAll}
          onClose={selection.exit}
          actions={bulkActions}
          busy={bulk.busy}
        />
      )}
      <ChoiceSheet
        open={bulkSheet === 'watched'}
        title={t('Als gesehen markieren')}
        subtitle={
          picked.length > picked.filter((i) => i.isMovie).length
            ? t('Serien bekommen alle erschienenen Folgen')
            : t('{n} Filme', { n: picked.length })
        }
        choices={watchedChoices}
        onClose={() => setBulkSheet(null)}
      />
      <ChoiceSheet
        open={bulkSheet === 'list'}
        title={t('Zu Liste hinzufügen')}
        subtitle={t('{n} Titel', { n: picked.length })}
        choices={listChoices}
        onClose={() => setBulkSheet(null)}
      />

      <RatingFolderActionsSheet
        theme={currentTheme}
        folder={actionFolder}
        onClose={() => setActionFolder(null)}
        onEdit={openEditFolder}
        onShare={(folder) => setShareFolderId(folder.id)}
        onDelete={(folder) => {
          if (user) void deleteFolderWithUndo(user.uid, folder, handleFolderDeleted);
        }}
      />

      <ShareFolderSheet
        theme={currentTheme}
        folder={shareFolder}
        onClose={() => setShareFolderId(null)}
      />

      <RatingFolderSheet
        state={folderSheet}
        onClose={closeFolderSheet}
        onDeleted={handleFolderDeleted}
        offerRewatch={!folders.some(isRewatchFolder)}
      />
    </div>
  );
};
