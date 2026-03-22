import CalendarMonth from '@mui/icons-material/CalendarMonth';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export function CountdownBanner({
  countdown,
  totalCount,
  navigate,
}: {
  countdown: { title: string; posterUrl?: string; daysUntil: number; seasonNumber: number };
  totalCount: number;
  navigate: (path: string) => void;
}) {
  const { currentTheme: _ct } = useTheme();
  const countdownColor = _ct.accent;
  const daysText =
    countdown.daysUntil === 0
      ? 'Heute!'
      : countdown.daysUntil === 1
        ? 'Morgen'
        : `in ${countdown.daysUntil} Tagen`;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate('/countdowns')}
      style={{
        margin: '0 20px 16px',
        borderRadius: '14px',
        padding: '12px 14px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {countdown.posterUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${countdown.posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.3)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${countdownColor}40 0%, rgba(10, 14, 26, 0.75) 100%)`,
          border: `1px solid ${countdownColor}50`,
          borderRadius: '16px',
        }}
      />
      {countdown.posterUrl && (
        <img
          src={countdown.posterUrl}
          alt=""
          style={{
            position: 'relative',
            width: 44,
            height: 66,
            borderRadius: '8px',
            objectFit: 'cover',
            flexShrink: 0,
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
          }}
        />
      )}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <CalendarMonth style={{ fontSize: '16px', color: countdownColor }} />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: countdownColor,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Countdown
          </span>
          {totalCount > 1 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: countdownColor,
                background: `${countdownColor}25`,
                padding: '1px 6px',
                borderRadius: '6px',
              }}
            >
              +{totalCount - 1}
            </span>
          )}
        </div>
        <h2
          style={{
            margin: '0 0 1px 0',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: _ct.text.secondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {countdown.title}
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          Staffel {countdown.seasonNumber} &middot; {daysText}
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: `${countdownColor}30`,
          border: `2px solid ${countdownColor}80`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {countdown.daysUntil === 0 ? (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: _ct.text.secondary,
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Heute
          </span>
        ) : (
          <>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 800,
                color: _ct.text.secondary,
                lineHeight: 1,
              }}
            >
              {countdown.daysUntil}
            </span>
            <span
              style={{
                fontSize: '7px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
              }}
            >
              {countdown.daysUntil === 1 ? 'Tag' : 'Tage'}
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
