import AddRounded from '@mui/icons-material/AddRounded';
import Check from '@mui/icons-material/Check';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Delete from '@mui/icons-material/Delete';
import Star from '@mui/icons-material/Star';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { ProviderBadges, VideoGallery } from '../../components/detail';
import {
  ActionTiles,
  DetailStage,
  ScoreRow,
  type ScoreItem,
} from '../../components/detail/kit/DetailKit';
import { actionClass } from '../../components/detail/kit/actionClass';
import { RecommendButton } from '../../components/recommendations/RecommendButton';
import { AddToListButton } from '../../components/detail/AddToListButton';
import { OwnedButton } from '../../components/detail/OwnedButton';
import { useTheme } from '../../contexts/ThemeContext';
import { mergeProviders } from '../../lib/provider/providerMerge';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { t } from '../../services/i18n';
import type { Movie } from '../../types/Movie';
import { getImageUrl } from '../../utils/imageUrl';
import { buildThemedPlaceholderDataUrl } from '../../utils/themedPlaceholder';
import { formatVoteCount } from '../../utils/voteCount';
import type { TMDBWatchProvider } from './useMovieData';
import { useCommunityRating } from '../../hooks/rating/useCommunityRatings';

interface MovieHeroSectionProps {
  movie: Movie;
  id: string | undefined;
  isMobile: boolean;
  tmdbBackdrop: string | null;
  /** Handlungstext — breite Ansichten zeigen ihn auf der Bühne. */
  overview?: string;
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
  onToggleWatched: () => void;
  onDeleteClick: () => void;
}

const tapDim = { opacity: 0.7 };

