import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ExpandMore } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { WeeklyEpisode, WeeklyEpisodeProvider } from '../../hooks/useWeeklyEpisodes';
import type { SeriesGroup } from './useCalendarData';
import { contrastTextColor } from './useCalendarData';

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

// ── Provider badge (single logo) ─────────────────────────────────

const ProviderBadge = memo(
  ({ provider, className }: { provider: WeeklyEpisodeProvider; className: string }) => (
    <img
      src={`https://image.tmdb.org/t/p/w92${provider.logo}`}
      alt={provider.name}
      title={provider.name}
      loading="lazy"
      decoding="async"
      className={className}
    />
  )
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
  watched: boolean;
  onMark?: () => void;
  provider?: WeeklyEpisodeProvider;
  children: React.ReactNode; // poster-info content
}

const PosterWrap = memo(
  ({ posterSrc, premiereType, watched, onMark, provider, children }: PosterWrapProps) => {
    const { currentTheme } = useTheme();

    return (
      <div className="cal-ep-poster-wrap">
        <img src={posterSrc} alt="" decoding="async" className="cal-ep-poster" />

        {premiereType && (
          <PremiereOverlay type={premiereType} themePrimary={currentTheme.primary} />
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
          {provider && <ProviderBadge provider={provider} className="cal-ep-provider-badge" />}
        </div>
      </div>
    );
  }
);
PosterWrap.displayName = 'PosterWrap';

// ── Mobile poster with provider overlay ──────────────────────────

const MobilePoster = memo(
  ({ src, provider }: { src: string; provider?: WeeklyEpisodeProvider }) => (
    <div className="cal-ep-poster-mobile-wrap">
      <img src={src} alt="" decoding="async" className="cal-ep-poster cal-ep-poster-mobile" />
      {provider && <ProviderBadge provider={provider} className="cal-ep-provider-badge-mobile" />}
    </div>
  )
);
MobilePoster.displayName = 'MobilePoster';

// ── Single Episode Card ──────────────────────────────────────────

interface SingleEpisodeCardProps {
  ep: WeeklyEpisode;
  backdropSrc: string | undefined;
  onMarkWatched: (seriesNmr: number, seasonIndex: number, episodeIndex: number) => void;
}

export const SingleEpisodeCard = memo(
  ({ ep, backdropSrc, onMarkWatched }: SingleEpisodeCardProps) => {
    const navigate = useNavigate();
    const { currentTheme } = useTheme();

    const borderColor = ep.premiereType
      ? currentTheme.status.warning
      : ep.watched
        ? currentTheme.status.success
        : currentTheme.primary;

    const handleClick = () =>
      navigate(`/episode/${ep.seriesId}/s/${ep.seasonNumber}/e/${ep.episodeNumber}`);
    const handleMark = () => onMarkWatched(ep.seriesNmr, ep.seasonIndex, ep.episodeIndex);
    const airTime = formatAirTime(ep.airstamp);
    const provider = ep.providers[0];

    return (
      <div
        className={`cal-ep${ep.premiereType ? ' cal-ep-premiere' : ''}`}
        style={{ borderLeftColor: borderColor }}
        onClick={handleClick}
      >
        {/* Desktop: poster-overlay card */}
        <PosterWrap
          posterSrc={backdropSrc || ep.poster}
          premiereType={ep.premiereType}
          watched={ep.watched}
          onMark={!ep.watched ? handleMark : undefined}
          provider={provider}
        >
          <span className="cal-ep-title">{ep.seriesTitle}</span>
          <span
            className="cal-ep-episode"
            style={{
              color: ep.premiereType ? currentTheme.status.warning : currentTheme.text.muted,
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
          </span>
          <span className="cal-ep-name">{ep.episodeName}</span>
        </PosterWrap>

        {/* Mobile: poster + info */}
        <MobilePoster src={ep.poster} provider={provider} />
        <div className="cal-ep-info cal-ep-info-mobile">
          <span className="cal-ep-title" style={{ color: currentTheme.text.primary }}>
            {ep.seriesTitle}
          </span>
          <span
            className="cal-ep-episode"
            style={{
              color: ep.premiereType ? currentTheme.status.warning : currentTheme.primary,
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
  onMarkWatched: (seriesNmr: number, seasonIndex: number, episodeIndex: number) => void;
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

    const borderColor = groupPremiereType
      ? currentTheme.status.warning
      : allWatched
        ? currentTheme.status.success
        : currentTheme.primary;

    const episodeRange = `S${String(firstEp.seasonNumber).padStart(2, '0')} E${String(firstEp.episodeNumber).padStart(2, '0')}–E${String(lastEp.episodeNumber).padStart(2, '0')}`;
    const countLabel = `${group.episodes.length} Folgen · ${watchedInGroup} gesehen`;
    const provider = firstEp.providers[0];

    return (
      <div
        className={`cal-ep-group${groupPremiereType ? ' cal-ep-premiere' : ''} ${isExpanded ? 'is-open' : ''}`}
        style={{ borderLeftColor: borderColor }}
      >
        {/* Group header */}
        <div className="cal-ep cal-ep-group-header" onClick={onToggle}>
          {/* Desktop: poster card */}
          <PosterWrap
            posterSrc={backdropSrc || firstEp.poster}
            premiereType={groupPremiereType}
            watched={allWatched}
            provider={provider}
          >
            <span className="cal-ep-title">{group.seriesTitle}</span>
            <span
              className="cal-ep-episode"
              style={{
                color: groupPremiereType ? currentTheme.status.warning : currentTheme.text.muted,
              }}
            >
              {episodeRange}
            </span>
            <span className="cal-ep-name">{countLabel}</span>
          </PosterWrap>

          {/* Mobile: poster + info */}
          <MobilePoster src={firstEp.poster} provider={provider} />
          <div className="cal-ep-info cal-ep-info-mobile">
            <span className="cal-ep-title" style={{ color: currentTheme.text.primary }}>
              {group.seriesTitle}
            </span>
            <span
              className="cal-ep-episode"
              style={{
                color: groupPremiereType ? currentTheme.status.warning : currentTheme.primary,
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
                  onMark={() => onMarkWatched(ep.seriesNmr, ep.seasonIndex, ep.episodeIndex)}
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
