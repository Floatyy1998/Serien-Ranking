import {
  Check,
  DateRange,
  Edit,
  Movie,
  NavigateBefore,
  NavigateNext,
  PlayCircle,
  Star,
  Tv,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { DiscussionThread } from '../../components/Discussion';
import { BackButton, LoadingSpinner } from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContext';
import type { EpisodeNavigationInfo } from './useEpisodeDiscussion';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

// SECONDARY_COLOR is resolved per-component from theme.accent

// ---------- Loading State ----------
export const LoadingState = memo(({ currentTheme }: { currentTheme: Theme }) => (
  <div className="ed-loading" style={{ background: currentTheme.background.default }}>
    <div
      className="ed-loading-bg"
      style={{
        background: `radial-gradient(ellipse at 30% 20%, ${currentTheme.primary}15 0%, transparent 50%),
                     radial-gradient(ellipse at 70% 80%, ${currentTheme.accent}15 0%, transparent 50%)`,
      }}
    />
    <LoadingSpinner size={50} text="Lade Episodendetails..." />
  </div>
));
LoadingState.displayName = 'LoadingState';

// ---------- Not Found State ----------
export const NotFoundState = memo(
  ({ currentTheme, onGoBack }: { currentTheme: Theme; onGoBack: () => void }) => (
    <div className="ed-not-found" style={{ background: currentTheme.background.default }}>
      <div
        className="ed-not-found-bg"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${currentTheme.primary}10 0%, transparent 50%)`,
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ed-not-found-card"
        style={{
          background: currentTheme.background.card,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <Movie className="ed-not-found-icon" style={{ color: currentTheme.text.muted }} />
        <h2 className="ed-not-found-title" style={{ color: currentTheme.text.primary }}>
          Episode nicht gefunden
        </h2>
        <p className="ed-not-found-text" style={{ color: currentTheme.text.muted }}>
          Diese Episode konnte nicht geladen werden.
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onGoBack}
          className="ed-not-found-btn"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            boxShadow: `0 4px 15px ${currentTheme.primary}40`,
          }}
        >
          Zurück
        </motion.button>
      </motion.div>
    </div>
  )
);
NotFoundState.displayName = 'NotFoundState';

// ---------- Hero Section ----------
interface HeroSectionProps {
  currentTheme: Theme;
  stillPath: string | null | undefined;
  backdropPath: string | null | undefined;
  episodeName: string;
  seriesTitle: string;
  seriesId: string | undefined;
  seasonNumber: string | undefined;
  episodeNumber: string | undefined;
  episodeRating: number | undefined;
  episodeAirDate: string | undefined;
  episodeRuntime: number | null | undefined;
  formattedAirDate: string | null;
  formattedFirstWatchedAt: string | null;
  isWatched: boolean;
  getStillUrl: (path: string | null, size?: string) => string;
  navigate: NavigateFunction;
}

export const HeroSection = memo(
  ({
    currentTheme,
    stillPath,
    backdropPath,
    episodeName,
    seriesTitle,
    seriesId,
    seasonNumber,
    episodeNumber,
    episodeRating,
    episodeAirDate,
    episodeRuntime,
    formattedAirDate,
    formattedFirstWatchedAt,
    isWatched,
    getStillUrl,
    navigate,
  }: HeroSectionProps) => (
    <div className="ed-hero">
      {/* Hero Image */}
      {stillPath ? (
        <img src={getStillUrl(stillPath, 'original')} alt={episodeName} className="ed-hero-img" />
      ) : backdropPath ? (
        <img
          src={getStillUrl(backdropPath, 'original')}
          alt={seriesTitle}
          className="ed-hero-img ed-hero-img--backdrop"
        />
      ) : (
        <div
          className="ed-hero-placeholder"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
          }}
        />
      )}

      {/* Gradient Overlay */}
      <div
        className="ed-hero-gradient"
        style={{
          background: `linear-gradient(to bottom,
            rgba(0,0,0,0.4) 0%,
            transparent 25%,
            transparent 45%,
            ${currentTheme.background.default}dd 85%,
            ${currentTheme.background.default} 100%)`,
        }}
      />

      {/* Top Navigation */}
      <div className="ed-hero-topbar">
        <BackButton
          style={{
            backdropFilter: 'blur(20px)',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(20,20,40,0.5))',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/series/${seriesId}`)}
          className="ed-hero-series-btn"
        >
          <Tv className="ed-hero-series-btn-icon" />
          Zur Serie
        </motion.button>
      </div>

      {/* Episode Info Overlay */}
      <div className="ed-hero-info">
        {/* Series Title Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ed-series-badge"
        >
          <Tv className="ed-series-badge-icon" />
          <span className="ed-series-badge-text">{seriesTitle}</span>
        </motion.div>

        {/* Season & Episode Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="ed-badges-row"
        >
          <span
            className="ed-season-badge"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              boxShadow: `0 4px 12px ${currentTheme.primary}50`,
            }}
          >
            S{seasonNumber} E{episodeNumber}
          </span>

          {episodeRating !== undefined && episodeRating > 0 && (
            <span className="ed-rating-badge">
              <Star className="ed-rating-icon" />
              {episodeRating.toFixed(1)}
            </span>
          )}

          {isWatched && (
            <span
              className="ed-watched-badge"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.status.success}30, ${currentTheme.status.success}15)`,
                color: currentTheme.status.success,
              }}
            >
              <Check className="ed-watched-badge-icon" />
              Gesehen
            </span>
          )}
        </motion.div>

        {/* Episode Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ed-episode-title"
          style={{ color: currentTheme.text.primary }}
        >
          {episodeName}
        </motion.h1>

        {/* Meta Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="ed-meta-row"
          style={{ color: currentTheme.text.secondary }}
        >
          {episodeAirDate && formattedAirDate && (
            <Tooltip title="Erstausstrahlung" arrow>
              <span className="ed-meta-item">
                <DateRange className="ed-meta-icon" style={{ color: currentTheme.primary }} />
                {formattedAirDate}
              </span>
            </Tooltip>
          )}
          {isWatched && formattedFirstWatchedAt && (
            <Tooltip title="Erstmals gesehen" arrow>
              <span className="ed-meta-item">
                <Visibility
                  className="ed-meta-icon"
                  style={{ color: currentTheme.status.success }}
                />
                {formattedFirstWatchedAt}
              </span>
            </Tooltip>
          )}
          {episodeRuntime && (
            <Tooltip title="Episodenlänge" arrow>
              <span className="ed-meta-item">
                <PlayCircle className="ed-meta-icon" style={{ color: currentTheme.accent }} />
                {episodeRuntime} Min.
              </span>
            </Tooltip>
          )}
        </motion.div>
      </div>
    </div>
  )
);
HeroSection.displayName = 'HeroSection';

// ---------- Quick Actions ----------
interface QuickActionsProps {
  currentTheme: Theme;
  hasUser: boolean;
  hasSeries: boolean;
  isWatched: boolean;
  seriesId: string | undefined;
  onToggleWatched: () => void;
  navigate: NavigateFunction;
}

export const QuickActions = memo(
  ({
    currentTheme,
    hasUser,
    hasSeries,
    isWatched,
    seriesId,
    onToggleWatched,
    navigate,
  }: QuickActionsProps) => (
    <div
      className="ed-quick-actions"
      style={{ borderBottom: `1px solid ${currentTheme.border.default}` }}
    >
      {hasSeries && hasUser && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggleWatched}
          className="ed-watch-btn"
          style={{
            background: isWatched
              ? `linear-gradient(135deg, ${currentTheme.status.success}25, ${currentTheme.status.success}10)`
              : currentTheme.background.card,
            border: isWatched
              ? `1px solid ${currentTheme.status.success}50`
              : `1px solid ${currentTheme.border.default}`,
            color: isWatched ? currentTheme.status.success : currentTheme.text.primary,
            boxShadow: isWatched ? `0 4px 15px ${currentTheme.status.success}20` : 'none',
          }}
        >
          {isWatched ? (
            <>
              <Visibility className="ed-watch-btn-icon" />
              Gesehen
            </>
          ) : (
            <>
              <VisibilityOff className="ed-watch-btn-icon" />
              Als gesehen markieren
            </>
          )}
        </motion.button>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(`/episodes/${seriesId}`)}
        className="ed-episodes-btn"
        style={{
          background: currentTheme.background.card,
          border: `1px solid ${currentTheme.border.default}`,
          color: currentTheme.text.primary,
        }}
      >
        <Edit className="ed-episodes-btn-icon" />
      </motion.button>
    </div>
  )
);
QuickActions.displayName = 'QuickActions';

// ---------- Episode Navigation ----------
interface EpisodeNavigationProps {
  currentTheme: Theme;
  navigation: EpisodeNavigationInfo;
}

export const EpisodeNavigation = memo(({ currentTheme, navigation }: EpisodeNavigationProps) => (
  <div
    className="ed-nav"
    style={{
      background: currentTheme.background.surface,
      borderBottom: `1px solid ${currentTheme.border.default}`,
    }}
  >
    {/* Previous Episode */}
    <motion.button
      whileTap={{ scale: navigation.hasPrevEpisode ? 0.95 : 1 }}
      onClick={navigation.goToPrevEpisode}
      disabled={!navigation.hasPrevEpisode}
      className="ed-nav-btn"
      style={{
        background: currentTheme.background.card,
        border: `1px solid ${currentTheme.border.default}`,
        cursor: navigation.hasPrevEpisode ? 'pointer' : 'default',
        opacity: navigation.hasPrevEpisode ? 1 : 0.4,
      }}
    >
      <div
        className="ed-nav-icon-wrap"
        style={{
          background: navigation.hasPrevEpisode
            ? currentTheme.background.surfaceHover
            : currentTheme.background.surface,
        }}
      >
        <NavigateBefore className="ed-nav-icon" style={{ color: currentTheme.text.muted }} />
      </div>
      <div className="ed-nav-text">
        <p className="ed-nav-label" style={{ color: currentTheme.text.muted }}>
          Vorherige
        </p>
        <p className="ed-nav-episode" style={{ color: currentTheme.text.primary }}>
          {navigation.prevEpisodeLabel}
        </p>
      </div>
    </motion.button>

    {/* Next Episode */}
    <motion.button
      whileTap={{ scale: navigation.hasNextEpisode ? 0.95 : 1 }}
      onClick={navigation.goToNextEpisode}
      disabled={!navigation.hasNextEpisode}
      className="ed-nav-btn ed-nav-btn--next"
      style={{
        background: navigation.hasNextEpisode
          ? `linear-gradient(135deg, ${currentTheme.primary}12, ${currentTheme.accent}12)`
          : currentTheme.background.card,
        border: navigation.hasNextEpisode
          ? `1px solid ${currentTheme.primary}30`
          : `1px solid ${currentTheme.border.default}`,
        cursor: navigation.hasNextEpisode ? 'pointer' : 'default',
        opacity: navigation.hasNextEpisode ? 1 : 0.4,
      }}
    >
      <div className="ed-nav-text">
        <p className="ed-nav-label" style={{ color: currentTheme.text.muted }}>
          Nächste
        </p>
        <p className="ed-nav-episode" style={{ color: currentTheme.text.primary }}>
          {navigation.nextEpisodeLabel}
        </p>
      </div>
      <div
        className="ed-nav-icon-wrap"
        style={{
          background: navigation.hasNextEpisode
            ? `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.accent}30)`
            : currentTheme.background.surface,
        }}
      >
        <NavigateNext
          className="ed-nav-icon"
          style={{
            color: navigation.hasNextEpisode ? currentTheme.primary : currentTheme.text.muted,
          }}
        />
      </div>
    </motion.button>
  </div>
));
EpisodeNavigation.displayName = 'EpisodeNavigation';

