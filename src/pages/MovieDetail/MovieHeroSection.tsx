import Delete from '@mui/icons-material/Delete';
import Star from '@mui/icons-material/Star';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { BackButton } from '../../components/ui';
import { FriendsWhoHaveThis, ProviderBadges, VideoGallery } from '../../components/detail';
import { RecommendButton } from '../../components/recommendations/RecommendButton';
import { useTheme } from '../../contexts/ThemeContextDef';
import { tapScale } from '../../lib/motion';
import { mergeProviders } from '../../lib/providerMerge';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { Movie } from '../../types/Movie';
import { getImageUrl } from '../../utils/imageUrl';
import { buildThemedPlaceholderDataUrl } from '../../utils/themedPlaceholder';
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
  onNavigateRate: () => void;
  onDeleteClick: () => void;
}

const getPosterUrl = (posterPath: string | undefined, fallback: string): string => {
  // Defer to central util — kennt kaputte "...w342null"-URLs (Backend-Altlast)
  // und greift dann auf den themed Placeholder zurueck.
  return getImageUrl(posterPath, 'w500', fallback);
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
    onNavigateRate,
    onDeleteClick,
  }: MovieHeroSectionProps) => {
    const { currentTheme } = useTheme();
    const themedPlaceholder = useMemo(
      () =>
        buildThemedPlaceholderDataUrl(
          currentTheme.primary,
          currentTheme.secondary || currentTheme.accent
        ),
      [currentTheme.primary, currentTheme.secondary, currentTheme.accent]
    );
    const posterPath =
      movie.poster && typeof movie.poster === 'object' ? movie.poster.poster : undefined;
    const posterUrl = getPosterUrl(posterPath, themedPlaceholder);
    const backdropUrl = tmdbBackdrop ? getBackdropUrl(tmdbBackdrop) : '';
    const mobileBackdropUrl = backdropUrl || posterUrl;

    const genres = (movie.genre?.genres || []).filter((g) => g && g.trim() !== '' && g !== 'All');
    const tmdbGenres = movie.genres?.map((g) => g.name) || [];
    const allGenres = genres.length > 0 ? genres : tmdbGenres;

    const mergedDisplayProviders = useMemo(
      () =>
        mergeProviders({
          catalog: movie.provider?.provider,
          live: providers ?? undefined,
        }),
      [movie.provider, providers]
    );

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
            <BackButton
              style={{
                backdropFilter: 'var(--blur-sm)',
                WebkitBackdropFilter: 'var(--blur-sm)',
              }}
            />

            {isReadOnlyTmdbMovie && (
              <button
                type="button"
                onClick={onAddMovie}
                disabled={isAdding}
                aria-label="Zur Sammlung hinzufügen"
                title="Zur Sammlung hinzufügen"
                className="md-hero__action-btn md-hero__action-btn--add"
                style={{
                  background: isAdding
                    ? `${currentTheme.status.success}88`
                    : `${currentTheme.status.success}CC`,
                  color: getOptimalTextColor(currentTheme.status.success),
                }}
              >
                <span aria-hidden>{isAdding ? '...' : '+'}</span>
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
            {/* Poster — shared view-transition target (matches the listing
                card key). Browsers without VT support ignore the style. */}
            {posterUrl && (
              <img
                src={posterUrl}
                alt={movie.title}
                className="md-hero__poster"
                style={{
                  viewTransitionName: `poster-movie-${movie.id}`,
                  ...(isMobile
                    ? { width: 150, height: 220, borderRadius: 14, marginBottom: 20 }
                    : {}),
                }}
              />
            )}

            {/* Info */}
            <div
              className={isMobile ? undefined : 'md-hero__glass-card'}
              style={isMobile ? { width: '100%' } : { position: 'relative' }}
            >
              {/* Friends - top right corner on desktop */}
              {!isMobile && (
                <div style={{ position: 'absolute', top: 20, right: 24 }}>
                  <FriendsWhoHaveThis itemId={movie.id} mediaType="movie" />
                </div>
              )}
              <h1
                className="md-hero__title"
                style={{
                  fontSize: isMobile ? 24 : 28,
                  textAlign: isMobile ? 'center' : 'left',
                  margin: isMobile ? '0 20px 4px' : undefined,
                  paddingRight: isMobile ? undefined : 80,
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
                  color: isMobile ? currentTheme.text.muted : undefined,
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
              </div>

              {/* Genre Tags + Friends */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 10,
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  padding: isMobile ? '0 20px' : undefined,
                }}
              >
                {allGenres.slice(0, 4).map((genre, i) => (
                  <span key={i} className="md-genre-tag">
                    {genre}
                  </span>
                ))}
              </div>

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
                  {mergedDisplayProviders.length > 0 && (
                    <ProviderBadges
                      providers={mergedDisplayProviders}
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
                  {mergedDisplayProviders.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <ProviderBadges
                        providers={mergedDisplayProviders}
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

              {/* Actions: Bewerten + Empfehlen (nur fuer eigene Filme) */}
              {!isReadOnlyTmdbMovie && (
                <div
                  className="md-hero__actions"
                  style={{
                    justifyContent: isMobile ? 'center' : 'flex-start',
                    padding: isMobile ? '16px 20px 0' : undefined,
                    marginTop: isMobile ? 0 : 16,
                  }}
                >
                  <motion.button
                    whileTap={tapScale}
                    onClick={onNavigateRate}
                    className={`md-rate-btn ${isMobile ? 'md-rate-btn--mobile' : ''}`}
                    style={{
                      flex: isMobile ? 1 : '0 0 auto',
                      minWidth: isMobile ? 0 : 160,
                      background: isWatched
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isWatched
                        ? '1px solid rgba(255, 215, 0, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Star
                      style={{
                        fontSize: isMobile ? '16px' : '18px',
                        color: isWatched ? currentTheme.accent : currentTheme.text.secondary,
                      }}
                    />
                    Bewerten
                  </motion.button>

                  <RecommendButton
                    className="action-btn"
                    iconSize={isMobile ? 18 : 20}
                    style={{
                      padding: isMobile ? '10px' : '12px',
                      border: `1px solid ${currentTheme.primary}33`,
                      borderRadius: isMobile ? '10px' : '12px',
                      fontSize: isMobile ? '13px' : '16px',
                      background: `${currentTheme.primary}10`,
                    }}
                    media={{
                      id: movie.id,
                      type: 'movie',
                      title: movie.title,
                      posterPath,
                      backdropPath: tmdbBackdrop || movie.backdrop || undefined,
                    }}
                  />

                  <Tooltip title="Film löschen" arrow>
                    <motion.button
                      whileTap={tapScale}
                      onClick={onDeleteClick}
                      className="action-btn"
                      style={{
                        padding: isMobile ? '10px' : '12px',
                        background: 'rgba(220, 53, 69, 0.1)',
                        border: '1px solid rgba(220, 53, 69, 0.3)',
                        borderRadius: isMobile ? '10px' : '12px',
                        fontSize: isMobile ? '13px' : '16px',
                      }}
                    >
                      <Delete
                        style={{
                          fontSize: isMobile ? '18px' : '20px',
                          color: currentTheme.status?.error || '#ef4444',
                        }}
                      />
                    </motion.button>
                  </Tooltip>
                </div>
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
