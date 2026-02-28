import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarMonth, ChevronRight } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useSeriesCountdowns } from '../../hooks/useSeriesCountdowns';

export const SeriesCountdownCard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { countdowns, loading } = useSeriesCountdowns();

  if (loading || countdowns.length === 0) return null;

  const next = countdowns[0];
  const primary = currentTheme.primary;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/countdowns')}
      aria-label={`Countdown: ${next.title} in ${next.daysUntil} Tagen`}
      style={{
        margin: '0 20px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${primary}15, ${primary}05)`,
        border: `1px solid ${primary}30`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: 'calc(100% - 40px)',
        textAlign: 'left',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${primary}, #a855f7)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CalendarMonth style={{ fontSize: 20, color: 'white' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: currentTheme.text.primary,
            whiteSpace: 'nowrap',
          }}
        >
          Countdown
        </h2>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 12,
            color: currentTheme.text.secondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {next.title} &middot;{' '}
          {next.daysUntil === 0
            ? 'Heute!'
            : next.daysUntil === 1
              ? 'Morgen'
              : `in ${next.daysUntil} Tagen`}
        </p>
      </div>

      {/* Preview: Mini poster + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
        {next.posterUrl && (
          <img
            src={next.posterUrl}
            alt=""
            style={{
              width: 28,
              height: 40,
              borderRadius: 4,
              objectFit: 'cover',
            }}
          />
        )}
        {countdowns.length > 1 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: primary,
              background: `${primary}18`,
              padding: '2px 6px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
            }}
          >
            +{countdowns.length - 1}
          </span>
        )}
      </div>

      <ChevronRight
        style={{ color: currentTheme.text.secondary, fontSize: 20 }}
        aria-hidden="true"
      />
    </motion.button>
  );
};
