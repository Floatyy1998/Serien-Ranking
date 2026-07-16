import {
  BookmarkAdd,
  BookmarkRemove,
  Delete,
  PlayCircle,
  Star,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useDrawInProgress } from '../../hooks/useDrawInProgress';
import { BackButton } from '../../components/ui';
import {
  FriendsWhoHaveThis,
  ProviderBadges,
  ProviderOverrideButton,
  VideoGallery,
} from '../../components/detail';
import { RecommendButton } from '../../components/recommendations/RecommendButton';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { mergeProviders } from '../../lib/providerMerge';
import type { MergedProvider } from '../../lib/providerMerge';
import {
  fetchAniListProviderFallback,
  isLikelyAnime,
} from '../../services/anilistProviderFallback';
import { fetchStaticCatalogSeries } from '../../services/staticCatalog';
import { showToast } from '../../lib/toast';
import type { WatchingPace } from '../../lib/date/paceCalculation';
import type { Series } from '../../types/Series';
import { getImageUrl } from '../../utils/imageUrl';
import { buildThemedPlaceholderDataUrl } from '../../utils/themedPlaceholder';
import type { TMDBWatchProvider } from '../MovieDetail/useMovieData';
import { RatingsCard } from './RatingsCard';
import { StatusBadge, NextEpisodeChip } from './StatusBadge';
import { tapScale } from '../../lib/motion';

interface HeroSectionProps {
  series: Series;
  localSeries: Series | undefined;
  tmdbSeries: Series | null;
  tmdbBackdrop: string | null;
  tmdbFirstAirDate: string | null;
  tmdbRating: { vote_average: number; vote_count: number } | null;
  imdbRating: { rating: number; votes: string } | null;
  providers: TMDBWatchProvider[] | null;
  /** Beschreibungstext — Desktop zeigt ihn IM Hero (2050-Streaming-Layout). */
  overview?: string;
  overallRating: string;
  progressStats: { watched: number; total: number; percentage: number };
  paceInfo: { text: string; pace?: WatchingPace } | null;
  isReadOnlyTmdbSeries: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  isMobile: boolean;
  currentTheme: { status: { success: string }; accent: string };
  onAddSeries: () => void;
  onNavigateEpisodes: () => void;
  onNavigateRating: () => void;
  onWatchlistToggle: () => void;
  onHideToggle: () => void;
  onDelete: () => void;
}

const getBackdropUrl = (backdropPath: string | undefined): string => {
  if (!backdropPath) return '';
  if (backdropPath.startsWith('http')) return backdropPath;
  return `https://image.tmdb.org/t/p/original${backdropPath}`;
};

