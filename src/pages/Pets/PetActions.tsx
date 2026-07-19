import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';

interface PetActionsProps {
  pet: Pet;
  onFeed: () => void;
  onPlay: () => void;
  onRevive: () => void;
}

export const PetActions = memo(function PetActions({
  pet,
  onFeed,
  onPlay,
  onRevive,
}: PetActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="pet-actions"
    >
      <AnimatePresence mode="wait">
        {pet.isAlive ? (
          <>
            <motion.button
              key="feed"
              whileTap={tapScale}
              onClick={onFeed}
              className="pet-action-btn pet-action-btn--feed"
            >
              🍖 {t('Füttern')}
            </motion.button>
            <motion.button
              key="play"
              whileTap={tapScale}
              onClick={onPlay}
              className="pet-action-btn pet-action-btn--play"
            >
              🎮 {t('Spielen')}
            </motion.button>
          </>
        ) : (
          <motion.button
            key="revive"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={tapScale}
            onClick={onRevive}
            className="pet-action-btn pet-action-btn--revive"
          >
            {t('Wiederbeleben')}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
