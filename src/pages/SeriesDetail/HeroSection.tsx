import { Tooltip } from '@mui/material';
import { memo } from 'react';
import { BackButton } from '../../components/ui';
import { FriendsWhoHaveThis } from '../../components/detail';
import type { Series } from '../../types/Series';
import { StatusBadge } from './StatusBadge';

interface HeroSectionProps {
  series: Series;
  tmdbSeries: Series | null;
  tmdbBackdrop: string | null;
  tmdbFirstAirDate: string | null;
  overallRating: string;
  progressStats: { watched: number; total: number; percentage: number };
  paceInfo: { text: string } | null;
  isReadOnlyTmdbSeries: boolean;
  isAdding: boolean;
  isMobile: boolean;
  currentTheme: { status: { success: string } };
  onAddSeries: () => void;
}

const getBackdropUrl = (backdropPath: string | undefined): string => {
  if (!backdropPath) return '';
  if (backdropPath.startsWith('http')) return backdropPath;
  return `https://image.tmdb.org/t/p/original${backdropPath}`;
};

export const HeroSection = memo<HeroSectionProps>(
  ({
    series,
    tmdbSeries,
    tmdbBackdrop,
    tmdbFirstAirDate,
    overallRating,
    progressStats,
    paceInfo,
    isReadOnlyTmdbSeries,
    isAdding,
    isMobile,
    currentTheme,
    onAddSeries,
  }) => {
    const genres = (series.genre?.genres || tmdbSeries?.genre?.genres || []).filter(
      (g) => g && g.trim() !== '' && g !== 'All'
    );
    const maxGenres = isMobile ? 3 : 4;

    return (
      <div className="hero-section" style={{ height: isMobile ? '360px' : '480px' }}>
        {tmdbBackdrop && (
          <img
            className="hero-section__backdrop"
            src={getBackdropUrl(tmdbBackdrop)}
            alt={series.title}
            decoding="async"
            fetchPriority="low"
          />
        )}

        <div className="hero-section__gradient" />

        {/* Back Button */}
        <div
          className="hero-section__back-btn"
          style={{
            top: isMobile
              ? 'calc(10px + env(safe-area-inset-top))'
              : 'calc(20px + env(safe-area-inset-top))',
            left: isMobile ? '10px' : '20px',
          }}
        >
          <BackButton style={{ backdropFilter: 'blur(10px)' }} />
        </div>

        {/* Add button for TMDB-only series */}
        {isReadOnlyTmdbSeries && (
          <Tooltip title="Zur Sammlung hinzufugen" arrow>
            <button
              onClick={onAddSeries}
              disabled={isAdding}
              className="hero-section__add-btn"
              style={{
                top: isMobile
                  ? 'calc(10px + env(safe-area-inset-top))'
                  : 'calc(20px + env(safe-area-inset-top))',
                right: isMobile ? '10px' : '20px',
                background: isAdding
                  ? `${currentTheme.status.success}88`
                  : `${currentTheme.status.success}CC`,
                cursor: isAdding ? 'not-allowed' : 'pointer',
              }}
            >
              {isAdding ? '...' : '+'}
            </button>
          </Tooltip>
        )}

        {/* Series Info Overlay */}
        <div className="hero-section__info" style={{ padding: isMobile ? '0 16px' : '0 20px' }}>
          <h1 className="hero-section__title" style={{ fontSize: isMobile ? '20px' : '28px' }}>
            {series.title}
          </h1>

          {/* Meta Row */}
          <div
            className="hero-section__meta"
            style={{ gap: isMobile ? '6px' : '12px', fontSize: isMobile ? '12px' : '14px' }}
          >
            {(tmdbFirstAirDate || series.first_air_date || series.release_date) && (
              <span>
                {new Date(
                  tmdbFirstAirDate || series.first_air_date || series.release_date
                ).getFullYear()}
              </span>
            )}
            {series.seasons && <span>&bull; {series.seasons.length} Staffeln</span>}
            {series.status && (
              <span>
                &bull;{' '}
                {series.status === 'Returning Series' || series.status === 'ongoing'
                  ? 'Wird fortgesetzt'
                  : series.status === 'Ended' || series.status === 'Canceled'
                    ? 'Beendet'
                    : series.status}
              </span>
            )}
            {parseFloat(overallRating) > 0 && (
              <span style={{ color: '#ffd700' }}>&bull; &#11088; {overallRating}</span>
            )}
            {series && (
              <>
                <span style={{ opacity: 0.5 }}>&bull;</span>
                <FriendsWhoHaveThis itemId={series.id} mediaType="series" />
              </>
            )}
          </div>

          {/* Status Badge & Genres */}
          <div
            className="hero-section__badges"
            style={{ gap: isMobile ? '6px' : '8px', marginBottom: isMobile ? '12px' : '12px' }}
          >
            <StatusBadge series={series} />
            {genres.slice(0, maxGenres).map((genre, i) => (
              <span key={i} className="hero-section__genre-tag">
                {genre}
              </span>
            ))}
            {genres.length > maxGenres && (
              <span className="hero-section__genre-tag" style={{ opacity: 0.7 }}>
                +{genres.length - maxGenres}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {progressStats.total > 0 && (
            <div style={{ marginBottom: isMobile ? '14px' : '12px' }}>
              <div className="hero-section__progress-track">
                <div
                  className="hero-section__progress-fill"
                  style={{ width: `${progressStats.percentage}%` }}
                />
              </div>
              <p
                className="hero-section__progress-text"
                style={{ fontSize: isMobile ? '11px' : '12px' }}
              >
                {progressStats.watched} von {progressStats.total} Episoden (
                {progressStats.percentage}%)
              </p>
              {paceInfo && (
                <p
                  className="hero-section__pace-text"
                  style={{ fontSize: isMobile ? '10px' : '11px' }}
                >
                  {paceInfo.text}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

HeroSection.displayName = 'HeroSection';
