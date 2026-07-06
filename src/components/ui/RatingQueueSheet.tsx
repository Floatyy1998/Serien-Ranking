import { Save, SkipNext, CheckCircle } from '@mui/icons-material';
import type { PanInfo } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getImageUrl } from '../../utils/imageUrl';
import { hapticSuccess } from '../../lib/haptics';
import { tapScale } from '../../lib/motion';
import type { UnratedQueueItem } from '../../hooks/useUnratedQueue';
import { BottomSheet } from './BottomSheet';
import { RatingControls } from './RatingControls';

interface RatingQueueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: UnratedQueueItem[];
  /** Total number of items when the queue was opened (for the progress label). */
  onRate: (item: UnratedQueueItem, rating: number) => void;
  onSkip: (item: UnratedQueueItem) => void;
}

const SWIPE_SKIP_THRESHOLD = 90;

export const RatingQueueSheet: React.FC<RatingQueueSheetProps> = ({
  isOpen,
  onClose,
  items,
  onRate,
  onSkip,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;
  const [rating, setRating] = useState(0);
  const [startCount, setStartCount] = useState(items.length);

  const current = items[0] ?? null;

  // Reset the slider whenever a new card comes to the front.
  useEffect(() => {
    setRating(0);
  }, [current?.key]);

  // Snapshot the queue length when the sheet opens so the progress label
  // ("3 von 8") counts up as cards are cleared.
  useEffect(() => {
    if (isOpen) setStartCount(items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const done = startCount - items.length;

  const handleSave = () => {
    if (!current || rating <= 0) return;
    hapticSuccess();
    onRate(current, rating);
  };

  const handleSkip = () => {
    if (!current) return;
    onSkip(current);
  };

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_SKIP_THRESHOLD) handleSkip();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel="Schnell-Bewertung">
      <div style={{ padding: '8px 24px 32px' }}>
        {current ? (
          <>
            {/* Progress */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: accent,
                }}
              >
                Noch offen · {Math.min(done + 1, startCount)} von {startCount}
              </span>
            </div>

            {/* Swipeable card */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={current.key}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, x: -220 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '20px',
                  cursor: 'grab',
                  touchAction: 'pan-y',
                }}
              >
                <img
                  src={getImageUrl(current.posterPath, 'w185')}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '64px',
                    height: '96px',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'cover',
                    flexShrink: 0,
                    boxShadow: '0 4px 16px -6px rgba(0,0,0,0.6)',
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: currentTheme.text.muted,
                    }}
                  >
                    {current.type === 'series' ? 'Serie' : 'Film'}
                  </span>
                  <h3
                    style={{
                      fontSize: '19px',
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                      margin: '2px 0 0',
                      lineHeight: 1.2,
                    }}
                  >
                    {current.title}
                  </h3>
                </div>
              </motion.div>
            </AnimatePresence>

            <RatingControls value={rating} onChange={setRating} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button
                whileTap={tapScale}
                onClick={handleSkip}
                aria-label="Diesen Titel überspringen"
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  border: `1px solid ${currentTheme.border?.default || 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: currentTheme.text.secondary,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <SkipNext style={{ fontSize: '18px' }} />
                Überspringen
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={rating === 0}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: rating > 0 ? accent : `${accent}30`,
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: rating > 0 ? currentTheme.background.default : `${accent}60`,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: rating > 0 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Save style={{ fontSize: '18px' }} />
                Speichern
              </motion.button>
            </div>
          </>
        ) : (
          /* Done state */
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <CheckCircle style={{ fontSize: '56px', color: accent }} />
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: currentTheme.text.primary,
                margin: '12px 0 4px',
              }}
            >
              Alles bewertet!
            </h3>
            <p style={{ fontSize: '14px', color: currentTheme.text.secondary, margin: '0 0 20px' }}>
              Kein offener Titel mehr in deiner Bewertungs-Queue.
            </p>
            <motion.button
              whileTap={tapScale}
              onClick={onClose}
              style={{
                padding: '14px 32px',
                background: accent,
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: currentTheme.background.default,
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Schließen
            </motion.button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
