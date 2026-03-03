import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface AnimatedFeedbackProps {
  type: 'success' | 'error' | 'warning';
  visible: boolean;
  /** Optional message displayed below the icon */
  message?: string;
  /** Size of the icon area (default: 48) */
  size?: number;
}

/**
 * Animated success/error/warning feedback icons.
 * - Success: Animated checkmark with SVG pathLength
 * - Error: Shake + red pulse
 * - Warning: Bounce attention
 */
export const AnimatedFeedback: React.FC<AnimatedFeedbackProps> = ({
  type,
  visible,
  message,
  size = 48,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {type === 'success' && <SuccessIcon size={size} />}
          {type === 'error' && <ErrorIcon size={size} />}
          {type === 'warning' && <WarningIcon size={size} />}

          {message && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: type === 'success' ? '#4ade80' : type === 'error' ? '#ff6b6b' : '#fbbf24',
                margin: 0,
              }}
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SuccessIcon: React.FC<{ size: number }> = ({ size }) => (
  <motion.div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'rgba(74, 222, 128, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M5 13l4 4L19 7"
        stroke="#4ade80"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
      />
    </svg>
  </motion.div>
);

const ErrorIcon: React.FC<{ size: number }> = ({ size }) => (
  <motion.div
    animate={{ x: [0, -4, 4, -3, 3, 0] }}
    transition={{ duration: 0.4, delay: 0.1 }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'rgba(255, 107, 107, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M6 6l12 12M18 6L6 18"
        stroke="#ff6b6b"
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      />
    </svg>
  </motion.div>
);

const WarningIcon: React.FC<{ size: number }> = ({ size }) => (
  <motion.div
    animate={{ y: [0, -3, 0] }}
    transition={{ duration: 0.5, delay: 0.1, repeat: 1 }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'rgba(251, 191, 36, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.5,
      color: '#fbbf24',
      fontWeight: 700,
    }}
  >
    !
  </motion.div>
);
