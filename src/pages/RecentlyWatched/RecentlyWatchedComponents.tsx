/** Memoized Subkomponenten der RecentlyWatchedPage. */

import {
  ChatBubbleOutlined,
  Check,
  Close,
  History,
  Movie,
  PlayCircle,
  Replay,
  StarRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiscussionCount } from '../../hooks/social/discussionCountHooks';
import { EmptyState as UiEmptyState } from '../../components/ui/feedback/EmptyState';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { t } from '../../services/i18n';
import { isGenericEpisodeName } from '../../lib/episode/episodeName';
import { CARD_PRESS, CARD_SPRING, cardSurface, chipStyle } from './cardStyles';
import type { WatchedEpisode, WatchedMovie } from './EpisodeDataManager';
import type { TimeRange } from './useRecentlyWatched';
import { tapScale, tapScaleTight } from '../../lib/motion';

export { SeriesAccordion } from './SeriesAccordion';

const DISCUSSION_ICON_STYLE: React.CSSProperties = { fontSize: '15px' };
const CHIP_ICON_STYLE: React.CSSProperties = { fontSize: '14px' };
const ACTION_ICON_STYLE: React.CSSProperties = { fontSize: '22px' };

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
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
        }
      }}
      title={count === 1 ? t('1 Diskussion') : t('{n} Diskussionen', { n: count })}
      className="rw-chip rw-chip--tap"
      style={chipStyle(currentTheme.primary)}
    >
      <ChatBubbleOutlined style={DISCUSSION_ICON_STYLE} />
      {count}
    </span>
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
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onClick?.();
          }
        }}
        title={count === 1 ? t('1 Diskussion') : t('{n} Diskussionen', { n: count })}
        className="rw-chip rw-chip--tap"
        style={chipStyle(currentTheme.primary)}
      >
        <ChatBubbleOutlined style={DISCUSSION_ICON_STYLE} />
        {count}
      </span>
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
        className="rw-chip"
        style={{ ...chipStyle(color), fontSize: '13px', padding: '5px 11px' }}
      >
        {icon}
        {value}
      </div>
    );

    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        style={{ display: 'flex', gap: '6px' }}
      >
        {totalEpisodes > 0 &&
          chip(currentTheme.status.success, <PlayCircle style={CHIP_ICON_STYLE} />, totalEpisodes)}
        {totalMovies > 0 &&
          chip(currentTheme.primary, <Movie style={CHIP_ICON_STYLE} />, totalMovies)}
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
          style={{ color: currentTheme.text.muted }}
        >
          <Close style={{ fontSize: '17px' }} />
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
      {timeRanges.map((range) => {
        const active = daysToShow === range.days;
        return (
          <motion.button
            key={range.days}
            whileTap={tapScale}
            onClick={() => onTimeRangeChange(range.days)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-full)',
              border: active ? 'none' : `1px solid ${currentTheme.border.default}`,
              background: active
                ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`
                : 'transparent',
              boxShadow: active ? `0 6px 18px -8px ${currentTheme.primary}` : 'none',
              color: active
                ? getOptimalTextColor(currentTheme.primary)
                : currentTheme.text.secondary,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {range.label}
          </motion.button>
        );
      })}
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

  return (
    <div className={`rw-day${isToday ? ' rw-day--today' : ''}`}>
      <span className="rw-day__dot" />
      <h2 className="rw-day__title" style={{ color: currentTheme.text.primary }}>
        {displayDate}
      </h2>
      <div className="rw-day__counts">
        {episodeCount > 0 && (
          <span className="rw-day__count" style={chipStyle(currentTheme.status.success)}>
            {t('{n} Ep.', { n: episodeCount })}
          </span>
        )}
        {movieCount > 0 && (
          <span className="rw-day__count" style={chipStyle(currentTheme.primary)}>
            {movieCount === 1 ? t('1 Film') : t('{n} Filme', { n: movieCount })}
          </span>
        )}
      </div>
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
    const openSeries = () => onNavigateToSeries(episode.seriesId);
    const openEpisode = () =>
      onNavigateToEpisode(episode.seriesId, episode.seasonNumber, episode.episodeNumber);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: isCompleting ? 0.65 : 1, y: 0 }}
        whileTap={CARD_PRESS}
        transition={CARD_SPRING}
        role="button"
        tabIndex={0}
        aria-label={t('{title} öffnen', { title: episode.seriesName })}
        onClick={openSeries}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openSeries();
          }
        }}
        className="rw-card rw-card--episode"
        style={{
          ...cardSurface(currentTheme),
          ['--rw-accent' as string]: `linear-gradient(to bottom, ${currentTheme.status.success}, ${currentTheme.primary})`,
        }}
      >
        <img
          src={episode.seriesPoster}
          alt=""
          loading="lazy"
          decoding="async"
          className="rw-card__poster"
        />

        <div className="rw-card__body">
          <h3 className="rw-card__title" style={{ color: currentTheme.text.primary }}>
            {episode.seriesName}
          </h3>

          {!isGenericEpisodeName(episode.episodeName) && (
            <p className="rw-card__sub" style={{ color: currentTheme.text.secondary }}>
              {episode.episodeName}
            </p>
          )}

          <div className="rw-card__chips">
            <span
              role="button"
              tabIndex={0}
              aria-label={t('Zur Episode S{s} E{e} springen', {
                s: episode.seasonNumber,
                e: episode.episodeNumber,
              })}
              onClick={(e) => {
                e.stopPropagation();
                openEpisode();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  openEpisode();
                }
              }}
              className="rw-chip rw-chip--tap"
              style={chipStyle(currentTheme.status.success)}
            >
              S{episode.seasonNumber} E{episode.episodeNumber}
            </span>

            {episode.watchCount > 1 && (
              <span className="rw-chip" style={chipStyle(currentTheme.primary)}>
                <Replay style={CHIP_ICON_STYLE} />
                {episode.watchCount}x
              </span>
            )}

            {episode.dateSource !== 'firstWatched' && episode.watchCount <= 1 && (
              <span className="rw-chip" style={chipStyle(currentTheme.text.muted)}>
                {episode.dateSource === 'lastWatched'
                  ? t('zuletzt')
                  : episode.dateSource === 'airDate'
                    ? t('Ausstrahlung')
                    : t('geschätzt')}
              </span>
            )}

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
          </div>
        </div>

        <div className="rw-card__actions">
          <motion.button
            type="button"
            whileTap={tapScaleTight}
            onClick={(e) => {
              e.stopPropagation();
              onRewatch(episode);
            }}
            className="rw-action-btn rw-rewatch-btn"
            aria-label={isCompleting ? t('Als gesehen markiert') : t('Erneut ansehen')}
            style={{
              background: `color-mix(in srgb, ${currentTheme.status.success} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${currentTheme.status.success} 30%, transparent)`,
              color: currentTheme.status.success,
            }}
          >
            {isCompleting ? (
              <Check style={ACTION_ICON_STYLE} />
            ) : (
              <PlayCircle style={ACTION_ICON_STYLE} />
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
  const sub = [movie.year, movie.runtime ? t('{n} Min.', { n: movie.runtime }) : null]
    .filter(Boolean)
    .join(' • ');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={CARD_PRESS}
      transition={CARD_SPRING}
      role="button"
      tabIndex={0}
      aria-label={t('{title} öffnen', { title: movie.title })}
      onClick={open}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="rw-card rw-card--movie"
      style={cardSurface(currentTheme)}
    >
      <img src={movie.poster} alt="" loading="lazy" decoding="async" className="rw-card__poster" />

      <div className="rw-card__body">
        <h3 className="rw-card__title" style={{ color: currentTheme.text.primary }}>
          {movie.title}
        </h3>

        {sub && (
          <p className="rw-card__sub" style={{ color: currentTheme.text.secondary }}>
            {sub}
          </p>
        )}

        <div className="rw-card__chips">
          <span className="rw-chip" style={chipStyle(currentTheme.primary)}>
            <Movie style={CHIP_ICON_STYLE} />
            {t('Film')}
          </span>

          {movie.rating > 0 && (
            <span className="rw-chip" style={chipStyle(currentTheme.accent)}>
              <StarRounded style={CHIP_ICON_STYLE} />
              {movie.rating.toFixed(1)}
            </span>
          )}

          {movie.dateSource === 'rated' && (
            <span className="rw-chip" style={chipStyle(currentTheme.text.muted)}>
              {t('bewertet')}
            </span>
          )}

          <MovieDiscussionIndicator movieId={movie.movieId} onClick={open} />
        </div>
      </div>
    </motion.div>
  );
});
MovieCard.displayName = 'MovieCard';
