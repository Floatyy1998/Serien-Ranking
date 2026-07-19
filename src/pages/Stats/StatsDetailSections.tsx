import { Category, Star, Stream } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { t } from '../../services/i18n';

interface ThemeColors {
  primary: string;
  accent?: string;
  background: { default: string; surface: string };
  text: { primary: string; secondary: string; muted: string };
  border: { default: string };
  status: { success: string; error: string; warning: string };
}

/* RatingsSection — zwei Ø-Rating-Pods (Serien / Filme) */
interface RatingsSectionProps {
  avgSeriesRating: number;
  avgMovieRating: number;
  theme: ThemeColors;
}

export const RatingsSection = memo(
  ({ avgSeriesRating, avgMovieRating, theme }: RatingsSectionProps) => {
    const accent = theme.accent || theme.primary;
    const items = [
      { value: avgSeriesRating, label: t('Ø Serien-Rating') },
      { value: avgMovieRating, label: t('Ø Film-Rating') },
    ];

    return (
      <>
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            className="stats-pod stats-pod--rating liquid-glass"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
          >
            <div
              className="stats-quick-icon"
              style={{
                color: accent,
                background: `${accent}16`,
                boxShadow: `inset 0 0 0 1px ${accent}2e`,
              }}
            >
              <Star style={{ fontSize: 20 }} />
            </div>
            <div className="stats-quick-value">{item.value.toFixed(1)}</div>
            <div className="stats-rating-bar" style={{ background: `${theme.text.muted}1c` }}>
              <motion.div
                className="stats-rating-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(item.value, 10) * 10}%` }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                style={{ background: `linear-gradient(90deg, ${theme.primary}, ${accent})` }}
              />
            </div>
            <div className="stats-quick-label" style={{ color: theme.text.muted }}>
              {item.label}
            </div>
          </motion.div>
        ))}
      </>
    );
  }
);
RatingsSection.displayName = 'RatingsSection';

interface TopGenresProps {
  genres: { name: string; count: number }[];
  theme: ThemeColors;
  /** Volle Breite, wenn das Provider-Panel fehlt */
  wide?: boolean;
}

export const TopGenresSection = memo(({ genres, theme, wide }: TopGenresProps) => {
  if (genres.length === 0) return null;
  const maxCount = genres[0]?.count || 1;
  const accent = theme.accent || theme.primary;

  return (
    <motion.div
      className={`stats-pod stats-panel stats-panel--genres liquid-glass ${wide ? 'stats-panel--wide' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <h2 className="stats-pod__label stats-panel__title" style={{ color: theme.text.muted }}>
        <Category style={{ fontSize: 16, color: accent }} />
        {t('Top Genres')}
      </h2>
      <div className="stats-genre-list">
        {genres.map((genre, i) => (
          <motion.div
            key={genre.name}
            className="stats-genre-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.07 }}
          >
            <span
              className="stats-genre-rank"
              style={
                i === 0
                  ? {
                      color: accent,
                      background: `${accent}18`,
                      boxShadow: `inset 0 0 0 1px ${accent}30`,
                    }
                  : { color: theme.text.muted, background: `${theme.text.muted}14` }
              }
            >
              {i + 1}
            </span>
            <div className="stats-genre-info">
              <div className="stats-genre-header">
                <span className="stats-genre-name">{genre.name}</span>
                <span className="stats-genre-count" style={{ color: theme.text.muted }}>
                  {genre.count}
                </span>
              </div>
              <div
                className="stats-genre-bar-track"
                style={{ background: `${theme.text.muted}1c` }}
              >
                <motion.div
                  className="stats-genre-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(genre.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.45 + i * 0.07 }}
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary}, ${accent}cc)`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
TopGenresSection.displayName = 'TopGenresSection';

interface TopProvidersProps {
  providers: { name: string; count: number }[];
  theme: ThemeColors;
  /** Volle Breite, wenn das Genre-Panel fehlt */
  wide?: boolean;
}

export const TopProvidersSection = memo(({ providers, theme, wide }: TopProvidersProps) => {
  if (providers.length === 0) return null;
  const accent = theme.accent || theme.primary;
  const maxCount = providers[0]?.count || 1;

  return (
    <motion.div
      className={`stats-pod stats-panel stats-panel--providers liquid-glass ${wide ? 'stats-panel--wide' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="stats-pod__label stats-panel__title" style={{ color: theme.text.muted }}>
        <Stream style={{ fontSize: 16, color: accent }} />
        {t('Streaming-Dienste')}
      </h2>
      <div className="stats-provider-list">
        {providers.map((provider, i) => (
          <motion.div
            key={provider.name}
            className="stats-provider-row"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.07 }}
          >
            <div className="stats-genre-header">
              <span className="stats-provider-name">{provider.name}</span>
              <span className="stats-genre-count" style={{ color: theme.text.muted }}>
                {provider.count}
              </span>
            </div>
            <div className="stats-genre-bar-track" style={{ background: `${theme.text.muted}1c` }}>
              <motion.div
                className="stats-genre-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(provider.count / maxCount) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.07 }}
                style={{
                  background: `linear-gradient(90deg, ${accent}, ${theme.primary}cc)`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
TopProvidersSection.displayName = 'TopProvidersSection';
