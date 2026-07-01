import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getImageUrl } from '../../utils/imageUrl';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { markNextEpisodeWatched } from '../../hooks/markNextEpisode';
import { GradientRing } from './GradientRing';
import { formatTimeString, type CatchUpSeries } from './useCatchUpData';

interface SeriesCardProps {
  item: CatchUpSeries;
}

export const SeriesCard = memo<SeriesCardProps>(({ item }) => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user;
  const { currentTheme } = useTheme();
  const [marking, setMarking] = useState(false);

  const handleClick = useCallback(() => {
    navigate(`/series/${item.series.id}`);
  }, [navigate, item.series.id]);

  const handleMarkNext = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user || marking) return;
      setMarking(true);
      try {
        await markNextEpisodeWatched(user.uid, item.series);
      } finally {
        setMarking(false);
      }
    },
    [user, marking, item.series]
  );

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
          src={getImageUrl(item.series.poster?.poster, 'w500')}
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

        {/* Direkt-Markieren: nächste Folge ohne Umweg über die Detailseite */}
        <button
          type="button"
          onClick={handleMarkNext}
          disabled={marking}
          aria-label={`S${item.currentSeason} E${item.currentEpisode} als gesehen markieren`}
          className="cu-card-mark-next"
          style={{
            marginTop: 8,
            width: '100%',
            minHeight: 40,
            borderRadius: 10,
            border: 'none',
            cursor: marking ? 'default' : 'pointer',
            fontSize: 13,
            fontWeight: 700,
            opacity: marking ? 0.6 : 1,
            background: currentTheme.primary,
            color: getOptimalTextColor(currentTheme.primary),
          }}
        >
          ✓ S{item.currentSeason} E{item.currentEpisode} gesehen
        </button>
      </div>

      {/* Progress Ring */}
      <div className="cu-card-ring">
        <GradientRing progress={item.progress} size={52} strokeWidth={4} />
      </div>
    </div>
  );
});

SeriesCard.displayName = 'SeriesCard';
