import {
  Check,
  DateRange,
  Edit,
  Movie,
  PlayCircle,
  Star,
  Tv,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { BackButton, LoadingSpinner } from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContextDef';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

export {
  CrewSection,
  DiscussionSection,
  EpisodeNavigation,
  GuestStarsSection,
  OverviewSection,
} from './EpisodeDiscussionExtras';

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
