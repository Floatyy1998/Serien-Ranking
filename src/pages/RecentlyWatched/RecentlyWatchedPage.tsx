/**
 * RecentlyWatchedPage - Premium Watch History
 * Shows recently watched episodes with timeline view.
 *
 * Composition-only: business logic lives in useRecentlyWatched,
 * data management in EpisodeDataManager, UI blocks in RecentlyWatchedComponents.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { LoadingSpinner, PageHeader, PageLayout, ScrollToTopButton } from '../../components/ui';
import { useRecentlyWatched, TIME_RANGES } from './useRecentlyWatched';
import {
  DateGroupHeader,
  EmptyState,
  EpisodeCountBadge,
  SearchBar,
  SeriesAccordion,
  SingleEpisodeCard,
  TimeRangeChips,
} from './RecentlyWatchedComponents';
import './RecentlyWatchedPage.css';

export const RecentlyWatchedPage = memo(() => {
  const { currentTheme } = useTheme();

  const {
    searchQuery,
    setSearchQuery,
    daysToShow,
    isLoading,
    completingEpisodes,
    loadedDateGroups,
    totalEpisodes,
    headerHeight,
    headerRef,
    handleRewatchEpisode,
    toggleSeriesExpanded,
    isSeriesExpanded,
    handleTimeRangeChange,
    navigateToSeries,
    navigateToEpisode,
    navigateToEpisodeDiscussion,
    getRelativeDateLabel,
    groupEpisodesBySeries,
  } = useRecentlyWatched();

  return (
    <PageLayout
      gradientColors={[currentTheme.status.success, currentTheme.primary]}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Fixed Header */}
      <div
        ref={headerRef}
        className="rw-fixed-header"
        style={{ background: `${currentTheme.background.default}ee` }}
      >
        <PageHeader
          title="Verlauf"
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.status.success}
          sticky={false}
          actions={
            totalEpisodes > 0 ? <EpisodeCountBadge totalEpisodes={totalEpisodes} /> : undefined
          }
        />

        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <TimeRangeChips
          timeRanges={TIME_RANGES}
          daysToShow={daysToShow}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>

      {/* Scrollable Episodes Container */}
      <div data-scrollable="episodes" className="rw-scroll-container" style={{ top: headerHeight }}>
        <div className="rw-content-area">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner color={currentTheme.status.success} text="Lade Verlauf..." />
              </motion.div>
            ) : totalEpisodes === 0 ? (
              <EmptyState searchQuery={searchQuery} daysToShow={daysToShow} />
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {loadedDateGroups.map((dateGroup, groupIndex) => {
                  if (dateGroup.episodes.length === 0) return null;

                  const groupedBySeries = groupEpisodesBySeries(dateGroup.episodes);

                  return (
                    <motion.div
                      key={dateGroup.date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.05 }}
                      style={{ marginBottom: '24px' }}
                    >
                      <DateGroupHeader
                        displayDate={dateGroup.displayDate}
                        episodeCount={dateGroup.episodes.length}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(groupedBySeries).map(([seriesId, episodes]) => {
                          if (episodes.length === 1) {
                            const episode = episodes[0];
                            const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

                            return (
                              <SingleEpisodeCard
                                key={episodeKey}
                                episode={episode}
                                isCompleting={completingEpisodes.has(episodeKey)}
                                onRewatch={handleRewatchEpisode}
                                onNavigateToSeries={navigateToSeries}
                                onNavigateToEpisode={navigateToEpisode}
                                onNavigateToDiscussion={navigateToEpisodeDiscussion}
                              />
                            );
                          }

                          return (
                            <SeriesAccordion
                              key={seriesId}
                              seriesId={Number(seriesId)}
                              episodes={episodes}
                              dateKey={dateGroup.date}
                              isExpanded={isSeriesExpanded(dateGroup.date, Number(seriesId))}
                              completingEpisodes={completingEpisodes}
                              relativeDateLabel={getRelativeDateLabel(episodes[0])}
                              onToggle={toggleSeriesExpanded}
                              onRewatch={handleRewatchEpisode}
                              onNavigateToSeries={navigateToSeries}
                              onNavigateToEpisode={navigateToEpisode}
                              onNavigateToDiscussion={navigateToEpisodeDiscussion}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}

                <div className="rw-bottom-spacer" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ScrollToTopButton scrollContainerSelector='[data-scrollable="episodes"]' />
    </PageLayout>
  );
});

RecentlyWatchedPage.displayName = 'RecentlyWatchedPage';
