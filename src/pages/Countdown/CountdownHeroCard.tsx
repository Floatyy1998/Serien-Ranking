import { motion } from 'framer-motion';
import { CalendarMonth } from '@mui/icons-material';
import type { SeriesCountdown } from '../../hooks/useSeriesCountdowns';

const ACCENT = '#a855f7';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface CountdownHeroCardProps {
  item: SeriesCountdown;
  onClick: () => void;
}

export const CountdownHeroCard: React.FC<CountdownHeroCardProps> = ({ item, onClick }) => (
  <motion.button
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="cd-hero"
    style={{
      border: `1px solid ${ACCENT}40`,
      background: 'var(--color-background-default, #0a0a0a)',
    }}
  >
    {/* Background poster with heavy blur */}
    {item.posterUrl && (
      <div className="cd-hero-bg" style={{ backgroundImage: `url(${item.posterUrl})` }} />
    )}

    {/* Gradient overlay */}
    <div
      className="cd-hero-overlay"
      style={{
        background: `linear-gradient(135deg, ${ACCENT}30 0%, rgba(10, 14, 26, 0.75) 100%)`,
      }}
    />

    {/* Content */}
    <div className="cd-hero-body">
      {/* Poster */}
      {item.posterUrl ? (
        <img src={item.posterUrl} alt={`Poster von ${item.title}`} className="cd-hero-poster" />
      ) : (
        <div
          className="cd-hero-poster-placeholder"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}30, ${ACCENT}10)`,
          }}
        >
          <CalendarMonth style={{ fontSize: 36, color: ACCENT, opacity: 0.5 }} />
        </div>
      )}

      {/* Info */}
      <div className="cd-hero-info">
        <p className="cd-hero-eyebrow" style={{ color: ACCENT }}>
          Als nächstes
        </p>
        <h2 className="cd-hero-title">{item.title}</h2>
        <p className="cd-hero-season">Staffel {item.seasonNumber}</p>
        <p className="cd-hero-date">{formatDate(item.nextDate)}</p>
      </div>

      {/* Countdown circle */}
      <div
        className="cd-hero-circle"
        style={{
          background: `${ACCENT}30`,
          border: `2px solid ${ACCENT}70`,
        }}
      >
        {item.daysUntil === 0 ? (
          <span className="cd-hero-circle-today">Heute</span>
        ) : (
          <>
            <span className="cd-hero-circle-days">{item.daysUntil}</span>
            <span className="cd-hero-circle-label">{item.daysUntil === 1 ? 'Tag' : 'Tage'}</span>
          </>
        )}
      </div>
    </div>
  </motion.button>
);
