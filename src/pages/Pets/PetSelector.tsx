/**
 * PetSelector - Tab bar for switching between pets and adding new ones
 */

import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';

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

  if (pets.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pet-selector"
    >
      {pets.map((p, idx) => (
        <motion.button
          key={p.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectPet(idx)}
          className="pet-selector-btn"
          style={{
            background:
              idx === selectedPetIndex
                ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                : currentTheme.background.surface,
            border:
              idx === selectedPetIndex
                ? '1px solid transparent'
                : `1px solid ${currentTheme.border.default}`,
            color:
              idx === selectedPetIndex ? currentTheme.text.secondary : currentTheme.text.primary,
            boxShadow: idx === selectedPetIndex ? `0 0 12px ${currentTheme.primary}40` : 'none',
          }}
        >
          {p.name}
          <span className="pet-selector-level">Lv.{p.level}</span>
        </motion.button>
      ))}

      {/* Add new pet */}
      {canAddNewPet ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          onClick={onOpenCreateModal}
          className="pet-selector-add-btn"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            color: currentTheme.text.secondary,
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
          Neues Pet ab Lv.15
        </button>
      )}
    </motion.div>
  );
});
