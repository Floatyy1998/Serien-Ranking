import {
  Add,
  BookmarkAdd,
  BookmarkRemove,
  CheckCircle,
  Delete,
  Star,
  ViewList,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useState } from 'react';
import {
  FriendsWhoHaveThis,
  ProviderBadges,
  ProviderOverrideButton,
  VideoGallery,
} from '../../../components/detail';
import {
  ActionTiles,
  DetailStage,
  ProgressStrip,
  ScoreRow,
  type ProgressSegment,
  type ScoreItem,
} from '../../../components/detail/kit/DetailKit';
import { actionClass } from '../../../components/detail/kit/actionClass';
import { RecommendButton } from '../../../components/recommendations/RecommendButton';
import { AddToListButton } from '../../../components/detail/AddToListButton';
import { OwnedButton } from '../../../components/detail/OwnedButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCommunityRating } from '../../../hooks/rating/useCommunityRatings';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { applyOverrideToProviders, mergeProviders } from '../../../lib/provider/providerMerge';
import type { MergedProvider } from '../../../lib/provider/providerMerge';
import { useActiveSubscriptions } from '../../../hooks/provider/useActiveSubscriptions';
import {
  fetchAniListProviderFallback,
  isLikelyAnime,
} from '../../../services/api/anilistProviderFallback';
import { fetchStaticCatalogSeries } from '../../../services/catalog/staticCatalog';
import { showToast } from '../../../lib/interaction/toast';
import type { Series } from '../../../types/Series';
import { hasEpisodeAired } from '../../../utils/episodeDate';
import { getImageUrl } from '../../../utils/imageUrl';
import { copyTextToClipboard } from '../../../utils/clipboard';
import { buildThemedPlaceholderDataUrl } from '../../../utils/themedPlaceholder';
import { formatVoteCount } from '../../../utils/voteCount';
import type { TMDBWatchProvider } from '../../MovieDetail/useMovieData';
import { StatusBadge, NextEpisodeChip } from './StatusBadge';
import { t } from '../../../services/i18n';

interface HeroSectionProps {
  series: Series;
  localSeries: Series | undefined;
  tmdbSeries: Series | null;
  tmdbBackdrop: string | null;
  tmdbFirstAirDate: string | null;
  tmdbRating: { vote_average: number; vote_count: number } | null;
  imdbRating: { rating: number; votes: string } | null;
  providers: TMDBWatchProvider[] | null;
  /** Beschreibungstext — breite Ansichten zeigen ihn auf der Bühne. */
  overview?: string;
  overallRating: string;
  progressStats: { watched: number; total: number; percentage: number };
  paceInfo: { text: string } | null;
  isReadOnlyTmdbSeries: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  isMobile: boolean;
  /** Nächste offene Folge — speist den Abhak-Knopf. */
  nextEpisode?: { seasonNumber: number; episodeNumber: number; episodeName?: string } | null;
  markingNext?: boolean;
  onWatchNext?: () => void;
  onAddSeries: () => void;
  onNavigateEpisodes: () => void;
  onNavigateRating: () => void;
  onWatchlistToggle: () => void;
  onHideToggle: () => void;
  onDelete: () => void;
}

const getBackdropUrl = (backdropPath: string | undefined, size: string): string => {
  if (!backdropPath) return '';
  if (backdropPath.startsWith('http')) return backdropPath;
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
};

const tapDim = { opacity: 0.7 };