const getPosterUrl = (posterPath: string | undefined, fallback: string): string => {
  // Defer to central util — kennt kaputte "...w342null"-URLs (Backend-Altlast)
  // und greift dann auf den themed Placeholder zurueck.
  return getImageUrl(posterPath, 'w500', fallback);
};

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
    currentTheme,
    onAddSeries,
    onNavigateEpisodes,
    onNavigateRating,
    onWatchlistToggle,
    onHideToggle,
    onDelete,
  }) => {
    const { currentTheme: fullTheme } = useTheme();
    // D1: Ring-Fortschritt wird per rAF animiert (--prog) an den Wrapper geschrieben.
    const posterWrapRef = useRef<HTMLDivElement>(null);
    useDrawInProgress(posterWrapRef, progressStats.percentage);
    const genres = (series.genre?.genres || tmdbSeries?.genre?.genres || []).filter(
      (g) => g && g.trim() !== '' && g !== 'All'
    );
    // Desktop: max. 2 Genres in der Meta-Zeile — vier Stück machen sie zur Wurst.
    const maxGenres = isMobile ? 3 : 2;
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
    const posterUrl = getPosterUrl(posterPath, themedPlaceholder);
    const backdropUrl = getBackdropUrl(tmdbBackdrop || undefined);
    const mobileBackdropUrl = backdropUrl || posterUrl;
    const seriesId = series.tmdb_id || series.id;
    const hasRating = parseFloat(overallRating) > 0;
    const iconSize = isMobile ? 17 : 19;
    const warningColor = fullTheme.status?.warning || '#f59e0b';
    const copyTitle = () => {
      navigator.clipboard.writeText(series.title);
      showToast('Titel kopiert');
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
    const displayProviders = mergedDisplayProviders.length
      ? mergedDisplayProviders
      : catalogProviders.length
        ? catalogProviders
        : anilistFallback;

    const actionButtons = !isReadOnlyTmdbSeries && (
      <div className="hero-actions">
        <motion.button
          whileTap={tapScale}
          onClick={onNavigateEpisodes}
          className="hero-actions__btn hero-actions__btn--primary"
          style={{
            background: `linear-gradient(135deg, ${fullTheme.primary}, ${fullTheme.accent})`,
          }}
        >
          <PlayCircle style={{ fontSize: iconSize }} />
          <span>Episoden</span>
        </motion.button>

        <motion.button
          whileTap={tapScale}
          onClick={onNavigateRating}
          className="hero-actions__btn"
          aria-label="Bewerten"
          style={
            hasRating
              ? {
                  color: fullTheme.accent,
                  borderColor: `${fullTheme.accent}33`,
                  background: `${fullTheme.accent}0d`,
                }
              : undefined
          }
        >
          <Star style={{ fontSize: iconSize }} />
          {!isMobile && <span>Bewerten</span>}
        </motion.button>

        <Tooltip title={series.watchlist ? 'Von Watchlist entfernen' : 'Watchlist'} arrow>
          <motion.button
            whileTap={tapScale}
            onClick={onWatchlistToggle}
            className="hero-actions__btn"
            aria-label={series.watchlist ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufügen'}
            style={
              series.watchlist
                ? {
                    color: fullTheme.primary,
                    borderColor: `${fullTheme.primary}33`,
                    background: `${fullTheme.primary}0d`,
                  }
                : undefined
            }
          >
            {series.watchlist ? (
              <BookmarkRemove style={{ fontSize: iconSize }} />
            ) : (
              <BookmarkAdd style={{ fontSize: iconSize }} />
            )}
          </motion.button>
        </Tooltip>

        <RecommendButton
          className="hero-actions__btn"
          iconSize={iconSize}
          media={{
            id: seriesId,
            type: 'series',
            title: series.title,
            posterPath,
            backdropPath: tmdbBackdrop || series.backdrop || undefined,
          }}
        />

        <Tooltip title={series.hidden ? 'Einblenden' : 'Ausblenden'} arrow>
          <motion.button
            whileTap={tapScale}
            onClick={onHideToggle}
            className="hero-actions__btn"
            aria-label={series.hidden ? 'Einblenden' : 'Ausblenden'}
            style={
              series.hidden
                ? {
                    color: warningColor,
                    borderColor: `${warningColor}40`,
                    background: `${warningColor}14`,
                  }
                : undefined
            }
          >
            {series.hidden ? (
              <Visibility style={{ fontSize: iconSize }} />
            ) : (
              <VisibilityOff style={{ fontSize: iconSize }} />
            )}
          </motion.button>
        </Tooltip>

        <Tooltip title="Löschen" arrow>
          <motion.button
            whileTap={{ scale: isDeleting ? 1 : 0.96 }}
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Löschen"
            className="hero-actions__btn hero-actions__btn--danger"
            style={{ opacity: isDeleting ? 0.4 : 1 }}
          >
            <Delete style={{ fontSize: iconSize }} />
          </motion.button>
        </Tooltip>
      </div>
    );

    return (
      <div className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Backdrop */}
        {isMobile ? (
          <div
            className="hero-section__backdrop-bg"
            style={{
              backgroundImage: mobileBackdropUrl ? `url(${mobileBackdropUrl})` : undefined,
              filter: 'blur(50px) brightness(0.25) saturate(1.8)',
              transform: 'scale(1.3)',
            }}
          />
        ) : (
          <div
            className="hero-section__backdrop-bg"
            style={{
              backgroundImage: backdropUrl ? `url(${backdropUrl})` : undefined,
              filter: 'brightness(0.7) saturate(1.08)',
            }}
          />
        )}

        {/* Lesbarkeits-Verläufe: unten in den Seiten-Hintergrund, links (Desktop)
            eine dunkle Zone unter Titel/Meta — statt einer Glas-Box davor. */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: isMobile ? '60%' : '70%',
            zIndex: 1,
            background: `linear-gradient(transparent, ${fullTheme.background.default})`,
          }}
        />
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background: `linear-gradient(90deg, ${fullTheme.background.default}d9 0%, ${fullTheme.background.default}73 26%, transparent 48%)`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Vignette on desktop */}
        {!isMobile && <div className="hero-section__vignette" />}

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
          <BackButton
            style={{ backdropFilter: 'var(--blur-sm)', WebkitBackdropFilter: 'var(--blur-sm)' }}
          />
        </div>

        {/* Add button for TMDB-only series */}
        {isReadOnlyTmdbSeries && (
          <Tooltip title="Zur Sammlung hinzufugen" arrow>
            <button
              onClick={onAddSeries}
              disabled={isAdding}
              aria-label="Zur Sammlung hinzufügen"
              className="hero-section__add-btn"
              style={{
                top: isMobile
                  ? 'calc(10px + env(safe-area-inset-top))'
                  : 'calc(20px + env(safe-area-inset-top))',
                right: isMobile ? '10px' : '20px',
                background: isAdding
                  ? `${currentTheme.status.success}88`
                  : `${currentTheme.status.success}CC`,
                color: getOptimalTextColor(currentTheme.status.success),
                cursor: isAdding ? 'not-allowed' : 'pointer',
              }}
            >
              {isAdding ? '...' : '+'}
            </button>
          </Tooltip>
        )}

        {/* Content: Poster + Info */}
        <div
          className="hero-section__content-row"
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
          {/* Poster — shared view-transition target. Matches the listing
              card's `poster-series-${id}` in RatingItemCard so chromium-based
              browsers animate the morph automatically.
              D1: Wrapper trägt den Fortschritts-Ring (conic ::before/::after),
              gleiche Technik wie im Ratings-Grid. */}
          {posterUrl && (
            <div
              ref={posterWrapRef}
              className={`hero-section__poster-wrap${
                progressStats.percentage > 0
                  ? ` hero-section__poster-wrap--ring${
                      progressStats.percentage >= 100 ? ' hero-section__poster-wrap--ring-done' : ''
                    }`
                  : ''
              }`}
              style={
                {
                  '--ring-color':
                    progressStats.percentage >= 100
                      ? currentTheme.status.success
                      : fullTheme.primary,
                  '--poster-radius': isMobile ? '14px' : '16px',
                  // Mobile-Layout zentriert die Spalte — align-self aus der
                  // Desktop-CSS (flex-start) hier wieder aufheben.
                  ...(isMobile ? { marginBottom: 20, alignSelf: 'center' } : {}),
                } as CSSProperties
              }
            >
              <img
                src={posterUrl}
                alt={series.title}
                className="hero-section__poster"
                style={{
                  viewTransitionName: `poster-series-${series.id}`,
                  ...(isMobile ? { width: 150, height: 220, borderRadius: 14 } : {}),
                }}
              />
            </div>
          )}

          {/* Info */}
          <div
            className={isMobile ? undefined : 'hero-section__glass-card'}
            style={isMobile ? { width: '100%' } : { position: 'relative' }}
          >
            <h1
              className="hero-section__title"
              tabIndex={0}
              title="Titel kopieren"
              style={{
                // Kino-Titel: groß, WEISS über dem Artwork (Poster-Logik) mit
                // Theme-Glow — kein Fließtext-Grün in Link-Größe.
                fontSize: isMobile ? '26px' : 'clamp(40px, 2.6vw + 18px, 68px)',
                lineHeight: 1.1,
                color: '#fff',
                cursor: 'pointer',
                textAlign: isMobile ? 'center' : 'left',
                margin: isMobile ? '0 20px 4px' : '0 0 8px',
                paddingRight: isMobile ? undefined : 80,
                letterSpacing: '-0.025em',
                textShadow: `0 2px 28px rgba(0,0,0,0.7), 0 0 80px ${fullTheme.primary}40`,
              }}
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

            <div
              className="hero-section__meta"
              style={{
                gap: isMobile ? '3px 8px' : '12px',
                fontSize: isMobile ? '13px' : '16px',
                justifyContent: isMobile ? 'center' : 'flex-start',
                padding: isMobile ? '0 20px' : undefined,
                marginTop: isMobile ? 8 : 12,
                color: isMobile ? fullTheme.text.muted : fullTheme.text.secondary,
              }}
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
                <span style={{ color: currentTheme.accent }}>&bull; &#11088; {overallRating}</span>
              )}
              {/* Desktop: Genres als ruhiger Text in der Meta-Zeile — Chips
                  derselben Form wie Status-Badges erzeugten nur Rauschen. */}
              {!isMobile && genres.length > 0 && (
                <span style={{ color: fullTheme.text.muted }}>
                  &bull; {genres.slice(0, maxGenres).join(', ')}
                </span>
              )}
            </div>

            {/* Ein einziger Akzent-Chip (nächste Folge); der Status steht als
                Text in der Meta-Zeile — Desktop braucht keinen Doppel-Chip. */}
            <div
              className="hero-section__badges"
              style={{
                gap: isMobile ? '6px' : '8px',
                justifyContent: isMobile ? 'center' : 'flex-start',
                padding: isMobile ? '0 20px' : undefined,
                marginTop: isMobile ? 12 : 18,
              }}
            >
              {isMobile && <StatusBadge series={series} />}
              <NextEpisodeChip series={series} />
            </div>

            {/* Desktop: Beschreibung gehört IN den Hero (Streaming-Layout) —
                3 Zeilen, Inhaltsbreite, statt einsamer Sektion darunter. */}
            {!isMobile && overview && (
              <p
                style={{
                  // Desktop zeigt den KOMPLETTEN Text (kein Clamp, kein „…") —
                  // der Hero wächst mit; Platz ist genug da.
                  margin: '16px 0 0',
                  maxWidth: 1100,
                  fontSize: 15.5,
                  lineHeight: 1.65,
                  color: fullTheme.text.secondary,
                  textShadow: '0 1px 12px rgba(0,0,0,0.6)',
                }}
              >
                {overview}
              </p>
            )}

            {/* Genre Tags — nur Mobile (Desktop: in der Meta-Zeile) */}
            {isMobile && genres.length > 0 && (
              <div
                className="hero-section__badges"
                style={{
                  gap: '6px',
                  marginTop: 6,
                  marginBottom: 10,
                  justifyContent: 'center',
                  padding: '0 20px',
                }}
              >
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
            )}

            {/* Ratings + Provider row */}
            {isMobile ? (
              <>
                <div
                  style={{
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  <RatingsCard
                    series={series}
                    localSeries={localSeries}
                    tmdbRating={tmdbRating}
                    imdbRating={imdbRating}
                    seriesId={String(seriesId)}
                    isMobile
                    noMargin
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 10,
                    padding: '0 20px',
                    justifyContent: 'center',
                  }}
                >
                  {displayProviders.length > 0 && (
                    <ProviderBadges
                      providers={displayProviders}
                      size="medium"
                      maxDisplay={4}
                      showNames={false}
                      searchTitle={series.title || series.name}
                      tmdbId={seriesId}
                      mediaType="tv"
                    />
                  )}
                  <ProviderOverrideButton
                    seriesId={seriesId}
                    seriesTitle={series.title || series.name}
                  />
                  <VideoGallery tmdbId={seriesId} mediaType="tv" buttonStyle="compact" />
                </div>
              </>
            ) : null}

            {/* Bottom section: Progress + Actions (pushed to bottom on desktop) */}
            <div style={{ marginTop: isMobile ? 0 : 'auto' }}>
              {/* Desktop: Stats-Band — Fortschritts-Ring + Glas-Pods füllen die
                  Hero-Mitte mit echten Komponenten statt gequetschter Textzeilen. */}
              {!isMobile && progressStats.total > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 22,
                  }}
                >
                  {/* Ring-Pod */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 18px 10px 12px',
                      borderRadius: 16,
                      background: 'var(--glass-light)',
                      border: '1px solid var(--glass-border-light)',
                      boxShadow: 'var(--glass-specular)',
                      WebkitBackdropFilter: 'var(--glass-filter-sm)',
                      backdropFilter: 'var(--glass-filter-sm)',
                    }}
                  >
                    <div style={{ position: 'relative', width: 52, height: 52 }}>
                      <svg width={52} height={52}>
                        <defs>
                          <linearGradient id="hero-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={fullTheme.primary} />
                            <stop offset="100%" stopColor={fullTheme.accent} />
                          </linearGradient>
                        </defs>
                        <circle
                          cx={26}
                          cy={26}
                          r={22}
                          fill="none"
                          strokeWidth={4}
                          style={{ stroke: 'var(--glass-border-light)' }}
                        />
                        <circle
                          cx={26}
                          cy={26}
                          r={22}
                          fill="none"
                          stroke="url(#hero-ring-grad)"
                          strokeWidth={4}
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 22}
                          strokeDashoffset={2 * Math.PI * 22 * (1 - progressStats.percentage / 100)}
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />
                      </svg>
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: 'var(--font-display)',
                          color: fullTheme.text.primary,
                        }}
                      >
                        {progressStats.percentage}%
                      </span>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          fontFamily: 'var(--font-display)',
                          color: fullTheme.text.primary,
                          lineHeight: 1.15,
                        }}
                      >
                        {progressStats.watched} / {progressStats.total}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: fullTheme.text.muted,
                        }}
                      >
                        Episoden
                      </div>
                    </div>
                  </div>

                  {/* Pace-Pods */}
                  {(() => {
                    const pace = paceInfo?.pace;
                    if (!pace) return null;
                    const fmt = (d: Date | null) =>
                      d
                        ? d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                        : null;
                    const pods: { value: string; label: string }[] = pace.isPaused
                      ? [
                          { value: 'Pausiert', label: 'Status' },
                          { value: String(pace.remainingEpisodes), label: 'Ep. offen' },
                        ]
                      : [
                          { value: String(pace.remainingEpisodes), label: 'Ep. offen' },
                          { value: `~${Math.round(pace.remainingHours)} Std.`, label: 'übrig' },
                          {
                            value: `~${(pace.episodesPerWeek / 7).toFixed(1).replace('.', ',')}`,
                            label: 'Ep. / Tag',
                          },
                          ...(fmt(pace.estimatedCompletionDate)
                            ? [
                                {
                                  value: fmt(pace.estimatedCompletionDate) as string,
                                  label: 'Fertig ca.',
                                },
                              ]
                            : []),
                        ];
                    return pods.map((pod) => (
                      <div
                        key={pod.label}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 3,
                          minWidth: 92,
                          padding: '10px 18px',
                          borderRadius: 16,
                          background: 'var(--glass-light)',
                          border: '1px solid var(--glass-border-light)',
                          boxShadow: 'var(--glass-specular)',
                          WebkitBackdropFilter: 'var(--glass-filter-sm)',
                          backdropFilter: 'var(--glass-filter-sm)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 17,
                            fontWeight: 800,
                            fontFamily: 'var(--font-display)',
                            color: fullTheme.text.primary,
                            lineHeight: 1.15,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pod.value}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: fullTheme.text.muted,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pod.label}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Progress Bar (Mobile) */}
              {isMobile && progressStats.total > 0 && (
                <div
                  style={{
                    marginTop: isMobile ? 14 : 20,
                    padding: isMobile ? '0 20px' : undefined,
                    // Desktop: Balken gehört zur Inhaltsspalte, nicht bis zum
                    // rechten Bildschirmrand.
                    maxWidth: isMobile ? undefined : 560,
                  }}
                >
                  <div className="hero-section__progress-track">
                    <div
                      className="hero-section__progress-fill"
                      style={{ width: `${progressStats.percentage}%` }}
                    />
                  </div>
                  <p
                    className="hero-section__progress-text"
                    style={{
                      fontSize: isMobile ? '11px' : '12.5px',
                      textAlign: isMobile ? 'center' : undefined,
                      color: fullTheme.text.secondary,
                      marginTop: 6,
                    }}
                  >
                    {progressStats.watched} von {progressStats.total} Episoden &middot;{' '}
                    {progressStats.percentage}&thinsp;%
                  </p>
                  {paceInfo && (
                    <p
                      className="hero-section__pace-text"
                      style={{
                        fontSize: isMobile ? '10px' : '11.5px',
                        textAlign: isMobile ? 'center' : undefined,
                        color: fullTheme.text.muted,
                        marginTop: 3,
                      }}
                    >
                      {paceInfo.text}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {actionButtons && (
                <div
                  style={{
                    marginTop: isMobile ? 14 : 18,
                    padding: isMobile ? '0 16px' : undefined,
                  }}
                >
                  {actionButtons}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Signal-Zone unten rechts — Ratings, Provider, Trailer,
              Freunde. Balanciert den Hero, statt alles links zu klumpen. */}
          {!isMobile && (
            <div
              className="liquid-glass"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 12,
                alignSelf: 'flex-end',
                flexShrink: 0,
                position: 'relative',
                zIndex: 2,
                borderRadius: 18,
                padding: '16px 18px',
              }}
            >
              <FriendsWhoHaveThis itemId={series.id} mediaType="series" />
              <RatingsCard
                series={series}
                localSeries={localSeries}
                tmdbRating={tmdbRating}
                imdbRating={imdbRating}
                seriesId={String(seriesId)}
                isMobile={false}
                noMargin
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {displayProviders.length > 0 && (
                  <ProviderBadges
                    providers={displayProviders}
                    size="large"
                    maxDisplay={6}
                    showNames={false}
                    searchTitle={series.title || series.name}
                    tmdbId={seriesId}
                    mediaType="tv"
                  />
                )}
                <ProviderOverrideButton
                  seriesId={seriesId}
                  seriesTitle={series.title || series.name}
                />
                <VideoGallery tmdbId={seriesId} mediaType="tv" buttonStyle="compact" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

HeroSection.displayName = 'HeroSection';