// ---------- Overview Section ----------
interface OverviewSectionProps {
  currentTheme: Theme;
  episodeOverview: string;
}

export const OverviewSection = memo(({ currentTheme, episodeOverview }: OverviewSectionProps) => (
  <AnimatePresence>
    {episodeOverview && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ed-overview"
        style={{
          background: currentTheme.background.card,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div
          className="ed-overview-decoration"
          style={{
            background: `radial-gradient(circle, ${currentTheme.primary}10 0%, transparent 70%)`,
          }}
        />
        <h3 className="ed-overview-header" style={{ color: currentTheme.text.primary }}>
          <div
            className="ed-overview-icon-wrap"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent}20)`,
            }}
          >
            <Movie className="ed-overview-icon" style={{ color: currentTheme.primary }} />
          </div>
          Handlung
        </h3>
        <p className="ed-overview-text" style={{ color: currentTheme.text.secondary }}>
          {episodeOverview}
        </p>
      </motion.div>
    )}
  </AnimatePresence>
));
OverviewSection.displayName = 'OverviewSection';

// ---------- Crew Section ----------
interface CrewSectionProps {
  currentTheme: Theme;
  directors: { id: number; name: string; job: string; profile_path: string | null }[];
  writers: { id: number; name: string; job: string; profile_path: string | null }[];
}

export const CrewSection = memo(({ currentTheme, directors, writers }: CrewSectionProps) => {
  if (directors.length === 0 && writers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="ed-crew"
    >
      {directors.length > 0 && (
        <div
          className="ed-crew-card"
          style={{
            background: currentTheme.background.card,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h4 className="ed-crew-label" style={{ color: currentTheme.text.muted }}>
            Regie
          </h4>
          {directors.slice(0, 2).map((d, i) => (
            <p
              key={i}
              className="ed-crew-name"
              style={{
                color: currentTheme.text.primary,
                margin: i > 0 ? '6px 0 0 0' : 0,
              }}
            >
              {d.name}
            </p>
          ))}
        </div>
      )}
      {writers.length > 0 && (
        <div
          className="ed-crew-card"
          style={{
            background: currentTheme.background.card,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h4 className="ed-crew-label" style={{ color: currentTheme.text.muted }}>
            Drehbuch
          </h4>
          {writers.slice(0, 2).map((w, i) => (
            <p
              key={i}
              className="ed-crew-name"
              style={{
                color: currentTheme.text.primary,
                margin: i > 0 ? '6px 0 0 0' : 0,
              }}
            >
              {w.name}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
});
CrewSection.displayName = 'CrewSection';

// ---------- Guest Stars Section ----------
interface GuestStarsSectionProps {
  currentTheme: Theme;
  guestStars: { id: number; name: string; character: string; profile_path: string | null }[];
  getProfileUrl: (path: string | null) => string;
}

export const GuestStarsSection = memo(
  ({ currentTheme, guestStars, getProfileUrl }: GuestStarsSectionProps) => {
    if (guestStars.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ed-guest-stars"
        style={{
          background: currentTheme.background.card,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h3 className="ed-guest-stars-header" style={{ color: currentTheme.text.primary }}>
          Gaststars
          <span
            className="ed-guest-stars-count"
            style={{
              color: currentTheme.primary,
              background: `${currentTheme.primary}15`,
            }}
          >
            {guestStars.length}
          </span>
        </h3>
        <div className="ed-guest-stars-scroll">
          {guestStars.slice(0, 15).map((star, index) => (
            <motion.div
              key={star.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="ed-guest-star-card"
            >
              <div
                className="ed-guest-star-avatar"
                style={{
                  background: currentTheme.background.surface,
                  border: `3px solid ${currentTheme.border.default}`,
                  boxShadow: `0 6px 16px ${currentTheme.background.default}80`,
                }}
              >
                {star.profile_path ? (
                  <img
                    src={getProfileUrl(star.profile_path)}
                    alt={star.name}
                    className="ed-guest-star-img"
                  />
                ) : (
                  <div
                    className="ed-guest-star-placeholder"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.accent}30)`,
                    }}
                  >
                    👤
                  </div>
                )}
              </div>
              <p className="ed-guest-star-name" style={{ color: currentTheme.text.primary }}>
                {star.name}
              </p>
              <p className="ed-guest-star-character" style={{ color: currentTheme.primary }}>
                {star.character}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }
);
GuestStarsSection.displayName = 'GuestStarsSection';

// ---------- Discussion Section ----------
interface DiscussionSectionProps {
  seriesId: string | undefined;
  seasonNumber: string | undefined;
  episodeNumber: string | undefined;
  seriesTitle: string;
  episodeName: string;
  posterPath: string | null | undefined;
  isWatched: boolean;
}

export const DiscussionSection = memo(
  ({
    seriesId,
    seasonNumber,
    episodeNumber,
    seriesTitle,
    episodeName,
    posterPath,
    isWatched,
  }: DiscussionSectionProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <DiscussionThread
        itemId={Number(seriesId)}
        itemType="episode"
        seasonNumber={Number(seasonNumber)}
        episodeNumber={Number(episodeNumber)}
        title="Episoden-Diskussion"
        isWatched={isWatched}
        feedMetadata={{
          itemTitle: seriesTitle,
          posterPath: posterPath || undefined,
          episodeTitle: episodeName,
        }}
      />
    </motion.div>
  )
);
DiscussionSection.displayName = 'DiscussionSection';
