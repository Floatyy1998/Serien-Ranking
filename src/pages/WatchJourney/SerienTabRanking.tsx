import { Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { wjCard } from './watchJourneyStyles';
import { t } from '../../services/i18n';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface SeriesStatItem {
  seriesId: number;
  title: string;
  episodes: number;
  minutes: number;
  firstWatched: string;
  lastWatched: string;
  avgRuntime: number;
  rewatchEpisodes: number;
}

interface SerienTabRankingProps {
  seriesStats: SeriesStatItem[];
  posters: Record<number, string>;
  formatDate: (isoDate: string) => string;
}

export const SerienTabRanking: React.FC<SerienTabRankingProps> = ({
  seriesStats,
  posters,
  formatDate,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const primaryColor = currentTheme.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{ ...wjCard(currentTheme), margin: '0 var(--space-5)' }}
    >
      <h3
        style={{
          color: textPrimary,
          fontSize: 16,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          margin: '0 0 16px',
        }}
      >
        {t('Top 10 Serien')}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {seriesStats.slice(0, 10).map((series, index) => (
          <motion.div
            key={series.seriesId}
            role="button"
            tabIndex={0}
            aria-label={t('{title} öffnen', { title: series.title })}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ opacity: 0.7 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            onClick={() => navigate(`/series/${series.seriesId}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/series/${series.seriesId}`);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: index === 0 ? `${primaryColor}15` : 'transparent',
              border: index === 0 ? `1px solid ${primaryColor}30` : 'none',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 50,
                height: 75,
                borderRadius: 8,
                background: posters[series.seriesId]
                  ? `url(${TMDB_IMAGE_BASE}${posters[series.seriesId]}) center/cover`
                  : `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!posters[series.seriesId] && <Tv style={{ color: textSecondary, fontSize: 20 }} />}
            </div>

            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background:
                  index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : `${textSecondary}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: index < 3 ? currentTheme.background.default : textSecondary,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: textPrimary,
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {series.title}
              </div>
              <div style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
                {formatDate(series.firstWatched)} – {formatDate(series.lastWatched)}
                {series.rewatchEpisodes > 0 && (
                  <span style={{ color: currentTheme.accent }}>
                    {' '}
                    · {t('{n}× Rewatch', { n: series.rewatchEpisodes })}
                  </span>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ color: primaryColor, fontSize: 16, fontWeight: 700 }}>
                {series.episodes}
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>
                {Math.round(series.minutes / 60)}h
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
