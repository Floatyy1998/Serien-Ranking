/**
 * RecentlyWatchedComponents - Memoized subcomponents for RecentlyWatchedPage
 * Extracted JSX blocks to keep the main page file composition-only.
 */

import {
  CalendarToday,
  ChatBubbleOutline,
  Check,
  ExpandLess,
  ExpandMore,
  History,
  PlayCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiscussionCount } from '../../hooks/useDiscussionCounts';
import type { WatchedEpisode } from './EpisodeDataManager';
import type { TimeRange } from './useRecentlyWatched';

// ── Discussion indicator badge ──────────────────────────────────────────────

export const EpisodeDiscussionIndicator: React.FC<{
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  onClick?: () => void;
}> = memo(({ seriesId, seasonNumber, episodeNumber, onClick }) => {
  const { currentTheme } = useTheme();
  const count = useDiscussionCount('episode', seriesId, seasonNumber, episodeNumber);

  if (count === 0) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={`${count} Diskussion${count !== 1 ? 'en' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: `${currentTheme.primary}15`,
        border: `1px solid ${currentTheme.primary}30`,
        borderRadius: '8px',
        color: currentTheme.primary,
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
      }}
    >
      <ChatBubbleOutline style={{ fontSize: '15px' }} />
      {count}
    </button>
  );
});
EpisodeDiscussionIndicator.displayName = 'EpisodeDiscussionIndicator';

// ── Episode count badge (header action) ─────────────────────────────────────

export const EpisodeCountBadge = memo<{ totalEpisodes: number }>(({ totalEpisodes }) => {
  const { currentTheme } = useTheme();

  if (totalEpisodes <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{ display: 'flex', gap: '8px' }}
    >
      <div
        style={{
          padding: '6px 12px',
          borderRadius: '12px',
          background: `${currentTheme.status.success}15`,
          border: `1px solid ${currentTheme.status.success}30`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <PlayCircle style={{ fontSize: 16, color: currentTheme.status.success }} />
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: currentTheme.status.success,
          }}
        >
          {totalEpisodes}
        </span>
      </div>
    </motion.div>
  );
});
EpisodeCountBadge.displayName = 'EpisodeCountBadge';

// ── Search bar ──────────────────────────────────────────────────────────────

export const SearchBar = memo<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
}>(({ searchQuery, onSearchChange }) => {
  const { currentTheme } = useTheme();

  return (
    <div className="rw-search-bar">
      <input
        type="text"
        placeholder="Serie suchen..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="rw-search-input"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          color: currentTheme.text.primary,
        }}
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="rw-search-clear"
          style={{
            background: `${currentTheme.text.muted}20`,
            color: currentTheme.text.muted,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
});
SearchBar.displayName = 'SearchBar';

// ── Time range chip bar ─────────────────────────────────────────────────────

export const TimeRangeChips = memo<{
  timeRanges: TimeRange[];
  daysToShow: number;
  onTimeRangeChange: (days: number) => void;
}>(({ timeRanges, daysToShow, onTimeRangeChange }) => {
  const { currentTheme } = useTheme();

  return (
    <div className="rw-time-range-chips">
      {timeRanges.map((range) => (
        <motion.button
          key={range.days}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTimeRangeChange(range.days)}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            background:
              daysToShow === range.days
                ? `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.primary})`
                : currentTheme.background.surface,
            boxShadow:
              daysToShow === range.days ? `0 4px 12px ${currentTheme.status.success}40` : 'none',
            color:
              daysToShow === range.days ? currentTheme.text.secondary : currentTheme.text.secondary,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {range.label}
        </motion.button>
      ))}
    </div>
  );
});
TimeRangeChips.displayName = 'TimeRangeChips';

// ── Empty state ─────────────────────────────────────────────────────────────

export const EmptyState = memo<{ searchQuery: string; daysToShow: number }>(
  ({ searchQuery, daysToShow }) => {
    const { currentTheme } = useTheme();

    return (
      <motion.div
        key="empty"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rw-empty-state"
      >
        <div className="rw-empty-icon" style={{ background: `${currentTheme.text.muted}10` }}>
          <History style={{ fontSize: '48px', color: currentTheme.text.muted }} />
        </div>
        <h2 className="rw-empty-title">Keine Episoden gefunden</h2>
        <p style={{ margin: 0, color: currentTheme.text.muted, fontSize: '15px' }}>
          {searchQuery
            ? `Keine Ergebnisse für "${searchQuery}"`
            : `In den letzten ${daysToShow} Tagen keine Episoden gesehen`}
        </p>
      </motion.div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

// ── Date group header ───────────────────────────────────────────────────────

export const DateGroupHeader = memo<{
  displayDate: string;
  episodeCount: number;
}>(({ displayDate, episodeCount }) => {
  const { currentTheme } = useTheme();
  const isToday = displayDate === 'Heute';
  const isYesterday = displayDate === 'Gestern';

  return (
    <div
      className="rw-date-header"
      style={{
        background: isToday
          ? `linear-gradient(135deg, ${currentTheme.status.success}20, ${currentTheme.primary}15)`
          : currentTheme.background.surface,
        border: `1px solid ${isToday ? currentTheme.status.success : currentTheme.border.default}40`,
      }}
    >
      <CalendarToday
        style={{
          fontSize: '18px',
          color: isToday ? currentTheme.status.success : currentTheme.text.muted,
        }}
      />
      <h2
        className="rw-date-title"
        style={{
          color: isToday || isYesterday ? currentTheme.status.success : currentTheme.text.primary,
        }}
      >
        {displayDate}
      </h2>
      <span
        className="rw-date-count"
        style={{
          color: currentTheme.text.muted,
          background: `${currentTheme.text.muted}15`,
        }}
      >
        {episodeCount} Ep.
      </span>
    </div>
  );
});
DateGroupHeader.displayName = 'DateGroupHeader';

// ── Single episode card ─────────────────────────────────────────────────────

export const SingleEpisodeCard = memo<{
  episode: WatchedEpisode;
  isCompleting: boolean;
  onRewatch: (episode: WatchedEpisode) => void;
  onNavigateToSeries: (seriesId: number) => void;
  onNavigateToEpisode: (seriesId: number, seasonNumber: number, episodeNumber: number) => void;
  onNavigateToDiscussion: (seriesId: number, seasonNumber: number, episodeNumber: number) => void;
}>(
  ({
    episode,
    isCompleting,
    onRewatch,
    onNavigateToSeries,
    onNavigateToEpisode,
    onNavigateToDiscussion,
  }) => {
    const { currentTheme } = useTheme();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: isCompleting ? 0.6 : 1,
          x: 0,
          scale: isCompleting ? 0.98 : 1,
        }}
        className="rw-episode-card"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <img
          src={episode.seriesPoster}
          alt={episode.seriesName}
          loading="lazy"
          decoding="async"
          onClick={() => onNavigateToSeries(episode.seriesId)}
          className="rw-episode-poster"
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            onClick={() => onNavigateToSeries(episode.seriesId)}
            className="rw-episode-series-name"
            style={{ color: currentTheme.text.primary }}
          >
            {episode.seriesName}
          </h3>

          <p
            onClick={() =>
              onNavigateToEpisode(episode.seriesId, episode.seasonNumber, episode.episodeNumber)
            }
            className="rw-episode-info"
            style={{ color: currentTheme.text.secondary }}
          >
            S{episode.seasonNumber} E{episode.episodeNumber} &bull; {episode.episodeName}
          </p>

          <div className="rw-episode-badges">
            {episode.watchCount > 1 && (
              <span
                className="rw-badge-watch-count"
                style={{
                  background: `${currentTheme.primary}15`,
                  color: currentTheme.primary,
                }}
              >
                Rewatch ({episode.watchCount}x)
              </span>
            )}
            {episode.dateSource !== 'firstWatched' && episode.watchCount <= 1 && (
              <span className="rw-badge-date-source">
                {episode.dateSource === 'lastWatched'
                  ? 'zuletzt'
                  : episode.dateSource === 'airDate'
                    ? 'Ausstrahlung'
                    : 'geschätzt'}
              </span>
            )}
          </div>
        </div>

        <div className="rw-episode-actions">
          <EpisodeDiscussionIndicator
            seriesId={episode.seriesId}
            seasonNumber={episode.seasonNumber}
            episodeNumber={episode.episodeNumber}
            onClick={() =>
              onNavigateToDiscussion(episode.seriesId, episode.seasonNumber, episode.episodeNumber)
            }
          />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onRewatch(episode)}
            className="rw-rewatch-btn"
            style={{
              background: `${currentTheme.status.success}15`,
              border: `1px solid ${currentTheme.status.success}30`,
              color: currentTheme.status.success,
            }}
          >
            {isCompleting ? (
              <Check style={{ fontSize: '20px' }} />
            ) : (
              <PlayCircle style={{ fontSize: '20px' }} />
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  }
);
SingleEpisodeCard.displayName = 'SingleEpisodeCard';

// ── Multi-episode accordion (series with multiple episodes on same day) ─────

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
