import { Bookmark, PlayCircle } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import React, { useMemo } from 'react';
import { EpisodeDiscussionButton } from '../../../components/Discussion';
import { FillerChip } from '../../../components/ui/FillerChip';
import { NowPlayingIndicator } from '../../../components/ui/NowPlayingIndicator';
import { SectionHeader, SwipeableEpisodeRow } from '../../../components/ui';
import {
  buildFillerLookup,
  fillerEpisodesFromStatic,
  fillerLookupKey,
} from '../../../services/animeFillerService';
import { useAnimeFillerCatalog } from '../../../hooks/useAnimeFillerCatalog';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActiveSubscriptions } from '../../../hooks/useActiveSubscriptions';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { useTransitionNavigate } from '../../../hooks/useTransitionNavigate';
import { calculateWatchingPace, formatPaceLine } from '../../../lib/date/paceCalculation';
import { getProviderColor } from '../../../lib/providerColors';
import { resolveProviderOverlay } from '../../../lib/providerMerge';
import { normalizeProviderName } from '../../../services/detection/providerChangeDetection';
import { ProviderLogoLink } from '../../../components/detail/ProviderLogoLink';
import { hasEpisodeAired } from '../../../utils/episodeDate';
import { chipLabel, chipColor, type EpisodeChipType } from '../../../utils/episodeChips';
import type { Series } from '../../../types/Series';

// "Currently bingeing" window – 3 days. Covers casual binges that stretch
// across a weekend or weekday-evening sessions, while still letting the
// indicator fade out on long-paused shows.
const ACTIVE_WATCH_WINDOW_MS = 72 * 60 * 60 * 1000;

