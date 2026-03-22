import { Check } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { SeriesSeason } from './types';

interface SeasonTabsProps {
  seasons: SeriesSeason[];
  selectedSeasonIndex: number;
  onSelectSeason: (index: number) => void;
}

export const SeasonTabs = memo<SeasonTabsProps>(
  ({ seasons, selectedSeasonIndex, onSelectSeason }) => {
    const { currentTheme } = useTheme();

    return (
      <div className="season-tabs">
        {seasons.map((season, index) => {
          const watched = season.episodes?.filter((ep) => ep.watched).length || 0;
          const total = season.episodes?.length || 0;
          const progress = total > 0 ? Math.round((watched / total) * 100) : 0;
          const isSelected = index === selectedSeasonIndex;
          const minWatch =
            progress === 100 && total > 0
              ? Math.min(...(season.episodes?.map((ep) => ep.watchCount || 1) || [1]))
              : 0;

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onSelectSeason(index);
              }}
              className="season-tabs__tab"
              style={{
                borderColor: isSelected
                  ? currentTheme.primary
                  : progress === 100
                    ? minWatch > 1
                      ? `${currentTheme.accent}80`
                      : `${currentTheme.primary}80`
                    : 'rgba(255, 255, 255, 0.15)',
                background: isSelected
                  ? `${currentTheme.primary}33`
                  : progress === 100
                    ? minWatch > 1
                      ? `${currentTheme.accent}30`
                      : `${currentTheme.primary}30`
                    : 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <span className="season-tabs__number">S{season.seasonNumber + 1}</span>
              <span className="season-tabs__progress">
                {progress === 100 ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Check
                      style={{ fontSize: '13px', color: currentTheme.status?.success || '#22c55e' }}
                    />
                    {minWatch > 1 && (
                      <span style={{ color: currentTheme.accent, fontWeight: '700' }}>
                        &times;{minWatch}
                      </span>
                    )}
                  </span>
                ) : (
                  `${progress}%`
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }
);

SeasonTabs.displayName = 'SeasonTabs';
