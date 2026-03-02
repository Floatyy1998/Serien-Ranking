import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ExpandMore } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';
import { contrastTextColor, SeriesGroup } from './useCalendarData';

// ── Shared helpers ───────────────────────────────────────────────

function formatEpisodeCode(seasonNumber: number, episodeNumber: number): string {
  return `S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`;
}

function premiereLabel(type: WeeklyEpisode['premiereType']): string {
  return type === 'season-start' ? 'Staffelstart' : 'Rückkehr';
}

// ── Premiere overlay (desktop poster) ────────────────────────────

const PremiereOverlay = memo(
  ({
    type,
    themePrimary,
  }: {
    type: NonNullable<WeeklyEpisode['premiereType']>;
    themePrimary: string;
  }) => {
    const bg = type === 'season-start' ? themePrimary : '#e67e22';
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
  children: React.ReactNode; // poster-info content
}

const PosterWrap = memo(
  ({ posterSrc, premiereType, watched, onMark, children }: PosterWrapProps) => {
    const { currentTheme } = useTheme();

    return (
      <div className="cal-ep-poster-wrap">
        <img src={posterSrc} alt="" className="cal-ep-poster" />

        {premiereType && (
          <PremiereOverlay type={premiereType} themePrimary={currentTheme.primary} />
        )}

        {watched ? (
          <div
            className="cal-ep-status-overlay"
            style={{ background: `${currentTheme.status.success}cc`, color: '#fff' }}
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
            style={{ borderColor: 'rgba(255,255,255,0.5)' }}
          />
        ) : null}

        <div className="cal-ep-poster-info">{children}</div>
      </div>
    );
  }
);
PosterWrap.displayName = 'PosterWrap';

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
        >
          <span className="cal-ep-title">{ep.seriesTitle}</span>
          <span
            className="cal-ep-episode"
            style={{
              color: ep.premiereType ? currentTheme.status.warning : 'rgba(255,255,255,0.7)',
            }}
          >
            {formatEpisodeCode(ep.seasonNumber, ep.episodeNumber)}
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
        <img src={ep.poster} alt="" className="cal-ep-poster cal-ep-poster-mobile" />
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
          >
            <span className="cal-ep-title">{group.seriesTitle}</span>
            <span
              className="cal-ep-episode"
              style={{
                color: groupPremiereType ? currentTheme.status.warning : 'rgba(255,255,255,0.7)',
              }}
            >
              {episodeRange}
            </span>
            <span className="cal-ep-name">{countLabel}</span>
          </PosterWrap>

          {/* Mobile: poster + info */}
          {firstEp.poster && (
            <img src={firstEp.poster} alt="" className="cal-ep-poster cal-ep-poster-mobile" />
          )}
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
