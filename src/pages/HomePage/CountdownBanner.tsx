import CalendarMonth from '@mui/icons-material/CalendarMonth';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';

interface CountdownBannerProps {
  countdown: { title: string; posterUrl?: string; daysUntil: number; seasonNumber: number };
  totalCount: number;
  navigate: (path: string) => void;
}

function CountdownBannerImpl({ countdown, totalCount, navigate }: CountdownBannerProps) {
  const { currentTheme: _ct } = useTheme();
  const { isDesktop } = useDeviceType();
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
      role="button"
      tabIndex={0}
      aria-label={`Countdown: ${countdown.title}, Staffel ${countdown.seasonNumber} ${daysText}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('/countdowns');
        }
      }}
      style={{
        margin: '0 20px 16px',
        borderRadius: '18px',
        padding: isDesktop ? '16px 20px' : '12px 14px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: isDesktop ? '16px' : '12px',
        boxShadow: 'var(--shadow-lg), var(--glass-specular)',
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
            filter: 'blur(26px) saturate(1.5) brightness(0.45)',
            transform: 'scale(1.2)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.07), transparent 55%), linear-gradient(135deg, ${countdownColor}38 0%, rgba(10, 14, 26, 0.72) 100%)`,
          border: `1px solid ${countdownColor}50`,
          borderTopColor: 'rgba(255,255,255,0.22)',
          borderRadius: '18px',
        }}
      />
      {countdown.posterUrl && (
        <img
          src={countdown.posterUrl}
          alt=""
          style={{
            position: 'relative',
            width: isDesktop ? 58 : 44,
            height: isDesktop ? 87 : 66,
            borderRadius: '8px',
            objectFit: 'cover',
            flexShrink: 0,
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
          }}
          loading="lazy"
          decoding="async"
        />
      )}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <CalendarMonth style={{ fontSize: isDesktop ? '18px' : '16px', color: countdownColor }} />
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
            fontSize: isDesktop ? '16px' : '15px',
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
        <p
          style={{
            margin: 0,
            fontSize: isDesktop ? '14px' : '13px',
            color: _ct.text.secondary,
          }}
        >
          Staffel {countdown.seasonNumber} &middot; {daysText}
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          width: isDesktop ? 52 : 46,
          height: isDesktop ? 52 : 46,
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
                fontSize: isDesktop ? '18px' : '16px',
                fontWeight: 800,
                color: _ct.text.secondary,
                lineHeight: 1,
              }}
            >
              {countdown.daysUntil}
            </span>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: _ct.text.secondary,
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

// Memo: props are scalar/stable, parent re-renders often on unrelated
// notification updates, so skipping when props didn't change pays off.
export const CountdownBanner = memo(CountdownBannerImpl);
CountdownBanner.displayName = 'CountdownBanner';
