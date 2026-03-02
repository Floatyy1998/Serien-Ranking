import { ExpandLess, ExpandMore, Refresh } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader, CatchUpDialog } from '../../components/ui';
import { BulkActionBar } from './BulkActionBar';
import { EpisodeListItem } from './EpisodeListItem';
import { useEpisodeManagement } from './useEpisodeManagement';
import './EpisodeManagementPage.css';

export const EpisodeManagementPage = () => {
  const {
    series,
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
  } = useEpisodeManagement();

  if (!series) {
    return (
      <div className="mobile-episode-page">
        <PageHeader title="Serie nicht gefunden" sticky={false} />
      </div>
    );
  }

  return (
    <div className="mobile-episode-page">
      {/* Header */}
      <PageHeader title={series.title} subtitle="Episoden verwalten" sticky={false} />

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
    </div>
  );
};

/* ------------------------------------------------
   Local sub-components (composition helpers)
   ------------------------------------------------ */

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
      <Tooltip title="Vorherige Staffel" arrow>
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

      <Tooltip title="Nächste Staffel" arrow>
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
  if (!open || !episode) return null;

  return (
    <div className="watch-dialog-overlay" onClick={onClose}>
      <motion.div
        className="watch-dialog"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3>{episode.name}</h3>
          <p>Aktuell: {episode.watchCount || 1}x gesehen</p>
        </div>

        <div className="dialog-buttons">
          <button className="dialog-button increase" onClick={onIncrease}>
            +1 (nochmal gesehen)
          </button>
          <button className="dialog-button decrease" onClick={onDecrease}>
            -1 (weniger gesehen)
          </button>
          <button className="dialog-button cancel" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </motion.div>
    </div>
  );
}
