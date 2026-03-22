import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { getImageUrl } from '../../utils/imageUrl';
import { GradientRing } from './GradientRing';
import { formatTimeString, type CatchUpSeries } from './useCatchUpData';

interface SeriesCardProps {
  item: CatchUpSeries;
}

export const SeriesCard = memo<SeriesCardProps>(({ item }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleClick = useCallback(() => {
    navigate(`/series/${item.series.id}`);
  }, [navigate, item.series.id, item.series.title]);

  const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).style.opacity = '0';
  }, []);

  const accentAlpha = Math.round(item.progress * 2.55)
    .toString(16)
    .padStart(2, '0');

  return (
    <div
      className="cu-card"
      onClick={handleClick}
      style={{
        background: currentTheme.background.surface,
        border: `1px solid ${currentTheme.border.default}`,
      }}
    >
      {/* Subtle gradient accent */}
      <div
        className="cu-card-accent"
        style={{
          background: `linear-gradient(90deg,
            ${currentTheme.primary}${accentAlpha},
            ${currentTheme.accent}${accentAlpha}
          )`,
        }}
      />

      {/* Poster */}
      <div className="cu-card-poster">
        <img
          src={getImageUrl(item.series.poster?.poster, 'w500', '')}
          alt={item.series.title}
          loading="lazy"
          decoding="async"
          onError={handleImgError}
        />
        {/* Episode badge */}
        <div className="cu-card-badge">
          <span className="cu-card-badge-count">{item.remainingEpisodes}</span>
          <span className="cu-card-badge-label">EP</span>
        </div>
      </div>

      {/* Content */}
      <div className="cu-card-body">
        <h3 className="cu-card-title" style={{ color: currentTheme.text.primary }}>
          {item.series.title}
        </h3>

        <div className="cu-card-meta">
          <span className="cu-card-episode" style={{ color: currentTheme.text.secondary }}>
            S{item.currentSeason} E{item.currentEpisode}
          </span>
          <span
            className="cu-card-time"
            style={{
              background: `${currentTheme.primary}15`,
              color: currentTheme.primary,
            }}
          >
            {formatTimeString(item.remainingMinutes)}
          </span>
        </div>

        {/* Inline progress */}
        <div
          className="cu-card-progress-track"
          style={{ background: `${currentTheme.text.muted}15` }}
        >
          <div
            className="cu-card-progress-fill"
            style={{
              width: `${item.progress}%`,
              background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
          />
        </div>
        <div className="cu-card-progress-label" style={{ color: currentTheme.text.muted }}>
          <span>
            {item.watchedEpisodes} von {item.totalEpisodes}
          </span>
        </div>
      </div>

      {/* Progress Ring */}
      <div className="cu-card-ring">
        <GradientRing progress={item.progress} size={52} strokeWidth={4} />
      </div>
    </div>
  );
});

SeriesCard.displayName = 'SeriesCard';
