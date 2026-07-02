import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ExpandMore } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useActiveSubscriptions } from '../../hooks/useActiveSubscriptions';
import type { WeeklyEpisode, WeeklyEpisodeProvider } from '../../hooks/useWeeklyEpisodes';
import { getProviderLogoUrl } from '../../lib/providerMerge';
import {
  getProviderSearchUrl,
  handleProviderLinkClick,
  providerNeedsClipboardCopy,
} from '../../lib/providerLinks';
import { normalizeProviderName } from '../../lib/validation/providerChangeDetection';
import { getProviderBrand } from '../Subscriptions/providerBrands';
import type { SeriesGroup } from './useCalendarData';
import { contrastTextColor } from './useCalendarData';

/**
 * Liefert die Brand-Color der Episode (vom abonnierten Provider, sonst vom
 * ersten Provider) + ob KEIN aktives Abo passt (User pflegt Abos, keiner
 * matched).
 */
function useProviderColoring(
  seriesId: number,
  providers: WeeklyEpisodeProvider[]
): {
  brandColor: string | null;
  hasNoActiveSub: boolean;
  /** Effektiver Display-Provider: User-Override gewinnt, sonst erster TMDB-Provider. */
  displayProvider: WeeklyEpisodeProvider | null;
} {
  const { activeProviders, getSeriesOverride } = useActiveSubscriptions();
  const hasActiveSubs = activeProviders.size > 0;
  const override = getSeriesOverride(seriesId);

  // User-Override hat höchste Priorität — überschreibt Strip + Logo.
  if (override) {
    const brand = getProviderBrand(override);
    const logoUrl = getProviderLogoUrl(override);
    // Synthetisches Provider-Objekt; ProviderBadge nimmt full URL.
    const displayProvider: WeeklyEpisodeProvider = {
      id: 0,
      logo: logoUrl ?? '',
      name: override,
    };
    const hasNoActiveSub = hasActiveSubs && !activeProviders.has(override);
    return { brandColor: brand.color, hasNoActiveSub, displayProvider };
  }

  const normalized = providers
    .map((p) => ({ raw: p, norm: normalizeProviderName(p.name) }))
    .filter((p): p is { raw: WeeklyEpisodeProvider; norm: string } => p.norm !== null);

  if (normalized.length === 0) {
    return {
      brandColor: null,
      hasNoActiveSub: hasActiveSubs,
      displayProvider: providers[0] ?? null,
    };
  }

  const onActive = normalized.find((p) => activeProviders.has(p.norm));
  const pick = onActive ?? normalized[0];
  const brandColor = getProviderBrand(pick.norm).color;
  const hasNoActiveSub = hasActiveSubs && !normalized.some((p) => activeProviders.has(p.norm));
  return { brandColor, hasNoActiveSub, displayProvider: pick.raw };
}

// ── Shared helpers ───────────────────────────────────────────────

function formatEpisodeCode(seasonNumber: number, episodeNumber: number): string {
  return `S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`;
}

function formatAirTime(airstamp?: string): string | null {
  if (!airstamp) return null;
  try {
    const date = new Date(airstamp);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin',
    });
  } catch {
    return null;
  }
}

function premiereLabel(type: WeeklyEpisode['premiereType']): string {
  return type === 'season-start' ? 'Staffelstart' : 'Rückkehr';
}

function breakLabel(type: NonNullable<WeeklyEpisode['breakType']>): string {
  return type === 'season-finale' ? 'Staffelende' : 'Staffelpause';
}

/** Fixed violet colors for break chips */
const BREAK_COLORS = {
  'season-break': '#a78bfa', // soft lavender — "we'll be back"
  'season-finale': '#7c3aed', // deep violet — "it's over"
} as const;

function breakColor(type: NonNullable<WeeklyEpisode['breakType']>): string {
  return BREAK_COLORS[type];
}

// ── Provider badge (single logo) ─────────────────────────────────

