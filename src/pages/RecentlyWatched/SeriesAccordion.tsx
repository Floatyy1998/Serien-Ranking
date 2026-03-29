import { Check, ExpandLess, ExpandMore, PlayCircle } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { WatchedEpisode } from './EpisodeDataManager';
import { EpisodeDiscussionIndicator } from './RecentlyWatchedComponents';

export const SeriesAccordion = memo<{
  seriesId: number;
  episodes: WatchedEpisode[];
  dateKey: string;
  isExpanded: boolean;
  completingEpisodes: Set<string>;
  relativeDateLabel: string;
  onToggle: (date: string, seriesId: number) => void;
  onRewatch: (episode: WatchedEpisode) => void;
  onNavigateToSeries: (seriesId: number) => void;
  onNavigateToEpisode: (seriesId: number, seasonNumber: number, episodeNumber: number) => void;
  onNavigateToDiscussion: (seriesId: number, seasonNumber: number, episodeNumber: number) => void;
}>(
  ({
    seriesId,
    episodes,
    dateKey,
    isExpanded,
    completingEpisodes,
    relativeDateLabel,
    onToggle,
    onRewatch,
    onNavigateToSeries,
    onNavigateToEpisode,
    onNavigateToDiscussion,
  }) => {
    const { currentTheme } = useTheme();
    const firstEpisode = episodes[0];

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rw-accordion"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {/* Accordion header */}
        <div onClick={() => onToggle(dateKey, seriesId)} className="rw-accordion-header">
          <img
            src={firstEpisode.seriesPoster}
            alt={firstEpisode.seriesName}
            loading="lazy"
            decoding="async"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToSeries(firstEpisode.seriesId);
            }}
            className="rw-accordion-poster"
          />

          <div style={{ flex: 1 }}>
            <h3 className="rw-accordion-series-name" style={{ color: currentTheme.text.primary }}>
              {firstEpisode.seriesName}
            </h3>

            <div className="rw-accordion-meta">
              <span
                className="rw-accordion-count"
                style={{
                  background: `${currentTheme.status.success}15`,
                  color: currentTheme.status.success,
                }}
              >
                {episodes.length} Episoden
              </span>
              {episodes.some((ep) => ep.watchCount > 1) && (
                <span
                  className="rw-accordion-count"
                  style={{
                    background: `${currentTheme.primary}15`,
                    color: currentTheme.primary,
                  }}
                >
                  Rewatch
                </span>
              )}
            </div>

            <p className="rw-accordion-date" style={{ color: currentTheme.text.muted }}>
              {relativeDateLabel}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', color: currentTheme.text.muted }}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </div>
        </div>

        {/* Expanded episode list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                borderTop: `1px solid ${currentTheme.border.default}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px' }}>
                {episodes.map((episode, idx) => {
                  const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                  const isCompleting = completingEpisodes.has(episodeKey);

                  return (
                    <motion.div
                      key={episodeKey}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rw-accordion-episode"
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : `${currentTheme.text.muted}05`,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          onClick={() =>
                            onNavigateToEpisode(
                              episode.seriesId,
                              episode.seasonNumber,
                              episode.episodeNumber
                            )
                          }
                          className="rw-accordion-episode-name"
                          style={{ color: currentTheme.text.primary }}
                        >
                          S{episode.seasonNumber} E{episode.episodeNumber} &bull;{' '}
                          {episode.episodeName}
                        </p>
                        {episode.watchCount > 1 && (
                          <p
                            className="rw-accordion-watch-count"
                            style={{ color: currentTheme.primary }}
                          >
                            Rewatch ({episode.watchCount}x)
                          </p>
                        )}
                      </div>

                      <EpisodeDiscussionIndicator
                        seriesId={episode.seriesId}
                        seasonNumber={episode.seasonNumber}
                        episodeNumber={episode.episodeNumber}
                        onClick={() =>
                          onNavigateToDiscussion(
                            episode.seriesId,
                            episode.seasonNumber,
                            episode.episodeNumber
                          )
                        }
                      />

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRewatch(episode);
                        }}
                        className="rw-rewatch-btn-small"
                        style={{
                          background: `${currentTheme.status.success}15`,
                          border: `1px solid ${currentTheme.status.success}30`,
                          color: currentTheme.status.success,
                        }}
                      >
                        {isCompleting ? (
                          <Check style={{ fontSize: '16px' }} />
                        ) : (
                          <PlayCircle style={{ fontSize: '16px' }} />
                        )}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);
SeriesAccordion.displayName = 'SeriesAccordion';
