/**
 * PetReviveConfirm - Modal to confirm pet revival, including the level penalty.
 *
 * Wiederbeleben senkt das Level um 1 (ab Level 2). Diese Kosten werden dem
 * Nutzer VORHER angezeigt, statt ihn nach dem Tippen zu überraschen.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';

interface PetReviveConfirmProps {
  pet: Pet;
  show: boolean;
  onClose: () => void;
  onConfirm: (useElixir?: boolean) => void;
  /** Lebenselixiere im Vorrat. */
  elixirs?: number;
}

export const PetReviveConfirm = memo(function PetReviveConfirm({
  pet,
  show,
  onClose,
  onConfirm,
  elixirs = 0,
}: PetReviveConfirmProps) {
  const { currentTheme } = useTheme();
  const losesLevel = pet.level > 1;
  const withElixir = losesLevel && elixirs > 0;

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
              {t('{name} wiederbeleben?', { name: pet.name })}
            </h2>
            <p className="pet-release-desc" style={{ color: currentTheme.text.muted }}>
              {withElixir
                ? t('Mit einem Lebenselixier behält {name} Level {level}. Du hast {n}.', {
                    name: pet.name,
                    level: pet.level,
                    n: elixirs,
                  })
                : losesLevel
                  ? t('Das kostet 1 Level: {name} fällt von Level {von} auf Level {auf}.', {
                      name: pet.name,
                      von: pet.level,
                      auf: pet.level - 1,
                    })
                  : t('{name} kehrt frisch gestärkt zurück.', { name: pet.name })}
            </p>
            <div className="pet-release-actions">
              <motion.button
                whileTap={tapScale}
                onClick={onClose}
                className="pet-release-btn pet-release-btn--keep"
                style={{
                  background: currentTheme.background.default,
                  borderColor: currentTheme.border.default,
                  color: currentTheme.text.primary,
                }}
              >
                {t('Abbrechen')}
              </motion.button>
              <motion.button
                whileTap={tapScale}
                onClick={() => onConfirm(withElixir)}
                className="pet-release-btn pet-release-btn--confirm"
              >
                {withElixir
                  ? t('Mit Elixier wiederbeleben')
                  : losesLevel
                    ? t('Wiederbeleben (−1 Level)')
                    : t('Wiederbeleben')}
              </motion.button>
            </div>
            {withElixir && (
              <button
                type="button"
                onClick={() => onConfirm(false)}
                style={{
                  display: 'block',
                  margin: '10px auto 0',
                  background: 'none',
                  border: 'none',
                  color: currentTheme.text.muted,
                  fontSize: 13,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {t('Elixier aufheben und 1 Level abgeben')}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