const ProviderBadge = memo(
  ({
    provider,
    className,
    searchTitle,
  }: {
    provider: WeeklyEpisodeProvider;
    className: string;
    searchTitle: string;
  }) => {
    const raw = provider.logo;
    const src = raw?.startsWith('http') ? raw : `https://image.tmdb.org/t/p/w92${raw}`;
    const normalized = normalizeProviderName(provider.name);
    const url = normalized ? getProviderSearchUrl(normalized, searchTitle) : null;
    const tooltip =
      normalized && providerNeedsClipboardCopy(normalized)
        ? `${provider.name}: Titel kopieren + Suche öffnen`
        : `${provider.name} öffnen`;
    const img = (
      <img
        src={src}
        alt={provider.name}
        title={url ? tooltip : provider.name}
        loading="lazy"
        decoding="async"
        className={className}
      />
    );
    if (!url) return img;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={tooltip}
        onClick={(e) => handleProviderLinkClick(e, normalized ?? '', searchTitle, url)}
        style={{ display: 'contents' }}
      >
        {img}
      </a>
    );
  }
);
ProviderBadge.displayName = 'ProviderBadge';

// ── Premiere overlay (desktop poster) ────────────────────────────

const PremiereOverlay = memo(
  ({
    type,
    themePrimary,
  }: {
    type: NonNullable<WeeklyEpisode['premiereType']>;
    themePrimary: string;
  }) => {
    const bg = type === 'season-start' ? themePrimary : themePrimary;
    return (
      <span
        className="cal-ep-premiere-overlay"
        style={{ background: bg, color: contrastTextColor(bg) }}
      >
        {premiereLabel(type)}
      </span>
    );
  }
);
PremiereOverlay.displayName = 'PremiereOverlay';

// ── Watch status indicator (mobile) ──────────────────────────────

interface WatchIndicatorProps {
  watched: boolean;
  onMark: () => void;
  small?: boolean;
}

