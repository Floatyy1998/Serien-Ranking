import { motion } from 'framer-motion';
import { CalendarMonth } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import type { SeriesCountdown } from '../../hooks/useSeriesCountdowns';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface CountdownListItemProps {
  item: SeriesCountdown;
  index: number;
  onClick: () => void;
}

export const CountdownListItem: React.FC<CountdownListItemProps> = ({ item, index, onClick }) => {
  const { currentTheme } = useTheme();

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cd-item"
      style={{
        border: `1px solid ${currentTheme.border.default}`,
        background: currentTheme.background.surface,
      }}
    >
      {/* Poster */}
      {item.posterUrl ? (
        <img
          src={item.posterUrl}
          alt={`Poster von ${item.title}`}
          decoding="async"
          className="cd-item-poster"
        />
      ) : (
        <div
          className="cd-item-poster-placeholder"
          style={{ background: `${currentTheme.primary}15` }}
        >
          <CalendarMonth style={{ fontSize: 20, color: currentTheme.text.muted }} />
        </div>
      )}

      {/* Info */}
      <div className="cd-item-info">
        <h3 className="cd-item-title" style={{ color: currentTheme.text.primary }}>
          {item.title}
        </h3>
        <p className="cd-item-meta" style={{ color: currentTheme.text.secondary }}>
          Staffel {item.seasonNumber} &middot; {formatDate(item.nextDate)}
        </p>
      </div>

      {/* Day count */}
      <div className="cd-item-days">
        {item.daysUntil === 0 ? (
          <span className="cd-item-days-today" style={{ color: currentTheme.accent }}>
            Heute
          </span>
        ) : (
          <>
            <span className="cd-item-days-number" style={{ color: currentTheme.accent }}>
              {item.daysUntil}
            </span>
            <span className="cd-item-days-label" style={{ color: currentTheme.text.muted }}>
              {item.daysUntil === 1 ? 'Tag' : 'Tage'}
            </span>
          </>
        )}
      </div>
    </motion.button>
  );
};
