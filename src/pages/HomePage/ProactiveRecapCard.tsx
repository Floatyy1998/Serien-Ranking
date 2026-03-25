import { AutoAwesome, Close, ExpandMore, ExpandLess, ChevronRight } from '@mui/icons-material';
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
  const [expanded, setExpanded] = useState(false);
  const accent = currentTheme.accent || currentTheme.primary;

  if (recaps.length === 0) return null;
  const current = recaps[Math.min(currentIndex, recaps.length - 1)];
  if (!current) return null;

  const triggerLabel =
    current.triggerType === 'new-season'
      ? `Staffel ${current.seasonNumber} startet ${current.startsToday ? 'heute' : 'morgen'}!`
      : `Staffel ${current.seasonNumber} wird ${current.startsToday ? 'heute' : 'morgen'} fortgesetzt!`;

  const hasContent = current.recap && !current.loading;
  const points = hasContent ? parseBulletPoints(current.recap!) : [];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={current.cacheKey}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          margin: '0 auto',
          zIndex: 1000,
          maxWidth: '480px',
          width: 'calc(100% - 32px)',
          borderRadius: '16px',
          border: `1px solid ${accent}30`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(16px)',
          background: `linear-gradient(135deg, ${currentTheme.background.surface}ee, ${currentTheme.background.default}ee)`,
          overflow: 'hidden',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => onDismiss(current.cacheKey)}
          className="close-button"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            color: currentTheme.text.muted,
            zIndex: 1,
          }}
        >
          <Close style={{ fontSize: '18px' }} />
        </button>

        {/* Header */}
        <div style={{ padding: '16px 16px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <AutoAwesome className="new-icon pulse" style={{ fontSize: '28px', color: accent }} />
            <h3
              style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 800,
                color: accent,
                lineHeight: 1.2,
              }}
            >
              {triggerLabel}
            </h3>
          </div>

          {/* Series info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: '14px',
              marginBottom: '12px',
            }}
          >
            {current.posterUrl && (
              <img
                src={current.posterUrl}
                alt={current.seriesTitle}
                onClick={() => navigate(`/series/${current.seriesId}`)}
                style={{
                  width: '50px',
                  height: '75px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  margin: '0 0 6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: currentTheme.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {current.seriesTitle}
              </h4>
              <p
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0,
                  opacity: 0.9,
                  fontSize: '0.85rem',
                  color: currentTheme.text.muted,
                }}
              >
                {current.loading
                  ? 'Recap wird generiert...'
                  : current.triggerType === 'new-season'
                    ? 'Recap der vorherigen Staffel'
                    : 'Recap vor der Fortsetzung'}
              </p>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}
            >
              <button
                onClick={() => navigate(`/series/${current.seriesId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '0.9rem',
                  background: accent,
                  color: currentTheme.background.default,
                }}
              >
                <span>Zur Serie</span>
                <ChevronRight style={{ fontSize: '20px' }} />
              </button>
              {hasContent && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9rem',
                    background: `${accent}20`,
                    color: accent,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <span>{expanded ? 'Einklappen' : 'Recap lesen'}</span>
                  {expanded ? (
                    <ExpandLess style={{ fontSize: '18px' }} />
                  ) : (
                    <ExpandMore style={{ fontSize: '18px' }} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {current.loading && (
          <div
            style={{
              height: '3px',
              background: `${accent}15`,
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{ width: '40%', height: '100%', background: accent }}
            />
          </div>
        )}

        {/* Expandable recap */}
        <AnimatePresence>
          {expanded && hasContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  padding: '4px 16px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, ${accent}25, transparent)`,
                    marginBottom: '6px',
                  }}
                />
                {points.map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                  >
                    <div
                      style={{
                        width: '3px',
                        minHeight: '16px',
                        height: '100%',
                        borderRadius: '2px',
                        background: accent,
                        opacity: 0.4 + i * 0.1,
                        flexShrink: 0,
                        marginTop: '4px',
                      }}
                    />
                    <p
                      style={{
                        fontSize: '14px',
                        lineHeight: 1.65,
                        color: currentTheme.text.secondary,
                        margin: 0,
                      }}
                    >
                      {point}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation dots */}
        {recaps.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0 0 12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', opacity: 0.7, color: currentTheme.text.muted }}>
              {currentIndex + 1} von {recaps.length}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {recaps.map((_, i) => (
                <span
                  key={i}
                  onClick={() => {
                    setCurrentIndex(i);
                    setExpanded(false);
                  }}
                  style={{
                    width: i === currentIndex ? '24px' : '8px',
                    height: '8px',
                    borderRadius: i === currentIndex ? '4px' : '50%',
                    background: i === currentIndex ? accent : `${currentTheme.text.muted}40`,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