const WatchIndicator = memo(({ watched, onMark, small }: WatchIndicatorProps) => {
  const { currentTheme } = useTheme();

  if (watched) {
    return (
      <div
        className={`cal-ep-status${small ? ' small' : ''}`}
        style={{
          background: `${currentTheme.status.success}18`,
          color: currentTheme.status.success,
        }}
      >
        <Check style={{ fontSize: small ? '14px' : '16px' }} />
      </div>
    );
  }

  return (
    <button
      className={`cal-ep-mark${small ? ' small' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onMark();
      }}
      style={{ borderColor: `${currentTheme.text.muted}40` }}
    />
  );
});
WatchIndicator.displayName = 'WatchIndicator';

// ── Poster wrapper (desktop) ─────────────────────────────────────

interface PosterWrapProps {
  posterSrc: string;
  premiereType?: WeeklyEpisode['premiereType'];
  breakType?: WeeklyEpisode['breakType'];
  watched: boolean;
  onMark?: () => void;
  provider?: WeeklyEpisodeProvider;
  searchTitle: string;
  children: React.ReactNode; // poster-info content
}

const PosterWrap = memo(
  ({
    posterSrc,
    premiereType,
    breakType,
    watched,
    onMark,
    provider,
    searchTitle,
    children,
  }: PosterWrapProps) => {
    const { currentTheme } = useTheme();

    return (
      <div className="cal-ep-poster-wrap">
        <img src={posterSrc} alt="" decoding="async" className="cal-ep-poster" loading="lazy" />

        {premiereType && (
          <PremiereOverlay type={premiereType} themePrimary={currentTheme.primary} />
        )}

        {!premiereType && breakType && (
          <span
            className="cal-ep-break-overlay"
            style={{
              background: breakColor(breakType),
              color: contrastTextColor(breakColor(breakType)),
            }}
          >
            {breakLabel(breakType)}
          </span>
        )}

        {watched ? (
          <div
            className="cal-ep-status-overlay"
            style={{
              background: `${currentTheme.status.success}cc`,
              color: currentTheme.text.secondary,
            }}
          >
            <Check style={{ fontSize: '15px' }} />
          </div>
        ) : onMark ? (
          <button
            className="cal-ep-mark-overlay"
            onClick={(e) => {
              e.stopPropagation();
              onMark();
            }}
            style={{ borderColor: `${currentTheme.text.muted}80` }}
          />
        ) : null}

        <div className={`cal-ep-poster-info${provider ? ' has-provider' : ''}`}>
          {children}
          {provider && (
            <ProviderBadge
              provider={provider}
              className="cal-ep-provider-badge"
              searchTitle={searchTitle}
            />
          )}
        </div>
      </div>
    );
  }
);
PosterWrap.displayName = 'PosterWrap';

// ── Mobile poster with provider overlay ──────────────────────────

const MobilePoster = memo(
  ({
    src,
    provider,
    searchTitle,
  }: {
    src: string;
    provider?: WeeklyEpisodeProvider;
    searchTitle: string;
  }) => (
    <div className="cal-ep-poster-mobile-wrap">
      <img
        src={src}
        alt=""
        decoding="async"
        className="cal-ep-poster cal-ep-poster-mobile"
        loading="lazy"
      />
      {provider && (
        <ProviderBadge
          provider={provider}
          className="cal-ep-provider-badge-mobile"
          searchTitle={searchTitle}
        />
      )}
    </div>
  )
);
MobilePoster.displayName = 'MobilePoster';

// ── Single Episode Card ──────────────────────────────────────────

interface SingleEpisodeCardProps {
  ep: WeeklyEpisode;
  backdropSrc: string | undefined;
  onMarkWatched: (seriesId: number, seasonIndex: number, episodeIndex: number) => void;
}

export const SingleEpisodeCard = memo(
  ({ ep, backdropSrc, onMarkWatched }: SingleEpisodeCardProps) => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();
    const { brandColor, hasNoActiveSub, displayProvider } = useProviderColoring(
      ep.seriesId,
      ep.providers
    );

    // Auf Mobile übernimmt die border-left direkt die Brand-Color des Providers.
    // Status (Premiere/Pause/Watched) wird über separate Badges + Overlays
    // kommuniziert — beide Informationen ergänzen sich statt zu kollidieren.
    const stripColor: string | null = brandColor;
    const borderColor = stripColor ?? currentTheme.primary;

    const handleClick = () =>
      navigate(`/episode/${ep.seriesId}/s/${ep.seasonNumber}/e/${ep.episodeNumber}`);
    const handleMark = () => onMarkWatched(ep.seriesId, ep.seasonIndex, ep.episodeIndex);
    const airTime = formatAirTime(ep.airstamp);
    const provider = displayProvider ?? undefined;

    return (
      <div
        className={`cal-ep${ep.premiereType ? ' cal-ep-premiere' : ''}${ep.breakType ? ' cal-ep-break' : ''}${hasNoActiveSub ? ' cal-ep-no-sub' : ''}`}
        style={{
          borderLeftColor: borderColor,
          position: 'relative',
          opacity: hasNoActiveSub ? 0.55 : 1,
        }}
        onClick={handleClick}
      >
        {stripColor && (
          <span aria-hidden className="cal-ep-brand-strip" style={{ background: stripColor }} />
        )}
        {/* Desktop: poster-overlay card */}
        <PosterWrap
          posterSrc={backdropSrc || ep.poster}
          premiereType={ep.premiereType}
          breakType={ep.breakType}
          watched={ep.watched}
          onMark={!ep.watched ? handleMark : undefined}
          provider={provider}
          searchTitle={ep.seriesTitle}
        >
          <span className="cal-ep-title">{ep.seriesTitle}</span>
          <span
            className="cal-ep-episode"
            style={{
              color: ep.premiereType
                ? currentTheme.status.warning
                : ep.breakType
                  ? breakColor(ep.breakType)
                  : currentTheme.text.muted,
            }}
          >
            {formatEpisodeCode(ep.seasonNumber, ep.episodeNumber)}
            {airTime && (
              <span className="cal-ep-airtime" style={{ color: currentTheme.text.muted }}>
                {' · '}
                {airTime}
              </span>
            )}
            {ep.premiereType && (
              <span
                className="cal-ep-premiere-badge"
                style={{
                  background: `${currentTheme.status.warning}20`,
                  color: currentTheme.status.warning,
                }}
              >
                {premiereLabel(ep.premiereType)}
              </span>
            )}
            {!ep.premiereType && ep.breakType && (
              <span
                className="cal-ep-break-badge"
                style={{
                  background: `${breakColor(ep.breakType)}20`,
                  color: breakColor(ep.breakType),
                }}
              >
                {breakLabel(ep.breakType)}
              </span>
            )}
          </span>
          <span className="cal-ep-name">{ep.episodeName}</span>
        </PosterWrap>

        {/* Mobile: poster + info */}
        <MobilePoster src={ep.poster} provider={provider} searchTitle={ep.seriesTitle} />
        <div className="cal-ep-info cal-ep-info-mobile">
          <span className="cal-ep-title" style={{ color: currentTheme.text.primary }}>
            {ep.seriesTitle}
          </span>
          <span
            className="cal-ep-episode"
            style={{
              color: ep.premiereType
                ? currentTheme.status.warning
                : ep.breakType
                  ? breakColor(ep.breakType)
                  : currentTheme.primary,
            }}
          >
            {formatEpisodeCode(ep.seasonNumber, ep.episodeNumber)}
            {airTime && (
              <span style={{ color: currentTheme.text.muted }}>
                {' · '}
                {airTime}
              </span>
            )}
            {ep.premiereType && (
              <span
                className="cal-ep-premiere-badge"
                style={{
                  background: `${currentTheme.status.warning}20`,
                  color: currentTheme.status.warning,
                }}
              >
                {premiereLabel(ep.premiereType)}
              </span>
            )}
            {!ep.premiereType && ep.breakType && (
              <span
                className="cal-ep-break-badge"
                style={{
                  background: `${breakColor(ep.breakType)}20`,
                  color: breakColor(ep.breakType),
                }}
              >
                {breakLabel(ep.breakType)}
              </span>
            )}
          </span>
          <span className="cal-ep-name" style={{ color: currentTheme.text.secondary }}>
            {ep.episodeName}
          </span>
        </div>

        {/* Mobile: watch status */}
        <div className="cal-ep-mobile-status">
          <WatchIndicator watched={ep.watched} onMark={handleMark} />
        </div>
      </div>
    );
  }
);
SingleEpisodeCard.displayName = 'SingleEpisodeCard';

// ── Episode Group Card ───────────────────────────────────────────

interface EpisodeGroupCardProps {
  group: SeriesGroup;
  backdropSrc: string | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onMarkWatched: (seriesId: number, seasonIndex: number, episodeIndex: number) => void;
}

export const EpisodeGroupCard = memo(
  ({ group, backdropSrc, isExpanded, onToggle, onMarkWatched }: EpisodeGroupCardProps) => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();

    const firstEp = group.episodes[0];
    const lastEp = group.episodes[group.episodes.length - 1];
    const watchedInGroup = group.episodes.filter((e) => e.watched).length;
    const allWatched = watchedInGroup === group.episodes.length;
    const groupPremiereType = group.episodes.find((ep) => ep.premiereType)?.premiereType;
    const groupBreakType = group.episodes[group.episodes.length - 1]?.breakType;
    const { brandColor, hasNoActiveSub, displayProvider } = useProviderColoring(
      firstEp.seriesId,
      firstEp.providers
    );

    const stripColor: string | null = brandColor;
    const borderColor = stripColor ?? currentTheme.primary;

    const episodeRange = `S${String(firstEp.seasonNumber).padStart(2, '0')} E${String(firstEp.episodeNumber).padStart(2, '0')}–E${String(lastEp.episodeNumber).padStart(2, '0')}`;
    const countLabel = `${group.episodes.length} Folgen · ${watchedInGroup} gesehen`;
    const provider = displayProvider ?? undefined;

    return (
      <div
        className={`cal-ep-group${groupPremiereType ? ' cal-ep-premiere' : ''}${groupBreakType ? ' cal-ep-break' : ''}${hasNoActiveSub ? ' cal-ep-no-sub' : ''} ${isExpanded ? 'is-open' : ''}`}
        style={{
          borderLeftColor: borderColor,
          position: 'relative',
          opacity: hasNoActiveSub ? 0.55 : 1,
        }}
      >
        {stripColor && (
          <span aria-hidden className="cal-ep-brand-strip" style={{ background: stripColor }} />
        )}
        {/* Group header */}
        <div className="cal-ep cal-ep-group-header" onClick={onToggle}>
          {/* Desktop: poster card */}
          <PosterWrap
            posterSrc={backdropSrc || firstEp.poster}
            premiereType={groupPremiereType}
            breakType={groupBreakType}
            watched={allWatched}
            provider={provider}
            searchTitle={group.seriesTitle}
          >
            <span className="cal-ep-title">{group.seriesTitle}</span>
            <span
              className="cal-ep-episode"
              style={{
                color: groupPremiereType
                  ? currentTheme.status.warning
                  : groupBreakType
                    ? breakColor(groupBreakType)
                    : currentTheme.text.muted,
              }}
            >
              {episodeRange}
              {!groupPremiereType && groupBreakType && (
                <span
                  className="cal-ep-break-badge"
                  style={{
                    background: `${breakColor(groupBreakType)}20`,
                    color: breakColor(groupBreakType),
                  }}
                >
                  {breakLabel(groupBreakType)}
                </span>
              )}
            </span>
            <span className="cal-ep-name">{countLabel}</span>
          </PosterWrap>

          {/* Mobile: poster + info */}
          <MobilePoster src={firstEp.poster} provider={provider} searchTitle={group.seriesTitle} />
          <div className="cal-ep-info cal-ep-info-mobile">
            <span className="cal-ep-title" style={{ color: currentTheme.text.primary }}>
              {group.seriesTitle}
            </span>
            <span
              className="cal-ep-episode"
              style={{
                color: groupPremiereType
                  ? currentTheme.status.warning
                  : groupBreakType
                    ? breakColor(groupBreakType)
                    : currentTheme.primary,
              }}
            >
              {episodeRange}
              {groupPremiereType && (
                <span
                  className="cal-ep-premiere-badge"
                  style={{
                    background: `${currentTheme.status.warning}20`,
                    color: currentTheme.status.warning,
                  }}
                >
                  {premiereLabel(groupPremiereType)}
                </span>
              )}
              {!groupPremiereType && groupBreakType && (
                <span
                  className="cal-ep-break-badge"
                  style={{
                    background: `${breakColor(groupBreakType)}20`,
                    color: breakColor(groupBreakType),
                  }}
                >
                  {breakLabel(groupBreakType)}
                </span>
              )}
            </span>
            <span className="cal-ep-name" style={{ color: currentTheme.text.secondary }}>
              {countLabel}
            </span>
          </div>

          {/* Mobile: expand toggle */}
          <div className="cal-ep-expand-mobile">
            {allWatched && (
              <div
                className="cal-ep-status"
                style={{
                  background: `${currentTheme.status.success}18`,
                  color: currentTheme.status.success,
                }}
              >
                <Check style={{ fontSize: '16px' }} />
              </div>
            )}
            <ExpandMore
              className={`cal-ep-expand-icon ${isExpanded ? 'is-open' : ''}`}
              style={{
                fontSize: '20px',
                color: currentTheme.text.muted,
              }}
            />
          </div>
        </div>

        {/* Expanded episode list */}
        {isExpanded && (
          <div className="cal-ep-group-list">
            {group.episodes.map((ep) => (
              <div
                key={`${ep.seriesId}-${ep.seasonIndex}-${ep.episodeIndex}`}
                className="cal-ep-sub"
                onClick={() =>
                  navigate(`/episode/${ep.seriesId}/s/${ep.seasonNumber}/e/${ep.episodeNumber}`)
                }
              >
                <span className="cal-ep-sub-nr" style={{ color: currentTheme.primary }}>
                  E{String(ep.episodeNumber).padStart(2, '0')}
                </span>
                <span className="cal-ep-sub-name" style={{ color: currentTheme.text.secondary }}>
                  {ep.episodeName}
                  {formatAirTime(ep.airstamp) && (
                    <span
                      style={{ color: currentTheme.text.muted, marginLeft: 6, fontSize: '0.85em' }}
                    >
                      {formatAirTime(ep.airstamp)}
                    </span>
                  )}
                </span>
                <WatchIndicator
                  watched={ep.watched}
                  onMark={() => onMarkWatched(ep.seriesId, ep.seasonIndex, ep.episodeIndex)}
                  small
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
EpisodeGroupCard.displayName = 'EpisodeGroupCard';