function formatLastWatched(lastWatchedAt: string): string | null {
  if (!lastWatchedAt) return null;
  const now = Date.now();
  const then = new Date(lastWatchedAt).getTime();
  if (isNaN(then)) return null;
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return 'Gerade eben gesehen';
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Vor ${diffHours}h gesehen`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Gestern gesehen';
  if (diffDays < 7) return `Vor ${diffDays} Tagen gesehen`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return 'Vor 1 Woche gesehen';
  if (diffDays < 30) return `Vor ${diffWeeks} Wochen gesehen`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Vor 1 Monat gesehen';
  return `Vor ${diffMonths} Monaten gesehen`;
}

interface ContinueWatchingItem {
  type: 'series';
  id: number;
  title: string;
  poster: string;
  progress: number;
  seasons: Series['seasons'];
  episodeRuntime: number;
  nextEpisode: {
    seasonNumber: number;
    episodeNumber: number;
    name: string;
    seasonIndex: number;
    episodeIndex: number;
    episodeId: number;
  };
  airDate: string;
  lastWatchedAt: string;
  genre: Series['genre'];
  provider: Series['provider'];
  chipType?: EpisodeChipType;
}

interface ContinueWatchingSectionProps {
  items: ContinueWatchingItem[];
  hiddenEpisodes: Set<string>;
  completingEpisodes: Set<string>;
  swipingEpisodes: Set<string>;
  dragOffsets: Record<string, number>;
  swipeDirections: Record<string, 'left' | 'right'>;
  onSwipeStart: (key: string) => void;
  onSwipeDrag: (key: string, offset: number) => void;
  onSwipeEnd: (key: string) => void;
  onComplete: (item: ContinueWatchingItem, direction: 'left' | 'right') => void;
  onPosterClick: (seriesId: number, title: string, episodePath: string) => void;
}

export const ContinueWatchingSection = React.memo(function ContinueWatchingSection({
  items,
  hiddenEpisodes,
  completingEpisodes,
  swipingEpisodes,
  dragOffsets,
  swipeDirections,
  onSwipeStart,
  onSwipeDrag,
  onSwipeEnd,
  onComplete,
  onPosterClick,
}: ContinueWatchingSectionProps) {
  const navigate = useTransitionNavigate();
  const { currentTheme } = useTheme();
  const accentColor = currentTheme.primary;
  const { getSeriesOverride, activeProviders } = useActiveSubscriptions();
  const { isMobile } = useDeviceType();
  const { seriesList } = useSeriesList();
  const fillerCatalog = useAnimeFillerCatalog();

  // Per-item filler lookup – sourced from the shared static catalog
  // (`anime-filler.json`), never per-series Firebase reads. The chip surfaces
  // for any anime the backend has resolved, no detail-page visit required.
  const fillerByItem = useMemo(() => {
    const map = new Map<number, ReturnType<typeof buildFillerLookup>>();
    if (!fillerCatalog) return map;
    for (const it of items) {
      const entry = fillerCatalog[String(it.id)];
      if (!entry) continue;
      map.set(it.id, buildFillerLookup(it.seasons, fillerEpisodesFromStatic(entry)));
    }
    return map;
  }, [items, fillerCatalog]);

  const unwatchlistedWithUnwatched = useMemo(() => {
    let count = 0;
    for (const s of seriesList) {
      if (s.watchlist) continue;
      const hasUnwatchedAired = s.seasons?.some((season) =>
        season.episodes?.some((ep) => !ep?.watched && hasEpisodeAired(ep))
      );
      if (hasUnwatchedAired) count++;
    }
    return count;
  }, [seriesList]);

  if (items.length === 0) {
    if (unwatchlistedWithUnwatched === 0) return null;
    return (
      <section style={{ marginBottom: '32px' }}>
        <SectionHeader icon={<PlayCircle />} iconColor={accentColor} title="Weiterschauen" />
        <div style={{ padding: '0 20px' }}>
          <button
            type="button"
            onClick={() => navigate('/watchlist')}
            style={{
              width: '100%',
              padding: '20px 16px',
              background: `${accentColor}10`,
              border: `1px dashed ${accentColor}55`,
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              textAlign: 'left',
              color: currentTheme.text.primary,
              fontFamily: 'inherit',
            }}
          >
            <Bookmark style={{ color: accentColor, fontSize: '28px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 600,
                  marginBottom: '2px',
                }}
              >
                Noch nichts zum Weiterschauen
              </div>
              <div
                style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: currentTheme.text.muted,
                  lineHeight: 1.4,
                }}
              >
                Tippe in einer Serie auf das Lesezeichen-Symbol, damit sie hier erscheint.{' '}
                {unwatchlistedWithUnwatched}{' '}
                {unwatchlistedWithUnwatched === 1 ? 'Serie wartet' : 'Serien warten'} noch.
              </div>
            </div>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionHeader
        icon={<PlayCircle />}
        iconColor={accentColor}
        title="Weiterschauen"
        onSeeAll={() => navigate('/watchlist')}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '0 20px',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="popLayout">
          {items
            .filter(
              (item) =>
                !hiddenEpisodes.has(
                  `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`
                )
            )
            .slice(0, 6)
            .map((item) => {
              const episodeKey = `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`;
              const pace = calculateWatchingPace(item.seasons, item.episodeRuntime);
              const paceText = formatPaceLine(pace, true);
              const nextFiller = fillerByItem
                .get(item.id)
                ?.get(
                  fillerLookupKey(item.nextEpisode.seasonNumber, item.nextEpisode.episodeNumber)
                );

              // Provider-Wahl: TMDB listet oft mehrere (z. B. WOW vor HBO Max).
              // Bevorzugt wird der Provider, den der User AKTIV abonniert hat —
              // erst dann der erste aus der Liste. Manuelle Overrides gewinnen
              // weiterhin (resolveProviderOverlay).
              const itemProviders = item.provider?.provider || [];
              const subbedProvider = itemProviders.find((p) => {
                const canonical = normalizeProviderName(p?.name);
                return !!canonical && activeProviders.has(canonical);
              });
              const primaryProvider = subbedProvider || itemProviders[0];

              // D4 — Provider-Farbfacette: läuft die Serie auf einem AKTIVEN
              // Abo, färbt dessen Markenfarbe die Karten-Akzente (Randbalken,
              // Glow); sonst bleibt der Theme-Akzent (neutral).
              const resolved = resolveProviderOverlay(
                getSeriesOverride(item.id),
                primaryProvider?.logo,
                primaryProvider?.name
              );
              const canonicalProvider = resolved ? normalizeProviderName(resolved.name) : null;
              const providerColor =
                canonicalProvider && activeProviders.has(canonicalProvider)
                  ? getProviderColor(canonicalProvider)
                  : null;
              const cardAccent = providerColor || accentColor;

              return (
                <SwipeableEpisodeRow
                  key={episodeKey}
                  itemKey={episodeKey}
                  poster={item.poster}
                  posterAlt={item.title}
                  accentColor={cardAccent}
                  posterOverlay={(() => {
                    const isActivelyWatching = (() => {
                      if (!item.lastWatchedAt) return false;
                      const then = new Date(item.lastWatchedAt).getTime();
                      if (isNaN(then)) return false;
                      return Date.now() - then < ACTIVE_WATCH_WINDOW_MS;
                    })();
                    if (!resolved && !isActivelyWatching) return undefined;
                    return (
                      <>
                        {isActivelyWatching && (
                          <NowPlayingIndicator color={accentColor} position="top-left" />
                        )}
                        {resolved && (
                          <ProviderLogoLink
                            src={resolved.src}
                            name={resolved.name}
                            searchTitle={item.title}
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              objectFit: 'cover',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                              border: '1.5px solid rgba(15,20,35,1)',
                            }}
                          />
                        )}
                      </>
                    );
                  })()}
                  isCompleting={completingEpisodes.has(episodeKey)}
                  isSwiping={swipingEpisodes.has(episodeKey)}
                  dragOffset={dragOffsets[episodeKey] || 0}
                  swipeDirection={swipeDirections[episodeKey]}
                  onSwipeStart={() => onSwipeStart(episodeKey)}
                  onSwipeDrag={(offset) => onSwipeDrag(episodeKey, offset)}
                  onSwipeEnd={() => onSwipeEnd(episodeKey)}
                  onComplete={(dir) => onComplete(item, dir)}
                  onPosterClick={() =>
                    onPosterClick(
                      item.id,
                      item.title,
                      `/episode/${item.id}/s/${item.nextEpisode.seasonNumber}/e/${item.nextEpisode.episodeNumber}`
                    )
                  }
                  content={
                    <>
                      <h3
                        style={{
                          fontSize: isMobile ? '13px' : '16px',
                          fontWeight: 700,
                          margin: '0 0 2px 0',
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: isMobile ? '11px' : '14px',
                          margin: 0,
                          color: item.chipType ? chipColor(item.chipType) : accentColor,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        S{item.nextEpisode.seasonNumber} E{item.nextEpisode.episodeNumber} •{' '}
                        {item.nextEpisode.name}
                        {item.chipType && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 4,
                              marginLeft: 6,
                              background: `${chipColor(item.chipType)}20`,
                              color: chipColor(item.chipType),
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {chipLabel(item.chipType)}
                          </span>
                        )}
                        {nextFiller && (
                          <span style={{ marginLeft: 6, verticalAlign: 'middle' }}>
                            <FillerChip
                              filler={nextFiller.filler}
                              recap={nextFiller.recap}
                              variant="label"
                            />
                          </span>
                        )}
                      </p>
                      {(() => {
                        const lastWatchedText = formatLastWatched(item.lastWatchedAt);
                        const parts = [paceText, lastWatchedText].filter(Boolean);
                        return parts.length > 0 ? (
                          <p
                            style={{
                              fontSize: isMobile ? '10px' : '13px',
                              margin: '2px 0 0 0',
                              color: currentTheme.text.muted,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {parts.join(' · ')}
                          </p>
                        ) : null;
                      })()}
                      <div
                        style={{
                          marginTop: '6px',
                          height: '4px',
                          background: currentTheme.border.default,
                          borderRadius: '2px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${item.progress}%`,
                            background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                    </>
                  }
                  action={
                    <EpisodeDiscussionButton
                      seriesId={item.id}
                      seasonNumber={item.nextEpisode.seasonNumber}
                      episodeNumber={item.nextEpisode.episodeNumber}
                    />
                  }
                />
              );
            })}
        </AnimatePresence>
      </div>
    </section>
  );
});
