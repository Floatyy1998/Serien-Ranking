/**
 * CatchUpCard - Kompakte Karte für Aufholen-Feature auf der HomePage
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Schedule, ChevronRight } from '@mui/icons-material';
import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';

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

      let seriesTotal = 0;
      let seriesWatched = 0;

      series.seasons.forEach((season) => {
        if (!season.episodes) return;
        season.episodes.forEach((episode) => {
          const airDate = episode.air_date || episode.airDate || episode.firstAired;
          if (!airDate) return; // Skip episodes without air date
          const hasAired = new Date(airDate) <= new Date();
          if (hasAired) {
            seriesTotal++;
            if (episode.watched) seriesWatched++;
          }
        });
      });

      const remaining = seriesTotal - seriesWatched;
      if (remaining > 0 && seriesTotal > 0) {
        seriesCount++;
        totalEpisodes += remaining;
        totalMinutes += remaining * (series.episodeRuntime || 45);
      }
    });

    return { seriesCount, totalEpisodes, totalMinutes };
  }, [seriesList]);

  // Format time helper
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} Min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} Std`;
    const days = Math.floor(hours / 24);
    return `${days}+ Tage`;
  };

  // Don't show if nothing to catch up
  if (stats.seriesCount === 0) {
    return null;
  }

  const accentColor = typeof currentTheme.status.warning === 'string'
    ? currentTheme.status.warning
    : (currentTheme.status.warning as Record<string, string>)?.main || '#f59e0b';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/catch-up')}
      style={{
        margin: '0 20px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
        border: `1px solid ${accentColor}30`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Schedule style={{ fontSize: 20, color: 'white' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: currentTheme.text.primary,
            whiteSpace: 'nowrap',
          }}
        >
          Backlog
        </h3>
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

      {/* Stats Preview */}
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
            fontWeight: 700,
            color: accentColor,
          }}
        >
          {formatTime(stats.totalMinutes)}
        </span>
        <span
          style={{
            fontSize: 11,
            color: currentTheme.text.muted,
          }}
        >
          Watchtime
        </span>
      </div>

      {/* Arrow */}
      <ChevronRight
        style={{
          fontSize: 24,
          color: currentTheme.text.muted,
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
};
