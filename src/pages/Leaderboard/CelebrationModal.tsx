import { Close, Timer } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Trophy3D } from '../../components/ui/Trophy3D';
import { useTheme } from '../../contexts/ThemeContextDef';
import { seededRandom } from '../../utils/seededRandom';
import type { CelebrationData } from './useLeaderboardData';

const PLACE_COLORS = ['', '#FFD700', '#C0C0C0', '#CD7F32'];
const PLACE_GRADIENTS = [
  '',
  'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
  'linear-gradient(135deg, #E8E8E8, #A8A8A8, #E8E8E8)',
  'linear-gradient(135deg, #CD7F32, #E8A050, #CD7F32)',
];
const PLACE_LABELS = ['', '1. Platz!', '2. Platz!', '3. Platz!'];
const CONFETTI_COLORS = [
  '#FFD700',
  '#FFA500',
  '#FF6347',
  '#00CED1',
  '#7B68EE',
  '#FF69B4',
  '#32CD32',
  '#FF4500',
  '#1E90FF',
  '#FFE066',
];

function formatWatchtime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

interface CelebrationModalProps {
  celebration: CelebrationData | null;
  onClose: () => void;
  userName: string;
}

// Pre-compute random data outside component for render purity
const _randCM = seededRandom(303);
const RANDOM_VALUES_CM = Array.from({ length: 13 }, () => _randCM());

export const CelebrationModal = React.memo(function CelebrationModal({
  celebration,
  onClose,
  userName,
}: CelebrationModalProps) {
  const { currentTheme } = useTheme();
  let _ri = 0;
  const nextRandom = () => RANDOM_VALUES_CM[_ri++ % RANDOM_VALUES_CM.length];
  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          className="lb-celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Confetti */}
          {Array.from({ length: 60 }).map((_, i) => {
            const w = typeof window !== 'undefined' ? window.innerWidth : 400;
            const h = typeof window !== 'undefined' ? window.innerHeight : 800;
            const startX = nextRandom() * w;
            const drift = (nextRandom() - 0.5) * 150;
            const pSize = 5 + nextRandom() * 9;
            const isCircle = nextRandom() > 0.5;
            return (
              <motion.div
                key={i}
                className="lb-confetti"
                initial={{ opacity: 1, left: startX, top: -20, rotate: 0 }}
                animate={{
                  opacity: [1, 1, 1, 0.6, 0],
                  top: [-(nextRandom() * 40), h + 40],
                  left: [startX, startX + drift],
                  rotate: nextRandom() * 1080,
                }}
                transition={{
                  duration: 2.5 + nextRandom() * 2.5,
                  delay: nextRandom() * 2,
                  ease: 'linear',
                }}
                style={{
                  width: isCircle ? pSize : pSize * 0.5,
                  height: isCircle ? pSize : pSize * 1.8,
                  borderRadius: isCircle ? '50%' : '2px',
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                }}
              />
            );
          })}

          {/* Radial glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            style={{
              position: 'absolute',
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${PLACE_COLORS[celebration.place]}40, ${PLACE_COLORS[celebration.place]}10, transparent)`,
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 150 }}
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: 'center', position: 'relative', maxWidth: '380px', width: '100%' }}
          >
            <motion.button
              className="lb-celebration-close"
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              <Close sx={{ fontSize: 20 }} />
            </motion.button>

            {/* 3D Trophy */}
            <motion.div
              initial={{ scale: 0, rotateY: -90 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 10, stiffness: 100 }}
              style={{ marginBottom: '16px' }}
            >
              <Trophy3D
                place={celebration.place as 1 | 2 | 3}
                size={260}
                autoRotate
                name={userName}
                monthLabel={celebration.monthLabel}
              />
            </motion.div>

            {/* Place badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', damping: 12 }}
              style={{
                display: 'inline-block',
                background: PLACE_GRADIENTS[celebration.place],
                borderRadius: '20px',
                padding: '6px 24px',
                marginBottom: '12px',
                boxShadow: `0 4px 20px ${PLACE_COLORS[celebration.place]}50`,
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: currentTheme.background.default,
                  letterSpacing: '0.5px',
                }}
              >
                {PLACE_LABELS[celebration.place]}
              </span>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <p
                style={{
                  margin: '0 0 20px',
                  fontSize: '16px',
                  color: currentTheme.text.muted,
                  lineHeight: 1.6,
                }}
              >
                Watchtime-Rangliste
                <br />
                <strong style={{ color: currentTheme.text.secondary, fontSize: '18px' }}>
                  {celebration.monthLabel}
                </strong>
              </p>
            </motion.div>

            {/* Score pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: `${currentTheme.text.muted}15`,
                borderRadius: '16px',
                padding: '12px 28px',
                marginBottom: '28px',
                border: `1px solid ${PLACE_COLORS[celebration.place]}35`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <Timer style={{ fontSize: '20px', color: PLACE_COLORS[celebration.place] }} />
              <span
                style={{ fontSize: '26px', fontWeight: 800, color: currentTheme.text.secondary }}
              >
                {formatWatchtime(celebration.score)}
              </span>
            </motion.div>

            {/* Dismiss button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: '240px',
                  margin: '0 auto',
                  padding: '14px 32px',
                  borderRadius: '14px',
                  border: 'none',
                  background: PLACE_GRADIENTS[celebration.place],
                  color: currentTheme.background.default,
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: `0 6px 24px ${PLACE_COLORS[celebration.place]}50`,
                  letterSpacing: '0.3px',
                }}
              >
                Weiter
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
