/**
 * PetReleaseConfirm - Modal to confirm pet release (deletion)
 */

import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';

interface PetReleaseConfirmProps {
  pet: Pet;
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PetReleaseConfirm = memo(function PetReleaseConfirm({
  pet,
  show,
  onClose,
  onConfirm,
}: PetReleaseConfirmProps) {
  const { currentTheme } = useTheme();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pet-release-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="pet-release-dialog"
            style={{
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <div className="pet-release-emoji">😢</div>
            <h2 className="pet-release-title" style={{ color: currentTheme.text.primary }}>
              {pet.name} zur Adoption freigeben?
            </h2>
            <p className="pet-release-desc" style={{ color: currentTheme.text.muted }}>
              Dein Pet wird unwiderruflich entfernt. Level, XP und alle Fortschritte gehen verloren.
            </p>
            <div className="pet-release-actions">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="pet-release-btn pet-release-btn--keep"
                style={{
                  background: currentTheme.background.default,
                  borderColor: currentTheme.border.default,
                  color: currentTheme.text.primary,
                }}
              >
                Behalten
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                className="pet-release-btn pet-release-btn--confirm"
              >
                Freigeben
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