export const HeroSection = memo<HeroSectionProps>(
  ({
    series,
    localSeries,
    tmdbSeries,
    tmdbBackdrop,
    tmdbFirstAirDate,
    tmdbRating,
    imdbRating,
    providers,
    overview,
    overallRating,
    progressStats,
    paceInfo,
    isReadOnlyTmdbSeries,
    isAdding,
    isDeleting,
    isMobile,
    nextEpisode,
    markingNext,
    onWatchNext,
    onAddSeries,
    onNavigateEpisodes,
    onNavigateRating,
    onWatchlistToggle,
    onHideToggle,
    onDelete,
  }) => {
    const { currentTheme: fullTheme } = useTheme();
    const genres = (series.genre?.genres || tmdbSeries?.genre?.genres || []).filter(
      (g) => g && g.trim() !== '' && g !== 'All'
    );
    const themedPlaceholder = useMemo(
      () =>
        buildThemedPlaceholderDataUrl(fullTheme.primary, fullTheme.secondary || fullTheme.accent),
      [fullTheme.primary, fullTheme.secondary, fullTheme.accent]
    );
    const posterPath =
      (series.poster && typeof series.poster === 'object' ? series.poster.poster : undefined) ||
      (tmdbSeries?.poster && typeof tmdbSeries.poster === 'object'
        ? tmdbSeries.poster.poster
        : undefined);
    // Zentrale Hilfe kennt kaputte „…w342null"-URLs (Backend-Altlast) und fällt auf den Platzhalter zurück.
    const posterUrl = getImageUrl(posterPath, 'w500', themedPlaceholder);
    const backdropUrl = getBackdropUrl(tmdbBackdrop || undefined, isMobile ? 'w780' : 'original');
    const seriesId = series.tmdb_id || series.id;
    // Anonymer Community-Durchschnitt der TV-Rank-Nutzer (ab 5 Bewertungen).
    const community = useCommunityRating('series', String(seriesId));
    const hasRating = parseFloat(overallRating) > 0;
    const iconSize = isMobile ? 21 : 19;
    const warningColor = fullTheme.status?.warning || '#f59e0b';
    const copyTitle = () => {
      void copyTextToClipboard(series.title);
      showToast(t('Titel kopiert'));
    };
    const mergedDisplayProviders = useMemo(
      () =>
        mergeProviders({
          catalog: series.provider?.provider,
          live: providers ?? undefined,
        }),
      [series.provider, providers]
    );

    // 1. Katalog-Lookup (statischer Katalog, IDB/Memory-gecacht — KEIN Request):
    //    auch für NICHT-gelistete Serien hat der Backend-Cron oft schon einen
    //    Provider (z. B. AniList-Crunchyroll-Fallback). Das spart den AniList-
    //    Call. `series.provider` greift nur bei Listen-Serien — hier per ID.
    const [catalogProviders, setCatalogProviders] = useState<MergedProvider[]>([]);
    const [catalogChecked, setCatalogChecked] = useState(false);

    useEffect(() => {
      let cancelled = false;
      setCatalogProviders([]);
      setCatalogChecked(false);
      fetchStaticCatalogSeries()
        .then((catalog) => {
          if (cancelled) return;
          const entry = catalog?.[String(seriesId)];
          setCatalogProviders(entry?.providers?.length ? entry.providers : []);
        })
        .catch(() => {
          /* best-effort — dann greift ggf. der AniList-Fallback */
        })
        .finally(() => {
          if (!cancelled) setCatalogChecked(true);
        });
      return () => {
        cancelled = true;
      };
    }, [seriesId]);

    // 2. AniList-Streaming-Link-Fallback — NUR wenn weder Merge noch Katalog
    //    etwas haben (JustWatch/TMDB kennt Nischen-Anime/frische Simulcasts
    //    oft nicht). sessionStorage-gecacht, max. 1 Request pro Titel.
    const [anilistFallback, setAnilistFallback] = useState<MergedProvider[]>([]);

    useEffect(() => {
      setAnilistFallback([]);
    }, [seriesId]);

    useEffect(() => {
      // Erst wenn Live-Fetch entschieden (providers !== null) UND Katalog
      // geprüft — beide leer — und die Serie nach Anime aussieht.
      if (
        providers === null ||
        !catalogChecked ||
        mergedDisplayProviders.length > 0 ||
        catalogProviders.length > 0 ||
        !isLikelyAnime(series)
      ) {
        return;
      }
      let cancelled = false;
      fetchAniListProviderFallback(series.title || series.name || '')
        .then((result) => {
          if (!cancelled && result.length) setAnilistFallback(result);
        })
        .catch(() => {
          /* best-effort */
        });
      return () => {
        cancelled = true;
      };
      // series-Identität wechselt pro Listen-Sync — der Re-Run ist dank
      // Guards + sessionStorage-Cache aber ein No-Op bzw. Cache-Hit.
    }, [
      providers,
      catalogChecked,
      catalogProviders.length,
      mergedDisplayProviders.length,
      seriesId,
      series,
    ]);

    // Priorität: Merge (Liste + Live) → Katalog-ID-Lookup → AniList-Fallback.
    const autoProviders = mergedDisplayProviders.length
      ? mergedDisplayProviders
      : catalogProviders.length
        ? catalogProviders
        : anilistFallback;

    // Manuelle Zuordnung gewinnt — und aktualisiert die Badges sofort nach
    // dem Speichern (Dialog meldet die Änderung per onChange zurück).
    const { getSeriesOverride } = useActiveSubscriptions();
    const [providerOverride, setProviderOverride] = useState<string | null>(null);
    useEffect(() => {
      setProviderOverride(getSeriesOverride(seriesId));
    }, [getSeriesOverride, seriesId]);
    const displayProviders = useMemo(
      () => applyOverrideToProviders(autoProviders, providerOverride),
      [autoProviders, providerOverride]
    );

    // Ein Abschnitt je Staffel, Breite nach Folgenzahl — der Streifen zeigt, WO man steht.
    const segments = useMemo<ProgressSegment[]>(
      () =>
        (series.seasons ?? []).map((season, index) => {
          const aired = (season?.episodes ?? []).filter((ep) => ep && hasEpisodeAired(ep));
          const done = aired.filter((ep) => ep.watched).length;
          return {
            key: index,
            done,
            total: aired.length,
            title: `${t('Staffel {n}', { n: (season?.seasonNumber ?? index) + 1 })}: ${done}/${aired.length}`,
          };
        }),
      [series.seasons]
    );

    const ownValue = parseFloat(overallRating);
    const imdbId = series.imdb?.imdb_id || localSeries?.imdb?.imdb_id || '';
    const tmdbValue = tmdbRating?.vote_average || series.vote_average || localSeries?.vote_average;
    const tmdbVotes = tmdbRating?.vote_count || series.vote_count || localSeries?.vote_count;
    const scores: ScoreItem[] = [
      ...(isReadOnlyTmdbSeries
        ? []
        : [
            {
              key: 'own',
              label: t('Deine Wertung'),
              value: ownValue > 0 ? ownValue.toFixed(2).replace(/\.?0+$/, '') : '–',
              tone: fullTheme.accent,
              own: true,
              onClick: onNavigateRating,
              ariaLabel: t('Deine Wertung'),
            },
          ]),
      {
        key: 'tmdb',
        label: 'TMDB',
        value: tmdbValue ? tmdbValue.toFixed(1) : '–',
        sub: tmdbVotes ? formatVoteCount(tmdbVotes) : undefined,
        tone: '#01b4e4',
        href: `https://www.themoviedb.org/tv/${seriesId}`,
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
              tone: fullTheme.primary,
            },
          ]
        : []),
    ];

    const year = tmdbFirstAirDate || series.first_air_date || series.release_date;
    const ctaInk = getOptimalTextColor(fullTheme.primary);

    const recommendButton = (
      <RecommendButton
        className={actionClass()}
        iconSize={iconSize}
        caption={t('Teilen')}
        media={{
          id: seriesId,
          type: 'series',
          title: series.title,
          posterPath,
          backdropPath: tmdbBackdrop || series.backdrop || undefined,
        }}
      />
    );

    const listButton = (
      <AddToListButton
        className={actionClass()}
        iconSize={iconSize}
        caption={t('Liste')}
        target={{ type: 'series', id: seriesId, title: series.title, poster: posterPath }}
      />
    );

    // Nicht in der Liste: Liste und Teilen bleiben — sie brauchen den Titel nicht in der Sammlung.
    const actions = isReadOnlyTmdbSeries ? (
      <ActionTiles>
        {listButton}
        {recommendButton}
      </ActionTiles>
    ) : (
      <ActionTiles>
        <motion.button whileTap={tapDim} onClick={onNavigateEpisodes} className={actionClass()}>
          <ViewList style={{ fontSize: iconSize }} />
          <span className="dk-action__label">{t('Episoden')}</span>
        </motion.button>

        <motion.button
          whileTap={tapDim}
          onClick={onNavigateRating}
          className={actionClass(hasRating ? 'on' : undefined)}
        >
          <Star style={{ fontSize: iconSize }} />
          <span className="dk-action__label">{t('Bewerten')}</span>
        </motion.button>

        <motion.button
          whileTap={tapDim}
          onClick={onWatchlistToggle}
          className={actionClass(series.watchlist ? 'on' : undefined)}
          aria-pressed={!!series.watchlist}
          aria-label={
            series.watchlist ? t('Von Watchlist entfernen') : t('Zur Watchlist hinzufügen')
          }
        >
          {series.watchlist ? (
            <BookmarkRemove style={{ fontSize: iconSize }} />
          ) : (
            <BookmarkAdd style={{ fontSize: iconSize }} />
          )}
          <span className="dk-action__label">{t('Watchlist')}</span>
        </motion.button>

        {listButton}

        <OwnedButton
          className={actionClass()}
          iconSize={iconSize}
          caption={t('Besitz')}
          target={{ type: 'series', id: seriesId }}
          owned={!!series.ownedAt}
        />

        {recommendButton}

        <motion.button
          whileTap={tapDim}
          onClick={onHideToggle}
          className={actionClass()}
          style={series.hidden ? { color: warningColor } : undefined}
        >
          {series.hidden ? (
            <Visibility style={{ fontSize: iconSize }} />
          ) : (
            <VisibilityOff style={{ fontSize: iconSize }} />
          )}
          <span className="dk-action__label">
            {series.hidden ? t('Einblenden') : t('Ausblenden')}
          </span>
        </motion.button>

        <motion.button
          whileTap={tapDim}
          onClick={onDelete}
          disabled={isDeleting}
          className={actionClass('danger')}
          style={{ opacity: isDeleting ? 0.4 : 1 }}
        >
          <Delete style={{ fontSize: iconSize }} />
          <span className="dk-action__label">{t('Löschen')}</span>
        </motion.button>
      </ActionTiles>
    );

    const genreChips = genres.length > 0 && (
      <div className="dk-genres">
        {genres.slice(0, 5).map((g) => (
          <span key={g} className="dk-genre">
            {g}
          </span>
        ))}
      </div>
    );

    const where = (
      <div className="dk-where">
        {displayProviders.length > 0 && (
          <ProviderBadges
            providers={displayProviders}
            size={isMobile ? 'medium' : 'large'}
            maxDisplay={isMobile ? 4 : 6}
            showNames={false}
            searchTitle={series.title || series.name}
            tmdbId={seriesId}
            mediaType="tv"
          />
        )}
        <ProviderOverrideButton
          seriesId={seriesId}
          seriesTitle={series.title || series.name}
          size={isMobile ? 'medium' : 'large'}
          hasProviders={displayProviders.length > 0}
          onChange={setProviderOverride}
        />
        <VideoGallery tmdbId={seriesId} mediaType="tv" buttonStyle="chip" />
        {!isMobile && <FriendsWhoHaveThis itemId={series.id} mediaType="series" />}
      </div>
    );

    return (
      <DetailStage
        art={backdropUrl || undefined}
        wash={posterUrl}
        navEnd={
          isReadOnlyTmdbSeries && (
            <button
              type="button"
              onClick={onAddSeries}
              disabled={isAdding}
              aria-label={t('Zur Sammlung hinzufügen')}
              className="hero-add-pill"
              style={{
                background: `linear-gradient(135deg, ${fullTheme.primary}, ${fullTheme.accent})`,
                boxShadow: `0 6px 22px ${fullTheme.primary}66`,
                color: ctaInk,
              }}
            >
              <Add style={{ fontSize: 22 }} />
              <span className="hero-add-pill__label">
                {isAdding ? t('Wird hinzugefügt…') : t('Hinzufügen')}
              </span>
            </button>
          )
        }
        poster={
          <img
            src={posterUrl}
            alt={series.title}
            style={{ viewTransitionName: `poster-series-${series.id}` }}
          />
        }
        below={
          <>
            {isMobile && genreChips}

            <ScoreRow items={scores} />

            {!isReadOnlyTmdbSeries && progressStats.total > 0 && (
              <ProgressStrip segments={segments} aside={paceInfo?.text}>
                <strong>{progressStats.percentage}&thinsp;%</strong>
                {' · '}
                {t('{watched} von {total} Episoden', {
                  watched: progressStats.watched,
                  total: progressStats.total,
                })}
              </ProgressStrip>
            )}

            <div className="dk-cta-row">
              {nextEpisode && !series.hidden && onWatchNext && (
                <motion.button
                  type="button"
                  whileTap={tapDim}
                  className="dk-cta"
                  onClick={onWatchNext}
                  disabled={markingNext}
                  style={{ color: ctaInk }}
                  aria-label={t('Nächste Folge S{s} E{e} als gesehen markieren', {
                    s: nextEpisode.seasonNumber,
                    e: nextEpisode.episodeNumber,
                  })}
                >
                  <CheckCircle style={{ fontSize: 26, flexShrink: 0 }} />
                  <span className="dk-cta__text">
                    <span className="dk-cta__main">{t('Als gesehen markieren')}</span>
                    <span className="dk-cta__sub">
                      S{nextEpisode.seasonNumber} E{nextEpisode.episodeNumber}
                      {nextEpisode.episodeName ? ` · ${nextEpisode.episodeName}` : ''}
                    </span>
                  </span>
                </motion.button>
              )}
              {!isMobile && where}
            </div>

            {actions}

            {isMobile && where}
          </>
        }
      >
        <div className="dk-kicker">
          <StatusBadge series={series} />
          <NextEpisodeChip series={series} upcomingOnly={!!nextEpisode} />
        </div>

        <h1
          className="dk-title"
          tabIndex={0}
          title={t('Titel kopieren')}
          onClick={copyTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              copyTitle();
            }
          }}
        >
          {series.title}
        </h1>

        <div className="dk-meta">
          {year && <span>{new Date(year).getFullYear()}</span>}
          {series.seasons && (
            <span>
              {series.seasons.length === 1
                ? t('1 Staffel')
                : t('{n} Staffeln', { n: series.seasons.length })}
            </span>
          )}
          {series.episodeRuntime > 0 && (
            <span>{t('{n} Min. pro Folge', { n: series.episodeRuntime })}</span>
          )}
        </div>

        {!isMobile && genreChips}
        {overview && <p className="dk-overview">{overview}</p>}
      </DetailStage>
    );
  }
);

HeroSection.displayName = 'HeroSection';
