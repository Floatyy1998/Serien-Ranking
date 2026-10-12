import { motion } from 'framer-motion';
import { memo } from 'react';
import { petPortrait } from '../../components/pet/pixelThumbs';
import { useTheme } from '../../contexts/ThemeContext';
import { useActiveSeason } from '../../hooks/pet/useActiveSeason';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';

interface PetSelectorProps {
  pets: Pet[];
  selectedPetIndex: number;
  canAddNewPet: boolean;
  onSelectPet: (index: number) => void;
  onOpenCreateModal: () => void;
}

export const PetSelector = memo(function PetSelector({
  pets,
  selectedPetIndex,
  canAddNewPet,
  onSelectPet,
  onOpenCreateModal,
}: PetSelectorProps) {
  const { currentTheme } = useTheme();
  const season = useActiveSeason();

  if (pets.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pet-selector"
    >
      {pets.map((p, idx) => {
        const active = idx === selectedPetIndex;
        const portrait = petPortrait(p, p.color, season);
        return (
          <motion.button
            key={p.id}
            whileTap={tapScale}
            onClick={() => onSelectPet(idx)}
            className="pet-selector-btn"
            aria-pressed={active}
            style={{
              background: active
                ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                : currentTheme.background.surface,
              border: active ? '1px solid transparent' : `1px solid ${currentTheme.border.default}`,
              color: active ? getOptimalTextColor(currentTheme.primary) : currentTheme.text.primary,
              boxShadow: active ? `0 4px 16px ${currentTheme.primary}45` : 'none',
            }}
          >
            <span
              className="pet-selector-avatar"
              style={{
                background: active ? 'rgba(0, 0, 0, 0.18)' : `${currentTheme.primary}14`,
                filter: p.isAlive ? undefined : 'grayscale(1)',
              }}
            >
              {portrait && <img src={portrait} alt="" draggable={false} />}
            </span>
            <span className="pet-selector-text">
              {p.name}
              <span className="pet-selector-level">Lv {p.level}</span>
            </span>
          </motion.button>
        );
      })}

      {/* Add new pet */}
      {canAddNewPet ? (
        <motion.button
          whileTap={tapScale}
          whileHover={{ scale: 1.05 }}
          onClick={onOpenCreateModal}
          className="pet-selector-add-btn"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            color: getOptimalTextColor(currentTheme.primary),
            boxShadow: `0 4px 15px ${currentTheme.primary}40`,
          }}
        >
          +
        </motion.button>
      ) : (
        <button
          className="pet-selector-locked"
          style={{
            background: currentTheme.background.surface,
            border: `1px dashed ${currentTheme.border.default}`,
            color: currentTheme.text.muted,
            cursor: 'default',
          }}
          disabled
        >
          {t('Neues Pet ab Lv.15')}
        </button>
      )}
    </motion.div>
  );
});
