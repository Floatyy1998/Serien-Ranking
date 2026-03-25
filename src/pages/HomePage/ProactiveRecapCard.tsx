import { AutoAwesome, Close, ChevronRight } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { ProactiveRecap } from '../../hooks/useProactiveRecaps';

interface ProactiveRecapCardProps {
  recaps: ProactiveRecap[];
  onDismiss: (cacheKey: string) => void;
}

function parseBulletPoints(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[•\-\*]\s*/, '').replace(/\*\*/g, ''));
}

export const ProactiveRecapCard: React.FC<ProactiveRecapCardProps> = ({ recaps, onDismiss }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const accent = currentTheme.accent || currentTheme.primary;

  if (recaps.length === 0) return null;
  const current = recaps[Math.min(currentIndex, recaps.length - 1)];
  if (!current) return null;

  const triggerLabel =
    current.triggerType === 'new-season'
      ? `Staffel ${current.seasonNumber} startet!`
      : `Mid-Season Comeback!`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        style={{
          background: `linear-gradient(135deg, ${accent}12, ${currentTheme.background.default})`,
          border: `1px solid ${accent}25`,
          borderRadius: '16px',
          padding: '16px',
          margin: '0 0 12px',
          position: 'relative',
        }}
      >
        <Tooltip title="Schließen" arrow>
          <button
            onClick={() => onDismiss(current.cacheKey)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              color: currentTheme.text.muted,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <Close style={{ fontSize: '18px' }} />
          </button>
        </Tooltip>

        {/* Header */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          {current.posterUrl && (
            <img
              src={current.posterUrl}
              alt={current.seriesTitle}
              style={{
                width: '48px',
                height: '72px',
                objectFit: 'cover',
                borderRadius: '8px',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
              }}
            >
              <AutoAwesome style={{ fontSize: '14px', color: accent }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: accent,
                }}
              >
                {triggerLabel}
              </span>
            </div>
            <div
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: currentTheme.text.secondary,
                marginBottom: '2px',
              }}
            >
              {current.seriesTitle}
            </div>
            <div style={{ fontSize: '13px', color: currentTheme.text.muted }}>
              {current.triggerType === 'new-season'
                ? `Recap der vorherigen Staffel`
                : `Recap vor der Fortsetzung`}
            </div>
          </div>
        </div>

        {/* Recap Content */}
        {current.loading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '8px 0',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '16px',
                  borderRadius: '8px',
                  background: currentTheme.background.surface,
                  width: `${100 - i * 15}%`,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : current.recap ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {parseBulletPoints(current.recap).map((point, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '3px',
                    minHeight: '16px',
                    height: '100%',
                    borderRadius: '2px',
                    background: accent,
                    opacity: 0.5 + i * 0.1,
                    flexShrink: 0,
                    marginTop: '3px',
                  }}
                />
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: currentTheme.text.secondary,
                    margin: 0,
                  }}
                >
                  {point}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '14px',
          }}
        >
          {/* Navigation dots */}
          {recaps.length > 1 && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {recaps.map((_, i) => (
                <span
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: i === currentIndex ? accent : `${currentTheme.text.muted}40`,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate(`/series/${current.seriesId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: accent,
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              color: currentTheme.background.default,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Zur Serie
            <ChevronRight style={{ fontSize: '16px' }} />
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </AnimatePresence>
  );
};
