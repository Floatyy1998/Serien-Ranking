/** Memoized Subkomponenten der RecentlyWatchedPage. */

import {
  CalendarToday,
  ChatBubbleOutlined,
  Check,
  History,
  Movie,
  PlayCircle,
  StarRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiscussionCount } from '../../hooks/social/discussionCountHooks';
import { EmptyState as UiEmptyState } from '../../components/ui/feedback/EmptyState';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { t } from '../../services/i18n';
import type { WatchedEpisode, WatchedMovie } from './EpisodeDataManager';
import type { TimeRange } from './useRecentlyWatched';
import { tapScale, tapScaleTight } from '../../lib/motion';

export { SeriesAccordion } from './SeriesAccordion';

// Static inline styles hoisted out of render (no per-render allocation in list items)
const DISCUSSION_ICON_STYLE: React.CSSProperties = { fontSize: '15px' };
const CARD_BODY_STYLE: React.CSSProperties = { flex: 1, minWidth: 0 };
const REWATCH_ICON_STYLE: React.CSSProperties = { fontSize: '20px' };

// Discussion indicator badge
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
      title={count === 1 ? t('1 Diskussion') : t('{n} Diskussionen', { n: count })}
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
      <ChatBubbleOutlined style={DISCUSSION_ICON_STYLE} />
      {count}
    </button>
  );
});
EpisodeDiscussionIndicator.displayName = 'EpisodeDiscussionIndicator';

// Discussion indicator badge (movie)
export const MovieDiscussionIndicator: React.FC<{ movieId: number; onClick?: () => void }> = memo(
  ({ movieId, onClick }) => {
    const { currentTheme } = useTheme();
    const count = useDiscussionCount('movie', movieId);

    if (count === 0) return null;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        title={count === 1 ? t('1 Diskussion') : t('{n} Diskussionen', { n: count })}
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
        <ChatBubbleOutlined style={DISCUSSION_ICON_STYLE} />
        {count}
      </button>
    );
  }
);
MovieDiscussionIndicator.displayName = 'MovieDiscussionIndicator';

