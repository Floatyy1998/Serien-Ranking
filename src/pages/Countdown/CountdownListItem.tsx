import { motion } from 'framer-motion';
import { CalendarMonth } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import type { SeriesCountdown } from '../../hooks/useSeriesCountdowns';
import { tapScaleSmall } from '../../lib/motion';
import { formatSeasonDate } from '../../lib/date';
import { t } from '../../services/i18n';

interface CountdownListItemProps {
  item: SeriesCountdown;
  index: number;
  onClick: () => void;
}

function countdownText(daysUntil: number): string {
  if (daysUntil === 0) return t('startet heute');
  if (daysUntil === 1) return t('in 1 Tag');
  return t('in {n} Tagen', { n: daysUntil });
}

export const CountdownListItem: React.FC<CountdownListItemProps> = ({ item, index, onClick }) => {
  const { currentTheme } = useTheme();

  const seasonLabel =
    item.type === 'mid-season-return' ? t('Rückkehr') : t('Staffel {n}', { n: item.seasonNumber });

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={tapScaleSmall}
      onClick={onClick}
      aria-label={`${item.title}, ${seasonLabel}, ${countdownText(item.daysUntil)}. ${t('Details öffnen')}`}
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
          alt={t('Poster von {title}', { title: item.title })}
          decoding="async"
          className="cd-item-poster"
          loading="lazy"
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
          {seasonLabel} &middot; {formatSeasonDate(item.nextDate)}
        </p>
      </div>

      {/* Day count */}
      <div className="cd-item-days">
        {item.daysUntil === 0 ? (
          <span className="cd-item-days-today" style={{ color: currentTheme.accent }}>
            {t('Heute')}
          </span>
        ) : (
          <>
            <span className="cd-item-days-number" style={{ color: currentTheme.accent }}>
              {item.daysUntil}
            </span>
            <span className="cd-item-days-label" style={{ color: currentTheme.text.muted }}>
              {item.daysUntil === 1 ? t('Tag') : t('Tage')}
            </span>
          </>
        )}
      </div>
    </motion.button>
  );
};
