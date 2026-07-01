/**
 * PetReviveConfirm - Modal to confirm pet revival, including the level penalty.
 *
 * Wiederbeleben senkt das Level um 1 (ab Level 2). Diese Kosten werden dem
 * Nutzer VORHER angezeigt, statt ihn nach dem Tippen zu überraschen.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';

interface PetReviveConfirmProps {
  pet: Pet;
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PetReviveConfirm = memo(function PetReviveConfirm({
  pet,
  show,
  onClose,
  onConfirm,
}: PetReviveConfirmProps) {
  const { currentTheme } = useTheme();
  const losesLevel = pet.level > 1;

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
            <div className="pet-release-emoji">💫</div>
            <h2 className="pet-release-title" style={{ color: currentTheme.text.primary }}>
              {pet.name} wiederbeleben?
            </h2>
            <p className="pet-release-desc" style={{ color: currentTheme.text.muted }}>
              {losesLevel
                ? `Das kostet 1 Level: ${pet.name} fällt von Level ${pet.level} auf Level ${pet.level - 1}.`
                : `${pet.name} kehrt frisch gestärkt zurück.`}
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
                Abbrechen
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                className="pet-release-btn pet-release-btn--confirm"
              >
                {losesLevel ? 'Wiederbeleben (−1 Level)' : 'Wiederbeleben'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
