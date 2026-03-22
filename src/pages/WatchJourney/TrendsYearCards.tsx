import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ACCENT_COLORS } from './ActivityTab';

interface YearlyDataItem {
  year: number;
  episodes: number;
  movies: number;
  totalHours: number;
  topGenre: string;
  topProvider: string;
  genreDistribution: Record<string, number>;
}

interface TrendsYearCardsProps {
  yearlyData: YearlyDataItem[];
  topGenreColors: Record<string, string>;
}

export const TrendsYearCards: React.FC<TrendsYearCardsProps> = memo(
  ({ yearlyData, topGenreColors }) => {
    const { currentTheme } = useTheme();
    const textPrimary = currentTheme.text.primary;
    const textSecondary = currentTheme.text.secondary;
    const bgSurface = currentTheme.background.surface;
    const primaryColor = currentTheme.primary;

    return (
      <div style={{ padding: '0 20px' }}>
        <h3
          style={{
            color: textPrimary,
            fontSize: 16,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          Jahr für Jahr
        </h3>

        {yearlyData
          .slice()
          .reverse()
          .map((yd, i) => (
            <motion.div
              key={yd.year}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              style={{
                padding: '20px',
                marginBottom: 12,
                borderRadius: '16px',
                background: bgSurface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: currentTheme.text.secondary,
                        fontSize: 16,
                        fontWeight: 800,
                      }}
                    >
                      {yd.year.toString().slice(-2)}
                    </span>
                  </div>
                  <div>
                    <div style={{ color: textPrimary, fontSize: 20, fontWeight: 700 }}>
                      {yd.year}
                    </div>
                    <div style={{ color: textSecondary, fontSize: 13 }}>
                      {yd.totalHours}h Watchtime
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: `${ACCENT_COLORS.episodes}15`,
                  }}
                >
                  <div style={{ color: ACCENT_COLORS.episodes, fontSize: 20, fontWeight: 700 }}>
                    {yd.episodes}
                  </div>
                  <div style={{ color: textSecondary, fontSize: 12 }}>Episoden</div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: `${ACCENT_COLORS.movies}15`,
                  }}
                >
                  <div style={{ color: ACCENT_COLORS.movies, fontSize: 20, fontWeight: 700 }}>
                    {yd.movies}
                  </div>
                  <div style={{ color: textSecondary, fontSize: 12 }}>Filme</div>
                </div>
              </div>

              {(yd.topGenre !== '-' || yd.topProvider !== '-') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {yd.topGenre !== '-' && (
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: `${topGenreColors[yd.topGenre] || ACCENT_COLORS.trending}20`,
                        border: `1px solid ${topGenreColors[yd.topGenre] || ACCENT_COLORS.trending}40`,
                      }}
                    >
                      <span
                        style={{
                          color: topGenreColors[yd.topGenre] || ACCENT_COLORS.trending,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Top: {yd.topGenre}
                      </span>
                    </div>
                  )}
                  {yd.topProvider !== '-' && (
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: `${textSecondary}15`,
                        border: `1px solid ${textSecondary}30`,
                      }}
                    >
                      <span style={{ color: textSecondary, fontSize: 12, fontWeight: 600 }}>
                        via {yd.topProvider}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
      </div>
    );
  }
);
TrendsYearCards.displayName = 'TrendsYearCards';
