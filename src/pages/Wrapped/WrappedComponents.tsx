/**
 * WrappedComponents - Memoized subcomponents for WrappedPage
 *
 * Extracted: loading state, error state, progress bar, close button,
 * navigation hint, and slide renderer.
 */

import { memo } from 'react';
import {
  IntroSlide,
  TotalTimeSlide,
  TopSeriesSlide,
  TopMoviesSlide,
  TopGenresSlide,
  TopProvidersSlide,
  TimePatternSlide,
  BingeStatsSlide,
  AchievementsSlide,
  MonthlyBreakdownSlide,
  SummarySlide,
  FirstLastSlide,
  RecordDaySlide,
  LateNightSlide,
  HeatmapSlide,
} from '../../components/wrapped';
import { WrappedStats, WrappedSlideType } from '../../types/Wrapped';

// === Gradient background used by loading + error states ===

const WRAPPED_GRADIENT =
  'linear-gradient(135deg, var(--theme-primary, #667eea) 0%, var(--theme-secondary-gradient, #764ba2) 50%, #f093fb 100%)';

// === Loading State ===

interface WrappedLoadingStateProps {
  year: number;
}

export const WrappedLoadingState = memo<WrappedLoadingStateProps>(({ year }) => (
  <div className="wrapped-fullscreen" style={{ background: WRAPPED_GRADIENT }}>
    <div className="wrapped-loading-orb wrapped-loading-orb--top" />
    <div className="wrapped-loading-orb wrapped-loading-orb--bottom" />

    <div className="wrapped-loading-content">
      <div className="wrapped-loading-year">{year}</div>

      <div className="wrapped-loading-ring">
        <div className="wrapped-loading-ring-track" />
        <div className="wrapped-loading-ring-outer" />
        <div className="wrapped-loading-ring-inner" />
      </div>

      <p className="wrapped-loading-title">Lade deinen Jahresrückblick...</p>
      <p className="wrapped-loading-subtitle">Wir analysieren deine Statistiken</p>
    </div>
  </div>
));

WrappedLoadingState.displayName = 'WrappedLoadingState';

// === Error State ===

interface WrappedErrorStateProps {
  error: string;
  onBack: () => void;
}

export const WrappedErrorState = memo<WrappedErrorStateProps>(({ error, onBack }) => (
  <div className="wrapped-fullscreen" style={{ background: WRAPPED_GRADIENT, padding: '20px' }}>
    <div className="wrapped-error-decoration" />

    <div className="wrapped-error-content">
      <div className="wrapped-error-icon-circle">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="wrapped-error-heading">{error}</h2>
      <p className="wrapped-error-message">Versuche es später noch einmal</p>
      <button
        onClick={onBack}
        className="wrapped-error-button"
        style={{ color: 'var(--theme-primary, #667eea)' }}
      >
        Zurück zur Startseite
      </button>
    </div>
  </div>
));

WrappedErrorState.displayName = 'WrappedErrorState';

// === Progress Indicator ===

interface WrappedProgressBarProps {
  currentSlide: number;
  totalSlides: number;
}

export const WrappedProgressBar = memo<WrappedProgressBarProps>(({ currentSlide, totalSlides }) => (
  <div className="wrapped-progress">
    <span className="wrapped-progress-text">
      {currentSlide + 1}
      <span> / {totalSlides}</span>
    </span>
    <div className="wrapped-progress-bar">
      <div
        className="wrapped-progress-fill"
        style={{
          width: `${((currentSlide + 1) / totalSlides) * 100}%`,
          background: 'linear-gradient(90deg, var(--theme-primary, #667eea), #f093fb)',
        }}
      />
    </div>
  </div>
));

WrappedProgressBar.displayName = 'WrappedProgressBar';

// === Close Button ===

interface WrappedCloseButtonProps {
  onClick: () => void;
}

export const WrappedCloseButton = memo<WrappedCloseButtonProps>(({ onClick }) => (
  <button onClick={onClick} className="wrapped-close-btn" aria-label="Schließen">
    &times;
  </button>
));

WrappedCloseButton.displayName = 'WrappedCloseButton';

// === Navigation Hint (visible only on first slide) ===

export const WrappedNavigationHint = memo(() => (
  <div className="wrapped-nav-hint">
    <div className="wrapped-nav-hint-inner">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="wrapped-nav-hint-icon"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      <p className="wrapped-nav-hint-text">Wischen zum Navigieren</p>
    </div>
  </div>
));

WrappedNavigationHint.displayName = 'WrappedNavigationHint';

// === Slide Renderer ===

interface WrappedSlideRendererProps {
  slideType: WrappedSlideType;
  stats: WrappedStats;
  year: number;
  username: string | undefined;
  onShare: () => Promise<void>;
}

export const WrappedSlideRenderer = memo<WrappedSlideRendererProps>(
  ({ slideType, stats, year, username, onShare }) => {
    switch (slideType) {
      case 'intro':
        return <IntroSlide year={year} username={username} />;
      case 'total_time':
        return (
          <TotalTimeSlide
            totalMinutes={stats.totalMinutesWatched}
            totalHours={stats.totalHoursWatched}
            totalDays={stats.totalDaysEquivalent}
            totalEpisodes={stats.totalEpisodesWatched}
            totalMovies={stats.totalMoviesWatched}
          />
        );
      case 'top_series':
        return <TopSeriesSlide topSeries={stats.topSeries} />;
      case 'top_movies':
        return <TopMoviesSlide topMovies={stats.topMovies} />;
      case 'top_genres':
        return <TopGenresSlide topGenres={stats.topGenres} />;
      case 'top_providers':
        return <TopProvidersSlide topProviders={stats.topProviders} />;
      case 'time_pattern':
        return (
          <TimePatternSlide
            favoriteTimeOfDay={stats.favoriteTimeOfDay}
            favoriteDayOfWeek={stats.favoriteDayOfWeek}
          />
        );
      case 'binge_stats':
        return (
          <BingeStatsSlide
            totalBingeSessions={stats.totalBingeSessions}
            longestBinge={stats.longestBingeSession}
            averageBingeLength={stats.averageBingeLength}
          />
        );
      case 'achievements':
        return <AchievementsSlide achievements={stats.achievements} />;
      case 'monthly_breakdown':
        return (
          <MonthlyBreakdownSlide
            monthlyBreakdown={stats.monthlyBreakdown}
            mostActiveMonth={stats.mostActiveMonth}
          />
        );
      case 'summary':
        return <SummarySlide stats={stats} onShare={onShare} />;
      case 'first_last':
        return (
          <FirstLastSlide firstWatch={stats.firstWatch} lastWatch={stats.lastWatch} year={year} />
        );
      case 'record_day':
        return <RecordDaySlide mostActiveDay={stats.mostActiveDay} />;
      case 'late_night':
        return <LateNightSlide lateNightStats={stats.lateNightStats} />;
      case 'heatmap':
        return <HeatmapSlide heatmapData={stats.heatmapData} />;
      default:
        return null;
    }
  }
);

WrappedSlideRenderer.displayName = 'WrappedSlideRenderer';
