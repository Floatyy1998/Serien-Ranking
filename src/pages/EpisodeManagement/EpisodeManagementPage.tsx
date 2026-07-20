import { ExpandLess, ExpandMore, Refresh } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { t } from '../../services/i18n';
import { PageHeader, CatchUpDialog, Dialog } from '../../components/ui';
import { QuickRatingSheet } from '../../components/ui/QuickRatingSheet';
import { BulkActionBar } from './BulkActionBar';
import { EpisodeListItem } from './EpisodeListItem';
import { useEpisodeManagement } from './useEpisodeManagement';
import './EpisodeManagementPage.css';

export const EpisodeManagementPage = () => {
  const {
    series,
    seriesLoading,
    showAddPrompt,
    setShowAddPrompt,
    isAddingSeries,
    handleAddFromPrompt,
    currentSeason,
    seriesId,
    selectedSeason,
    setSelectedSeason,
    handleSwipeLeft,
    handleSwipeRight,
    seasonProgress,
    episodeDiscussionCounts,
    isRefreshing,
    scrollContainerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleEpisodeClick,
    handleSeasonToggle,
    handleCatchUp,
    showCatchUpDialog,
    setShowCatchUpDialog,
    showWatchDialog,
    selectedEpisode,
    handleWatchDialogIncrease,
    handleWatchDialogDecrease,
    closeWatchDialog,
    quickRatingOpen,
    quickRatingSeries,
    quickRatingSeasonNumber,
    closeQuickRating,
    saveQuickRating,
  } = useEpisodeManagement();

  if (!series) {
    // Während der TMDB-Fallback für nicht getrackte Serien lädt, keine
    // (falsche) „nicht gefunden"-Meldung zeigen.
    return (
      <div className="mobile-episode-page">
        <PageHeader title={seriesLoading ? '' : t('Serie nicht gefunden')} sticky={false} />
      </div>
    );
  }

  return (
    <div className="mobile-episode-page">
      {/* Header */}
      <PageHeader title={series.title} subtitle={t('Episoden verwalten')} sticky={false} />

      {/* Pull to Refresh Indicator */}
      <RefreshIndicator isRefreshing={isRefreshing} />

      {/* Season Tabs */}
      <SeasonTabs
        seasons={series.seasons}
        selectedSeason={selectedSeason}
        onSelectSeason={setSelectedSeason}
        onPrev={handleSwipeRight}
        onNext={handleSwipeLeft}
        totalSeasons={series.seasons.length}
      />

      {/* Season Progress + Bulk Actions */}
      <BulkActionBar
        seasonNumber={(currentSeason?.seasonNumber ?? 0) + 1}
        seasonProgress={seasonProgress}
        selectedSeason={selectedSeason}
        onSeasonToggle={handleSeasonToggle}
        onMarkAll={(idx) => handleSeasonToggle(idx)}
        onCatchUp={() => setShowCatchUpDialog(true)}
      />

      {/* Episodes List */}
      <div
        className="episodes-container"
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSeason}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="episodes-list"
          >
            {currentSeason?.episodes?.map((episode, index) => (
              <EpisodeListItem
                key={episode.id}
                episode={episode}
                index={index}
                seriesId={seriesId}
                seasonNumber={(currentSeason?.seasonNumber ?? 0) + 1}
                discussionCount={episodeDiscussionCounts[index + 1] || 0}
                onEpisodeClick={() => handleEpisodeClick(selectedSeason, index)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Catch Up Dialog */}
      <CatchUpDialog
        open={showCatchUpDialog}
        onClose={() => setShowCatchUpDialog(false)}
        series={series}
        onConfirm={handleCatchUp}
      />

      {/* Watch Count Dialog */}
      <WatchCountDialog
        open={showWatchDialog}
        episode={selectedEpisode?.episode ?? null}
        onIncrease={handleWatchDialogIncrease}
        onDecrease={handleWatchDialogDecrease}
        onClose={closeWatchDialog}
      />

      {/* Quick Rating Sheet */}
      <QuickRatingSheet
        isOpen={quickRatingOpen}
        onClose={closeQuickRating}
        seriesTitle={quickRatingSeries?.title || ''}
        seasonNumber={quickRatingSeasonNumber}
        onRate={saveQuickRating}
      />

      {/* „Erst hinzufügen"-Prompt für nicht getrackte Serien */}
      <Dialog
        open={showAddPrompt}
        onClose={() => setShowAddPrompt(false)}
        title={t('Serie hinzufügen?')}
        message={t(
          'Diese Serie ist noch nicht in deiner Liste. Füge sie zuerst hinzu, um Folgen abzuhaken.'
        )}
        type="info"
        actions={[
          {
            label: t('Abbrechen'),
            onClick: () => setShowAddPrompt(false),
            variant: 'secondary',
          },
          {
            label: isAddingSeries ? t('Wird hinzugefügt…') : t('Hinzufügen'),
            onClick: () => void handleAddFromPrompt(),
            variant: 'primary',
          },
        ]}
      />
    </div>
  );
};

/** Spinning refresh indicator shown during pull-to-refresh */
function RefreshIndicator({ isRefreshing }: { isRefreshing: boolean }) {
  return (
    <AnimatePresence>
      {isRefreshing && (
        <motion.div
          className="refresh-indicator"
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          exit={{ y: -60 }}
        >
          <Refresh className="spinning" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Horizontal season tab bar with prev/next navigation */
function SeasonTabs({
  seasons,
  selectedSeason,
  onSelectSeason,
  onPrev,
  onNext,
  totalSeasons,
}: {
  seasons: { seasonNumber: number; episodes: { watched: boolean }[] }[];
  selectedSeason: number;
  onSelectSeason: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  totalSeasons: number;
}) {
  return (
    <div className="season-tabs">
      <Tooltip title={t('Vorherige Staffel')} arrow>
        <span>
          <button className="tab-nav-button" onClick={onPrev} disabled={selectedSeason === 0}>
            <ExpandLess />
          </button>
        </span>
      </Tooltip>

      <div className="tabs-container">
        {seasons.map((season, index) => (
          <button
            key={index}
            className={`season-tab ${selectedSeason === index ? 'active' : ''}`}
            onClick={() => onSelectSeason(index)}
          >
            <span className="season-label">S{season.seasonNumber + 1}</span>
            <span className="season-count">
              {season.episodes?.filter((ep) => ep.watched).length || 0}/
              {season.episodes?.length || 0}
            </span>
          </button>
        ))}
      </div>

      <Tooltip title={t('Nächste Staffel')} arrow>
        <span>
          <button
            className="tab-nav-button"
            onClick={onNext}
            disabled={selectedSeason === totalSeasons - 1}
          >
            <ExpandMore />
          </button>
        </span>
      </Tooltip>
    </div>
  );
}

/** Modal dialog to adjust watch count for an already-watched episode */
function WatchCountDialog({
  open,
  episode,
  onIncrease,
  onDecrease,
  onClose,
}: {
  open: boolean;
  episode: { name: string; watchCount?: number } | null;
  onIncrease: () => void;
  onDecrease: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open && !!episode, onClose);

  if (!open || !episode) return null;

  return (
    <div className="watch-dialog-overlay" onClick={onClose}>
      <motion.div
        ref={dialogRef}
        className="watch-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="watch-dialog-title"
        aria-describedby="watch-dialog-desc"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 id="watch-dialog-title">{episode.name}</h3>
          <p id="watch-dialog-desc">{t('Aktuell: {n}x gesehen', { n: episode.watchCount || 1 })}</p>
        </div>

        <div className="dialog-buttons">
          <button className="dialog-button increase" onClick={onIncrease}>
            {t('+1 (nochmal gesehen)')}
          </button>
          <button className="dialog-button decrease" onClick={onDecrease}>
            {t('-1 (weniger gesehen)')}
          </button>
          <button className="dialog-button cancel" onClick={onClose}>
            {t('Abbrechen')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
