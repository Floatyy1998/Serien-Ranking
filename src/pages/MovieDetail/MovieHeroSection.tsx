import { memo } from 'react';
import { BackButton } from '../../components/ui';
import { FriendsWhoHaveThis, ProviderBadges, VideoGallery } from '../../components/detail';
import { useTheme } from '../../contexts/ThemeContext';
import { Movie } from '../../types/Movie';
import type { TMDBWatchProvider } from './useMovieData';

interface MovieHeroSectionProps {
  movie: Movie;
  id: string | undefined;
  isMobile: boolean;
  tmdbBackdrop: string | null;
  tmdbRating: { vote_average: number; vote_count: number } | null;
  imdbRating: { rating: number; votes: string } | null;
  providers: TMDBWatchProvider[] | null;
  averageRating: number;
  isReadOnlyTmdbMovie: boolean;
  isAdding: boolean;
  getBackdropUrl: (backdropPath: string | undefined) => string;
  formatRuntime: (minutes: number) => string;
  onAddMovie: () => void;
}

export const MovieHeroSection = memo(
  ({
    movie,
    id,
    isMobile,
    tmdbBackdrop,
    tmdbRating,
    imdbRating,
    providers,
    averageRating,
    isReadOnlyTmdbMovie,
    isAdding,
    getBackdropUrl,
    formatRuntime,
    onAddMovie,
  }: MovieHeroSectionProps) => {
    const { currentTheme } = useTheme();

    return (
      <>
        <div className={`md-hero ${isMobile ? 'md-hero--mobile' : ''}`}>
          {tmdbBackdrop ? (
            <img
              src={getBackdropUrl(tmdbBackdrop)}
              alt={movie.title}
              className="md-hero__backdrop"
            />
          ) : (
            <div
              className="md-hero__backdrop-placeholder"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.status.error}33 0%, ${currentTheme.status.warning}33 100%)`,
              }}
            />
          )}

          {/* Gradient Overlay */}
          <div
            className="md-hero__gradient"
            style={{
              background: `linear-gradient(to top, ${currentTheme.background.default} 0%, transparent 100%)`,
            }}
          />

          {/* Header Buttons */}
          <div
            className={`md-hero__header-buttons ${isMobile ? 'md-hero__header-buttons--mobile' : ''}`}
          >
            <BackButton style={{ backdropFilter: 'blur(10px)' }} />

            {isReadOnlyTmdbMovie && (
              <button
                onClick={onAddMovie}
                disabled={isAdding}
                className="md-hero__action-btn md-hero__action-btn--add"
                style={{
                  background: isAdding
                    ? `${currentTheme.status.success}88`
                    : `${currentTheme.status.success}CC`,
                  color: currentTheme.text.primary,
                }}
              >
                {isAdding ? '...' : '+'}
              </button>
            )}
          </div>

          {/* Movie Info Overlay */}
          <div className={`md-hero__info ${isMobile ? 'md-hero__info--mobile' : ''}`}>
            <h1 className={`md-hero__title ${isMobile ? 'md-hero__title--mobile' : ''}`}>
              {movie.title}
            </h1>

            <div className={`md-hero__meta ${isMobile ? 'md-hero__meta--mobile' : ''}`}>
              {movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
              {movie.runtime && <span>&bull; {formatRuntime(movie.runtime)}</span>}
              {averageRating > 0 && (
                <span style={{ color: '#ffd700' }}>&bull; &#11088; {averageRating}</span>
              )}
              {movie && (
                <>
                  <span style={{ opacity: 0.5 }}>&bull;</span>
                  <FriendsWhoHaveThis itemId={movie.id} mediaType="movie" />
                </>
              )}
            </div>

            {/* Ratings from TMDB and IMDB - only on Desktop */}
            {!isMobile && (
              <div className="md-hero__ratings">
                {/* TMDB Rating */}
                <a
                  href={`https://www.themoviedb.org/movie/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="md-rating-badge md-rating-badge--tmdb"
                >
                  <span className="md-rating-label md-rating-label--tmdb">TMDB</span>
                  <span className="md-rating-value">
                    {tmdbRating?.vote_average?.toFixed(1) || '0.0'}/10
                  </span>
                  <span className="md-rating-count">
                    ({tmdbRating ? (tmdbRating.vote_count / 1000).toFixed(1) : '0.0'}
                    k)
                  </span>
                </a>

                {/* IMDB Rating */}
                <a
                  href={`https://www.imdb.com/title/${movie?.imdb?.imdb_id || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="md-rating-badge md-rating-badge--imdb"
                  style={{
                    opacity: movie?.imdb?.imdb_id ? 1 : 0.5,
                    pointerEvents: movie?.imdb?.imdb_id ? 'auto' : 'none',
                  }}
                >
                  <span className="md-rating-label md-rating-label--imdb">IMDb</span>
                  <span className="md-rating-value">
                    {imdbRating?.rating?.toFixed(1) || '0.0'}/10
                  </span>
                  <span className="md-rating-count">
                    (
                    {imdbRating
                      ? (parseInt(imdbRating.votes.replace(/,/g, '')) / 1000).toFixed(1)
                      : '0.0'}
                    k)
                  </span>
                </a>
              </div>
            )}

            {/* Provider Badges */}
            {((movie.provider?.provider && movie.provider.provider.length > 0) || providers) && (
              <div className={`md-hero__providers ${isMobile ? 'md-hero__providers--mobile' : ''}`}>
                <ProviderBadges
                  providers={
                    movie.provider?.provider && movie.provider.provider.length > 0
                      ? movie.provider.provider
                      : (providers ?? undefined)
                  }
                  size={isMobile ? 'medium' : 'large'}
                  maxDisplay={isMobile ? 4 : 6}
                  showNames={false}
                  searchTitle={movie.title}
                  tmdbId={movie.id}
                  mediaType="movie"
                />
              </div>
            )}

            {/* Video Gallery Button - Desktop */}
            {!isMobile && (
              <VideoGallery tmdbId={movie.id} mediaType="movie" buttonStyle="desktop" />
            )}
          </div>
        </div>

        {/* Mobile Video Gallery Button */}
        {isMobile && (
          <div className="md-video-mobile">
            <VideoGallery tmdbId={movie.id} mediaType="movie" buttonStyle="mobile" />
          </div>
        )}
      </>
    );
  }
);

MovieHeroSection.displayName = 'MovieHeroSection';
