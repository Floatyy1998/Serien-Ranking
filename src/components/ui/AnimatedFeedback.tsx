import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { currentTheme } = useTheme();
  const successColor = currentTheme.status?.success ?? '#4ade80';
  const errorColor = currentTheme.status?.error ?? '#ff6b6b';
  const warningColor = currentTheme.accent ?? '#fbbf24';

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
          {type === 'success' && <SuccessIcon size={size} color={successColor} />}
          {type === 'error' && <ErrorIcon size={size} color={errorColor} />}
          {type === 'warning' && <WarningIcon size={size} color={warningColor} />}

          {message && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color:
                  type === 'success' ? successColor : type === 'error' ? errorColor : warningColor,
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

const SuccessIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <motion.div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `${color}26`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M5 13l4 4L19 7"
        stroke={color}
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

const ErrorIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <motion.div
    animate={{ x: [0, -4, 4, -3, 3, 0] }}
    transition={{ duration: 0.4, delay: 0.1 }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `${color}26`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      />
    </svg>
  </motion.div>
);

const WarningIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <motion.div
    animate={{ y: [0, -3, 0] }}
    transition={{ duration: 0.5, delay: 0.1, repeat: 1 }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `${color}26`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.5,
      color: color,
      fontWeight: 700,
    }}
  >
    !
  </motion.div>
);