export const MovieHeroSection = memo(
  ({
    movie,
    id,
    isMobile,
    tmdbBackdrop,
    overview,
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
    onToggleWatched,
    onDeleteClick,
  }: MovieHeroSectionProps) => {
    const { currentTheme } = useTheme();
    // Anonymer Community-Durchschnitt der TV-Rank-Nutzer (ab 5 Bewertungen).
    const community = useCommunityRating('movies', id);
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
    // Zentrale Hilfe kennt kaputte „…w342null"-URLs (Backend-Altlast) und fällt auf den Platzhalter zurück.
    const posterUrl = getImageUrl(posterPath, 'w500', themedPlaceholder);
    const backdropUrl = tmdbBackdrop ? getBackdropUrl(tmdbBackdrop) : '';

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

    const imdbId = movie?.imdb?.imdb_id || '';
    const scores: ScoreItem[] = [
      ...(isReadOnlyTmdbMovie
        ? []
        : [
            {
              key: 'own',
              label: t('Deine Wertung'),
              value: averageRating > 0 ? String(averageRating) : '–',
              tone: currentTheme.accent,
              own: true,
              onClick: onNavigateRate,
              ariaLabel: t('Deine Wertung'),
            },
          ]),
      {
        key: 'tmdb',
        label: 'TMDB',
        value: tmdbRating?.vote_average ? tmdbRating.vote_average.toFixed(1) : '–',
        sub: tmdbRating?.vote_count ? formatVoteCount(tmdbRating.vote_count) : undefined,
        tone: '#01b4e4',
        href: `https://www.themoviedb.org/movie/${id}`,
      },
      {
        key: 'imdb',
        label: 'IMDb',
        value: imdbRating?.rating ? imdbRating.rating.toFixed(1) : '–',
        sub: imdbRating ? formatVoteCount(imdbRating.votes) : undefined,
        tone: '#f5c518',
        href: imdbId ? `https://www.imdb.com/title/${imdbId}` : undefined,
        dim: !imdbId,
      },
      ...(community
        ? [
            {
              key: 'tvrank',
              label: 'TV-Rank',
              value: community.a.toFixed(1),
              sub: String(community.c),
              tone: currentTheme.primary,
            },
          ]
        : []),
    ];

    const iconSize = isMobile ? 21 : 19;
    const ctaInk = getOptimalTextColor(currentTheme.primary);

    const genreChips = allGenres.length > 0 && (
      <div className="dk-genres">
        {allGenres.slice(0, 5).map((genre) => (
          <span key={genre} className="dk-genre">
            {genre}
          </span>
        ))}
      </div>
    );

    const where = (
      <div className="dk-where">
        {mergedDisplayProviders.length > 0 && (
          <ProviderBadges
            providers={mergedDisplayProviders}
            size={isMobile ? 'medium' : 'large'}
            maxDisplay={isMobile ? 4 : 6}
            showNames={false}
            searchTitle={movie.title}
            tmdbId={movie.id}
            mediaType="movie"
          />
        )}
        <VideoGallery tmdbId={movie.id} mediaType="movie" buttonStyle="chip" />
      </div>
    );

    return (
      <DetailStage
        art={backdropUrl || undefined}
        wash={posterUrl}
        navEnd={
          isReadOnlyTmdbMovie && (
            <button
              type="button"
              onClick={onAddMovie}
              disabled={isAdding}
              aria-label={t('Zur Sammlung hinzufügen')}
              className="hero-add-pill"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                boxShadow: `0 6px 22px ${currentTheme.primary}66`,
                color: ctaInk,
              }}
            >
              <AddRounded style={{ fontSize: 22 }} />
              <span className="hero-add-pill__label">
                {isAdding ? t('Wird hinzugefügt…') : t('Hinzufügen')}
              </span>
            </button>
          )
        }
        poster={
          <img
            src={posterUrl}
            alt={movie.title}
            style={{ viewTransitionName: `poster-movie-${movie.id}` }}
          />
        }
        below={
          <>
            {isMobile && genreChips}

            <ScoreRow items={scores} />

            <div className="dk-cta-row">
              {!isReadOnlyTmdbMovie && (
                <motion.button
                  type="button"
                  whileTap={tapDim}
                  onClick={onToggleWatched}
                  aria-pressed={isWatched}
                  aria-label={
                    isWatched ? t('Als nicht gesehen markieren') : t('Als gesehen markieren')
                  }
                  className={`dk-cta${isWatched ? ' dk-cta--done' : ''}`}
                  style={isWatched ? undefined : { color: ctaInk }}
                >
                  {isWatched ? (
                    <CheckCircle aria-hidden style={{ fontSize: 26, flexShrink: 0 }} />
                  ) : (
                    <Check aria-hidden style={{ fontSize: 26, flexShrink: 0 }} />
                  )}
                  <span className="dk-cta__text">
                    <span className="dk-cta__main">
                      {isWatched ? t('Gesehen') : t('Als gesehen')}
                    </span>
                  </span>
                </motion.button>
              )}
              {!isMobile && where}
            </div>

            {/* Gesehen/Bewerten/Löschen nur für eigene Filme — Liste und Teilen
                immer (brauchen den Film nicht in der Sammlung). */}
            <ActionTiles>
              {!isReadOnlyTmdbMovie && (
                <motion.button
                  type="button"
                  whileTap={tapDim}
                  onClick={onNavigateRate}
                  className={actionClass(averageRating > 0 ? 'on' : undefined)}
                >
                  <Star style={{ fontSize: iconSize }} />
                  <span className="dk-action__label">{t('Bewerten')}</span>
                </motion.button>
              )}

              <AddToListButton
                className={actionClass()}
                iconSize={iconSize}
                caption={t('Liste')}
                target={{ type: 'movie', id: movie.id, title: movie.title, poster: posterPath }}
              />

              {!isReadOnlyTmdbMovie && (
                <OwnedButton
                  className={actionClass()}
                  iconSize={iconSize}
                  caption={t('Besitz')}
                  target={{ type: 'movie', id: movie.id }}
                  owned={!!movie.ownedAt}
                />
              )}

              <RecommendButton
                className={actionClass()}
                iconSize={iconSize}
                caption={t('Teilen')}
                media={{
                  id: movie.id,
                  type: 'movie',
                  title: movie.title,
                  posterPath,
                  backdropPath: tmdbBackdrop || movie.backdrop || undefined,
                }}
              />

              {!isReadOnlyTmdbMovie && (
                <motion.button
                  type="button"
                  whileTap={tapDim}
                  onClick={onDeleteClick}
                  className={actionClass('danger')}
                  aria-label={t('Film löschen')}
                >
                  <Delete style={{ fontSize: iconSize }} />
                  <span className="dk-action__label">{t('Löschen')}</span>
                </motion.button>
              )}
            </ActionTiles>

            {isMobile && where}
          </>
        }
      >
        <h1 className="dk-title">{movie.title}</h1>

        <div className="dk-meta">
          {movie.release_date && <span>{new Date(movie.release_date).getFullYear()}</span>}
          {movie.runtime > 0 && <span>{formatRuntime(movie.runtime)}</span>}
          {movie.status && movie.status !== 'Released' && <span>{movie.status}</span>}
        </div>

        {!isMobile && genreChips}
        {overview && <p className="dk-overview">{overview}</p>}
      </DetailStage>
    );
  }
);

MovieHeroSection.displayName = 'MovieHeroSection';
