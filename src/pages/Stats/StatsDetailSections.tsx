import { Category, LocalFireDepartment, Star, Stream } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';

interface ThemeColors {
  primary: string;
  accent?: string;
  background: { default: string; surface: string };
  text: { primary: string; secondary: string; muted: string };
  border: { default: string };
  status: { success: string; error: string; warning: string };
}

/* ------------------------------------------------------------------ */
/*  RatingsSection                                                     */
/* ------------------------------------------------------------------ */
interface RatingsSectionProps {
  avgSeriesRating: number;
  avgMovieRating: number;
  theme: ThemeColors;
}

export const RatingsSection = memo(
  ({ avgSeriesRating, avgMovieRating, theme }: RatingsSectionProps) => (
    <motion.div
      className="stats-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      style={{
        background: theme.background.surface,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      <h2 className="stats-section-title">
        <Star style={{ fontSize: 20, color: theme.accent || theme.primary }} />
        Deine Bewertungen
      </h2>
      <div className="stats-ratings-row">
        <div className="stats-rating-card" style={{ background: theme.background.surface }}>
          <div className="stats-rating-value">{avgSeriesRating.toFixed(1)}</div>
          <div className="stats-rating-label" style={{ color: theme.text.muted }}>
            &Oslash; Serien
          </div>
        </div>
        <div className="stats-rating-card" style={{ background: theme.background.surface }}>
          <div className="stats-rating-value">{avgMovieRating.toFixed(1)}</div>
          <div className="stats-rating-label" style={{ color: theme.text.muted }}>
            &Oslash; Filme
          </div>
        </div>
      </div>
    </motion.div>
  )
);
RatingsSection.displayName = 'RatingsSection';

/* ------------------------------------------------------------------ */
/*  TopGenresSection                                                   */
/* ------------------------------------------------------------------ */
interface TopGenresProps {
  genres: { name: string; count: number }[];
  theme: ThemeColors;
}

export const TopGenresSection = memo(({ genres, theme }: TopGenresProps) => {
  if (genres.length === 0) return null;
  const maxCount = genres[0]?.count || 1;

  return (
    <motion.div
      className="stats-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      style={{
        background: theme.background.surface,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      <h2 className="stats-section-title">
        <Category style={{ fontSize: 20, color: theme.accent || theme.primary }} />
        Top Genres
      </h2>
      <div className="stats-genre-list">
        {genres.map((genre, i) => (
          <motion.div
            key={genre.name}
            className="stats-genre-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.1 }}
          >
            <span
              className="stats-genre-rank"
              style={{ color: i === 0 ? theme.accent || theme.primary : theme.text.muted }}
            >
              #{i + 1}
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
                style={{ background: `${theme.text.muted}20` }}
              >
                <motion.div
                  className="stats-genre-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${(genre.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.8, delay: 1 + i * 0.1 }}
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent || theme.primary}cc)`,
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

/* ------------------------------------------------------------------ */
/*  TopProvidersSection                                                */
/* ------------------------------------------------------------------ */
interface TopProvidersProps {
  providers: { name: string; count: number }[];
  theme: ThemeColors;
}

export const TopProvidersSection = memo(({ providers, theme }: TopProvidersProps) => {
  if (providers.length === 0) return null;

  return (
    <motion.div
      className="stats-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      style={{
        background: theme.background.surface,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      <h2 className="stats-section-title">
        <Stream style={{ fontSize: 20, color: theme.accent || theme.primary }} />
        Streaming-Dienste
      </h2>
      <div className="stats-provider-list">
        {providers.map((provider, i) => (
          <motion.div
            key={provider.name}
            className="stats-provider-chip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 + i * 0.1 }}
            style={{
              background: theme.background.surface,
              border: `1px solid ${theme.border.default}`,
            }}
          >
            <span className="stats-provider-name">{provider.name}</span>
            <span
              className="stats-provider-count"
              style={{
                background: `${theme.text.muted}20`,
                color: theme.text.muted,
              }}
            >
              {provider.count}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
TopProvidersSection.displayName = 'TopProvidersSection';

/* ------------------------------------------------------------------ */
/*  WeekActivitySection                                                */
/* ------------------------------------------------------------------ */
interface WeekActivityProps {
  lastWeekWatched: number;
  theme: ThemeColors;
}

export const WeekActivitySection = memo(({ lastWeekWatched, theme }: WeekActivityProps) => (
  <motion.div
    className="stats-week"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.2 }}
    style={{
      background: theme.background.surface,
      border: `1px solid ${theme.border.default}`,
    }}
  >
    <div className="stats-week-content">
      <div
        className="stats-week-icon"
        style={{
          background: `linear-gradient(135deg, ${theme.status.success}, ${theme.accent || theme.primary})`,
        }}
      >
        <LocalFireDepartment style={{ fontSize: 28, color: theme.text.secondary }} />
      </div>
      <div>
        <div className="stats-week-value">{lastWeekWatched}</div>
        <div className="stats-week-label" style={{ color: theme.text.muted }}>
          Episoden diese Woche
        </div>
      </div>
    </div>
  </motion.div>
));
WeekActivitySection.displayName = 'WeekActivitySection';
