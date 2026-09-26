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

import { GridView, ViewList } from '@mui/icons-material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { usePersistedState } from '../../hooks/data/usePersistedState';
import { t } from '../../services/i18n';
import {
  QuickFilter,
  QuickRatingSheet,
  ScrollToTopButton,
  SkeletonRatingsGrid,
} from '../../components/ui';
import { useQuickRatingSheet } from '../../hooks/rating/useQuickRatingSheet';
import { useLongPress } from '../../hooks/ui/useLongPress';
import { hapticTap } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';
import { markMovieWatched } from '../../services/rating/quickRating';
import { RatingCompactRow } from './RatingCompactRow';
import { RatingFolderActionsSheet, RatingFolderBar, RatingFolderGrid } from './RatingFolderGrid';
import { RatingFolderSheet, type RatingFolderSheetState } from './RatingFolderSheet';
import { deleteFolderWithUndo } from './deleteFolderWithUndo';
import { RatingItemActions } from './RatingItemActions';
import { itemFolderKey } from './ratingsHelpers';
import { RatingItemCard } from './RatingItemCard';
import { RatingsEmptyState } from './RatingsEmptyState';
import { RatingsHeader } from './RatingsHeader';
import { useRatingsData, type PreparedItem } from './useRatingsData';
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

  const folderOverview = activeTab === 'folders' && !activeFolder;
  const folderSearch = (filters.search || '').trim().toLowerCase();
  const visibleFolders = useMemo(
    () =>
      folderSearch ? folders.filter((f) => f.name.toLowerCase().includes(folderSearch)) : folders,
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

  const [actionItem, setActionItem] = useState<PreparedItem | null>(null);
  const notify = useCallback((message: string) => showToast(message, 2500), []);
  const { quickRating, openQuickRating, closeQuickRating, saveQuickRating } = useQuickRatingSheet({
    onSaved: notify,
    onError: notify,
  });

  const itemsByKey = useMemo(() => {
    const map = new Map<string, PreparedItem>();
    for (const item of currentItems) map.set(`${item.isMovie ? 'm' : 's'}-${item.id}`, item);
    return map;
  }, [currentItems]);

  const bindItemLongPress = useLongPress<PreparedItem>((item) => {
    hapticTap();
    setActionItem(item);
  });
  const itemLongPress = bindItemLongPress((e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.ratings-grid-item');
    if (!el?.dataset.id) return null;
    const kind = el.dataset.movie !== undefined ? 'm' : 's';
    return itemsByKey.get(`${kind}-${el.dataset.id}`) ?? null;
  });

  const rateItem = useCallback(
    (item: PreparedItem, afterWatched = false) =>
      openQuickRating(
        {
          id: item.id,
          type: item.isMovie ? 'movie' : 'series',
          title: item.title,
          userRating: item.rating,
        },
        afterWatched
      ),
    [openQuickRating]
  );

  const markWatched = useCallback(
    async (item: PreparedItem) => {
      if (!user) return;
      try {
        await markMovieWatched(user.uid, item.id);
        rateItem(item, true);
      } catch {
        showToast(t('Der Gesehen-Status konnte nicht gespeichert werden.'), 2500, 'error');
      }
    },
    [user, rateItem]
  );

  const [actionFolder, setActionFolder] = useState<NonNullable<typeof activeFolder> | null>(null);
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
        stats={stats}
        activeTab={activeTab}
        seriesCount={seriesCount}
        moviesCount={moviesCount}
        folderCount={folders.length}
        searchValue={filters.search || ''}
        onSearchChange={(v) => handleQuickFilterChange({ search: v })}
        onTabChange={handleTabChange}
      />

      {/* Items Grid / Kompakt-Liste (D5) */}
      <div className="ratings-content">
        {folderOverview && (
          <RatingFolderGrid
            theme={currentTheme}
            folders={visibleFolders}
            previews={folderPreviews}
            onOpen={handleFolderChange}
            onCreate={openNewFolder}
            onLongPress={setActionFolder}
          />
        )}

        {activeFolder && (
          <RatingFolderBar
            theme={currentTheme}
            folder={activeFolder}
            count={folderPreviews[activeFolder.id]?.count ?? 0}
            onBack={() => handleFolderChange(null)}
            onEdit={() => openEditFolder(activeFolder)}
          />
        )}

        {itemsToRender.length > 0 && (
          <div className="ratings-density-toggle" role="group" aria-label={t('Ansicht')}>
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

        {itemsToRender.length > 0 ? (
          density === 'compact' ? (
            <div className="ratings-list" onClick={handleGridClick} {...itemLongPress}>
              {itemsToRender.map((item, idx) => (
                <RatingCompactRow
                  key={`${item.isMovie ? 'm' : 's'}-${item.id}`}
                  item={item}
                  series={item.isMovie ? undefined : seriesById.get(item.id)}
                  uid={user?.uid}
                  theme={currentTheme}
                  rank={rankedByRating ? idx + 1 : undefined}
                />
              ))}
              <div className="ratings-spacer" />
            </div>
          ) : (
            <div className="ratings-grid" onClick={handleGridClick} {...itemLongPress}>
              {itemsToRender.map((item) => (
                <RatingItemCard
                  key={`${item.isMovie ? 'm' : 's'}-${item.id}`}
                  item={item}
                  theme={currentTheme}
                />
              ))}
              <div className="ratings-spacer" />
            </div>
          )
        ) : activeFolder ? (
          <div className="rf-empty" style={{ color: currentTheme.text.muted }}>
            {(folderPreviews[activeFolder.id]?.count ?? 0) === 0
              ? t('Diese Liste ist noch leer')
              : t('Keine Treffer in dieser Liste')}
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
            hasQuickFilter={!!quickFilter}
          />
        ) : null}
      </div>

      {/* QuickFilter FAB */}
      {!folderOverview && (
        <QuickFilter
          onFilterChange={handleQuickFilterChange}
          isMovieMode={activeTab === 'movies'}
          isRatingsMode={true}
          initialFilters={filters}
        />
      )}

      <RatingItemActions
        theme={currentTheme}
        item={actionItem}
        folders={folders}
        onClose={() => setActionItem(null)}
        onRate={(item) => rateItem(item)}
        onMarkWatched={(item) => void markWatched(item)}
        onCreateFolder={(item) =>
          setFolderSheet({ open: true, folder: null, preselect: [itemFolderKey(item)] })
        }
      />

      <QuickRatingSheet
        isOpen={quickRating.open}
        onClose={closeQuickRating}
        seriesTitle={quickRating.title}
        eyebrow={quickRating.afterWatched ? t('Als gesehen markiert') : t('In deiner Liste')}
        initialRating={quickRating.initialRating}
        genres={quickRating.genres}
        mediaType={quickRating.mediaType}
        itemId={quickRating.itemId}
        initialGenreRatings={quickRating.genreRatings}
        onRate={saveQuickRating}
      />

      <RatingFolderActionsSheet
        theme={currentTheme}
        folder={actionFolder}
        onClose={() => setActionFolder(null)}
        onEdit={openEditFolder}
        onDelete={(folder) => {
          if (user) void deleteFolderWithUndo(user.uid, folder, handleFolderDeleted);
        }}
      />

      <RatingFolderSheet
        state={folderSheet}
        onClose={closeFolderSheet}
        onDeleted={handleFolderDeleted}
      />

      <ScrollToTopButton scrollContainerSelector=".mobile-content" bottomOffset={72} />
    </div>
  );
};
