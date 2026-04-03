import { memo } from 'react';
import { BackButton } from '../../components/ui';
import { FriendsWhoHaveThis, ProviderBadges, VideoGallery } from '../../components/detail';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Movie } from '../../types/Movie';
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
  isWatched: boolean;
  isReadOnlyTmdbMovie: boolean;
  isAdding: boolean;
  getBackdropUrl: (backdropPath: string | undefined) => string;
  formatRuntime: (minutes: number) => string;
  onAddMovie: () => void;
}

const getPosterUrl = (posterPath: string | undefined): string => {
  if (!posterPath) return '';
  if (posterPath.startsWith('http')) return posterPath;
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
};

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
    isWatched,
    isReadOnlyTmdbMovie,
    isAdding,
    getBackdropUrl,
    formatRuntime,
    onAddMovie,
  }: MovieHeroSectionProps) => {
    const { currentTheme } = useTheme();
    const posterPath =
      movie.poster && typeof movie.poster === 'object' ? movie.poster.poster : undefined;
    const posterUrl = getPosterUrl(posterPath);
    const backdropUrl = tmdbBackdrop ? getBackdropUrl(tmdbBackdrop) : '';
    const mobileBackdropUrl = backdropUrl || posterUrl;

    const genres = (movie.genre?.genres || []).filter((g) => g && g.trim() !== '' && g !== 'All');
    const tmdbGenres = movie.genres?.map((g) => g.name) || [];
    const allGenres = genres.length > 0 ? genres : tmdbGenres;

    return (
      <>
        <div
          className="md-hero"
          style={
            isMobile
              ? { position: 'relative', overflow: 'hidden' }
              : { height: 'auto', minHeight: 420 }
          }
        >
          {/* Backdrop */}
          {isMobile ? (
            <div
              className="md-hero__backdrop-bg"
              style={{
                backgroundImage: mobileBackdropUrl ? `url(${mobileBackdropUrl})` : undefined,
                background: !mobileBackdropUrl
                  ? `linear-gradient(135deg, ${currentTheme.status.error}33 0%, ${currentTheme.status.warning}33 100%)`
                  : undefined,
                filter: 'blur(50px) brightness(0.25) saturate(1.8)',
                transform: 'scale(1.3)',
              }}
            />
          ) : tmdbBackdrop ? (
            <div
              className="md-hero__backdrop-bg"
              style={{
                backgroundImage: `url(${backdropUrl})`,
                filter: 'brightness(0.35)',
              }}
            />
          ) : (
            <div
              className="md-hero__backdrop-bg"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.status.error}33 0%, ${currentTheme.status.warning}33 100%)`,
              }}
            />
          )}

          {/* Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: isMobile ? '60%' : 200,
              zIndex: 1,
              background: `linear-gradient(to top, ${currentTheme.background.default} 0%, transparent 100%)`,
            }}
          />

          {/* Vignette on desktop */}
          {!isMobile && <div className="md-hero__vignette" />}

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
                  color: currentTheme.text.secondary,
                }}
              >
                {isAdding ? '...' : '+'}
              </button>
            )}
          </div>

          {/* Content: Poster + Info */}
          <div
            className="md-hero__content-row"
            style={
              isMobile
                ? {
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0,
                    maxWidth: 'none',
                    padding: 'calc(64px + env(safe-area-inset-top)) 0 20px',
                  }
                : undefined
            }
          >
            {/* Poster */}
            {posterUrl && (
              <img
                src={posterUrl}
                alt={movie.title}
                className="md-hero__poster"
                style={
                  isMobile
                    ? { width: 150, height: 220, borderRadius: 14, marginBottom: 20 }
                    : undefined
                }
              />
            )}

            {/* Info */}
            <div
              className={isMobile ? undefined : 'md-hero__glass-card'}
              style={isMobile ? { width: '100%' } : undefined}
            >
              <h1
                className="md-hero__title"
                style={{
                  fontSize: isMobile ? 24 : 28,
                  textAlign: isMobile ? 'center' : 'left',
                  margin: isMobile ? '0 20px 4px' : undefined,
                  letterSpacing: '-0.02em',
                }}
              >
                {movie.title}
              </h1>

              <div
                className="md-hero__meta"
                style={{
                  justifyContent: isMobile ? 'center' : undefined,
                  padding: isMobile ? '0 20px' : undefined,
                  gap: isMobile ? '3px 8px' : undefined,
                  fontSize: isMobile ? 13 : undefined,
                  color: isMobile ? 'rgba(255,255,255,0.55)' : undefined,
                  marginTop: isMobile ? 8 : undefined,
                }}
              >
                {movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
                {movie.runtime && <span>&bull; {formatRuntime(movie.runtime)}</span>}
                {movie.status && (
                  <span>
                    &bull;{' '}
                    {isWatched
                      ? 'Gesehen'
                      : movie.status === 'Released'
                        ? 'Veröffentlicht'
                        : movie.status}
                  </span>
                )}
                {averageRating > 0 && (
                  <span style={{ color: currentTheme.accent }}>
                    &bull; &#11088; {averageRating}
                  </span>
                )}
                {movie && (
                  <>
                    <span style={{ opacity: 0.5 }}>&bull;</span>
                    <FriendsWhoHaveThis itemId={movie.id} mediaType="movie" />
                  </>
                )}
              </div>

              {/* Genre Tags */}
              {allGenres.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 10,
                    justifyContent: isMobile ? 'center' : 'flex-start',
                    padding: isMobile ? '0 20px' : undefined,
                  }}
                >
                  {allGenres.slice(0, 4).map((genre, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '4px 12px',
                        borderRadius: 9999,
                        color: 'rgba(255,255,255,0.7)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Ratings + Provider */}
              {isMobile ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 12,
                    padding: '0 20px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
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
                  </a>
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
                  </a>
                  {((movie.provider?.provider && movie.provider.provider.length > 0) ||
                    providers) && (
                    <ProviderBadges
                      providers={
                        movie.provider?.provider && movie.provider.provider.length > 0
                          ? movie.provider.provider
                          : (providers ?? undefined)
                      }
                      size="medium"
                      maxDisplay={3}
                      showNames={false}
                      searchTitle={movie.title}
                      tmdbId={movie.id}
                      mediaType="movie"
                    />
                  )}
                </div>
              ) : (
                /* Desktop: Ratings, then Provider below */
                <>
                  <div className="md-hero__ratings" style={{ marginTop: 14, marginBottom: 0 }}>
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
                        ({tmdbRating ? (tmdbRating.vote_count / 1000).toFixed(1) : '0.0'}k)
                      </span>
                    </a>
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
                  {((movie.provider?.provider && movie.provider.provider.length > 0) ||
                    providers) && (
                    <div style={{ marginTop: 10 }}>
                      <ProviderBadges
                        providers={
                          movie.provider?.provider && movie.provider.provider.length > 0
                            ? movie.provider.provider
                            : (providers ?? undefined)
                        }
                        size="large"
                        maxDisplay={6}
                        showNames={false}
                        searchTitle={movie.title}
                        tmdbId={movie.id}
                        mediaType="movie"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Video Gallery - pushed to bottom on desktop */}
              <div style={{ marginTop: isMobile ? 0 : 'auto' }}>
                {!isMobile && (
                  <div style={{ marginTop: 16 }}>
                    <VideoGallery tmdbId={movie.id} mediaType="movie" buttonStyle="compact" />
                  </div>
                )}
              </div>
            </div>
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
