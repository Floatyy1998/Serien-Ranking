/**
 * CatchUpCard - Kompakte Karte für Aufholen-Feature auf der HomePage
 */

import { useNavigate } from 'react-router-dom';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import Schedule from '@mui/icons-material/Schedule';
import ChevronRight from '@mui/icons-material/ChevronRight';
import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { IconContainer, NavCard } from '../../components/ui';

export const CatchUpCard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { seriesList } = useSeriesList();

  // Calculate catch-up stats
  const stats = useMemo(() => {
    let seriesCount = 0;
    let totalEpisodes = 0;
    let totalMinutes = 0;

    seriesList.forEach((series) => {
      if (!series.seasons || series.seasons.length === 0) return;

      let hasUnwatched = false;
      let seriesRemainingEpisodes = 0;
      let seriesRemainingMinutes = 0;
      const seriesRuntime = series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

      series.seasons.forEach((season) => {
        if (!season.episodes) return;
        season.episodes.forEach((episode) => {
          if (!hasEpisodeAired(episode)) return;
          if (!episode.watched) {
            hasUnwatched = true;
            seriesRemainingEpisodes++;
            seriesRemainingMinutes += episode.runtime || seriesRuntime;
          }
        });
      });

      if (hasUnwatched) {
        seriesCount++;
        totalEpisodes += seriesRemainingEpisodes;
        totalMinutes += seriesRemainingMinutes;
      }
    });

    return { seriesCount, totalEpisodes, totalMinutes };
  }, [seriesList]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} Min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} Std`;
    const days = Math.floor(hours / 24);
    return `${days}+ Tage`;
  };

  if (stats.seriesCount === 0) return null;

  const accentColor = currentTheme.primary;

  return (
    <NavCard
      onClick={() => navigate('/catch-up')}
      accentColor={accentColor}
      aria-label={`Backlog: ${stats.seriesCount} Serien, ${stats.totalEpisodes} Episoden`}
    >
      <IconContainer color={accentColor}>
        <Schedule style={{ fontSize: 20, color: 'white' }} />
      </IconContainer>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: currentTheme.text.primary,
            whiteSpace: 'nowrap',
          }}
        >
          Backlog
        </h2>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 12,
            color: currentTheme.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          {stats.seriesCount} Serien · {stats.totalEpisodes} Ep.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          marginRight: 4,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: accentColor,
          }}
        >
          {formatTime(stats.totalMinutes)}
        </span>
        <span style={{ fontSize: 11, color: currentTheme.text.muted }}>Watchtime</span>
      </div>

      <ChevronRight
        style={{ fontSize: 24, color: currentTheme.text.muted, flexShrink: 0 }}
        aria-hidden="true"
      />
    </NavCard>
  );
};