// Episode + movie count badges (header action)
export const EpisodeCountBadge = memo<{ totalEpisodes: number; totalMovies?: number }>(
  ({ totalEpisodes, totalMovies = 0 }) => {
    const { currentTheme } = useTheme();

    if (totalEpisodes <= 0 && totalMovies <= 0) return null;

    const chip = (color: string, icon: React.ReactNode, value: number) => (
      <div
        style={{
          padding: '6px 12px',
          borderRadius: '12px',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {icon}
        <span style={{ fontSize: '15px', fontWeight: 700, color }}>{value}</span>
      </div>
    );

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        style={{ display: 'flex', gap: '8px' }}
      >
        {totalEpisodes > 0 &&
          chip(
            currentTheme.status.success,
            <PlayCircle style={{ fontSize: 16, color: currentTheme.status.success }} />,
            totalEpisodes
          )}
        {totalMovies > 0 &&
          chip(
            currentTheme.primary,
            <Movie style={{ fontSize: 16, color: currentTheme.primary }} />,
            totalMovies
          )}
      </motion.div>
    );
  }
);
EpisodeCountBadge.displayName = 'EpisodeCountBadge';

// Search bar
export const SearchBar = memo<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
}>(({ searchQuery, onSearchChange }) => {
  const { currentTheme } = useTheme();

  return (
    <div className="rw-search-bar">
      <input
        type="text"
        placeholder={t('Serie oder Film suchen...')}
        aria-label={t('Serie oder Film suchen')}
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
          type="button"
          onClick={() => onSearchChange('')}
          className="rw-search-clear"
          aria-label={t('Suche löschen')}
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

// Time range chip bar
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
          whileTap={tapScale}
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
              daysToShow === range.days
                ? getOptimalTextColor(currentTheme.primary)
                : currentTheme.text.secondary,
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

// Empty state
export const EmptyState = memo<{
  searchQuery: string;
  daysToShow: number;
  onClearSearch: () => void;
}>(({ searchQuery, daysToShow, onClearSearch }) => {
  const { currentTheme } = useTheme();

  return (
    <UiEmptyState
      icon={<History style={{ fontSize: '48px' }} />}
      iconColor={currentTheme.text.muted}
      title={t('Nichts gefunden')}
      description={
        searchQuery
          ? t('Keine Ergebnisse für "{query}"', { query: searchQuery })
          : t('In den letzten {n} Tagen nichts gesehen', { n: daysToShow })
      }
      action={searchQuery ? { label: t('Suche löschen'), onClick: onClearSearch } : undefined}
    />
  );
});
EmptyState.displayName = 'EmptyState';

// Date group header
export const DateGroupHeader = memo<{
  displayDate: string;
  episodeCount: number;
  movieCount?: number;
}>(({ displayDate, episodeCount, movieCount = 0 }) => {
  const { currentTheme } = useTheme();
  const isToday = displayDate === t('Heute');
  const isYesterday = displayDate === t('Gestern');

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
        {[
          episodeCount > 0 ? t('{n} Ep.', { n: episodeCount }) : null,
          movieCount > 0
            ? movieCount === 1
              ? t('1 Film')
              : t('{n} Filme', { n: movieCount })
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </div>
  );
});
DateGroupHeader.displayName = 'DateGroupHeader';

// Single episode card
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
          role="button"
          tabIndex={0}
          aria-label={t('{title} öffnen', { title: episode.seriesName })}
          onClick={() => onNavigateToSeries(episode.seriesId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateToSeries(episode.seriesId);
            }
          }}
          className="rw-episode-poster"
        />

        <div style={CARD_BODY_STYLE}>
          <h3
            role="button"
            tabIndex={0}
            aria-label={t('{title} öffnen', { title: episode.seriesName })}
            onClick={() => onNavigateToSeries(episode.seriesId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigateToSeries(episode.seriesId);
              }
            }}
            className="rw-episode-series-name"
            style={{ color: currentTheme.text.primary }}
          >
            {episode.seriesName}
          </h3>

          <p
            role="button"
            tabIndex={0}
            aria-label={t('Zur Episode S{s} E{e} springen', {
              s: episode.seasonNumber,
              e: episode.episodeNumber,
            })}
            onClick={() =>
              onNavigateToEpisode(episode.seriesId, episode.seasonNumber, episode.episodeNumber)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigateToEpisode(episode.seriesId, episode.seasonNumber, episode.episodeNumber);
              }
            }}
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
                  ? t('zuletzt')
                  : episode.dateSource === 'airDate'
                    ? t('Ausstrahlung')
                    : t('geschätzt')}
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
            type="button"
            whileTap={tapScaleTight}
            onClick={() => onRewatch(episode)}
            className="rw-rewatch-btn"
            aria-label={isCompleting ? t('Als gesehen markiert') : t('Erneut ansehen')}
            style={{
              background: `${currentTheme.status.success}15`,
              border: `1px solid ${currentTheme.status.success}30`,
              color: currentTheme.status.success,
            }}
          >
            {isCompleting ? (
              <Check style={REWATCH_ICON_STYLE} />
            ) : (
              <PlayCircle style={REWATCH_ICON_STYLE} />
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  }
);
SingleEpisodeCard.displayName = 'SingleEpisodeCard';

// Single movie card
export const MovieCard = memo<{
  movie: WatchedMovie;
  onNavigateToMovie: (movieId: number) => void;
}>(({ movie, onNavigateToMovie }) => {
  const { currentTheme } = useTheme();
  const open = () => onNavigateToMovie(movie.movieId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rw-episode-card"
      style={{
        background: currentTheme.background.surface,
        border: `1px solid ${currentTheme.border.default}`,
      }}
    >
      <img
        src={movie.poster}
        alt={movie.title}
        loading="lazy"
        decoding="async"
        role="button"
        tabIndex={0}
        aria-label={t('{title} öffnen', { title: movie.title })}
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        }}
        className="rw-episode-poster"
      />

      <div style={CARD_BODY_STYLE}>
        <h3
          role="button"
          tabIndex={0}
          aria-label={t('{title} öffnen', { title: movie.title })}
          onClick={open}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              open();
            }
          }}
          className="rw-episode-series-name"
          style={{ color: currentTheme.text.primary }}
        >
          {movie.title}
        </h3>

        <p className="rw-episode-info" style={{ color: currentTheme.text.secondary }}>
          {t('Film')}
          {movie.runtime ? ` • ${t('{n} Min.', { n: movie.runtime })}` : ''}
        </p>

        <div className="rw-episode-badges">
          {movie.rating > 0 && (
            <span
              className="rw-badge-watch-count"
              style={{
                background: `${currentTheme.primary}15`,
                color: currentTheme.primary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <StarRounded style={{ fontSize: '14px' }} />
              {movie.rating.toFixed(1)}
            </span>
          )}
          {movie.dateSource === 'rated' && (
            <span className="rw-badge-date-source">{t('bewertet')}</span>
          )}
        </div>
      </div>

      <div className="rw-episode-actions">
        <MovieDiscussionIndicator movieId={movie.movieId} onClick={open} />
      </div>
    </motion.div>
  );
});
MovieCard.displayName = 'MovieCard';
