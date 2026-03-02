/**
 * ResetSection - Theme reset button with confirmation
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Refresh } from '@mui/icons-material';
import type { useTheme } from '../../contexts/ThemeContext';

interface ResetSectionProps {
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  onReset: () => void;
}

export const ResetSection = memo(({ currentTheme, onReset }: ResetSectionProps) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    onReset();
    setShowConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="theme-section"
      style={{
        background: currentTheme.background.surface,
        border: `1px solid ${currentTheme.border.default}`,
      }}
    >
      <AnimatePresence mode="wait">
        {!showConfirm ? (
          <motion.button
            key="reset-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowConfirm(true)}
            className="theme-reset-btn"
            style={{
              background: `${currentTheme.status.warning}12`,
              border: `1px solid ${currentTheme.status.warning}30`,
              color: currentTheme.status.warning,
            }}
          >
            <Refresh style={{ fontSize: 20 }} />
            <div>
              <h3>Theme zurücksetzen</h3>
              <p>Alle Farben auf Standard</p>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-confirm-actions"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="theme-confirm-btn"
              style={{
                background: currentTheme.status.error,
                color: 'white',
              }}
            >
              Zurücksetzen
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowConfirm(false)}
              className="theme-cancel-btn"
              style={{
                background: currentTheme.background.default,
                border: `1px solid ${currentTheme.border.default}`,
                color: currentTheme.text.secondary,
              }}
            >
              Abbrechen
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

ResetSection.displayName = 'ResetSection';
