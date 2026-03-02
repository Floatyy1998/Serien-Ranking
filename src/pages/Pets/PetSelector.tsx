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
  canAddSecondPet: boolean;
  onSelectPet: (index: number) => void;
  onOpenCreateModal: () => void;
}

export const PetSelector = memo(function PetSelector({
  pets,
  selectedPetIndex,
  canAddSecondPet,
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
                ? `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`
                : currentTheme.background.surface,
            border: idx === selectedPetIndex ? 'none' : `1px solid ${currentTheme.border.default}`,
            color: idx === selectedPetIndex ? '#fff' : currentTheme.text.primary,
            boxShadow: idx === selectedPetIndex ? `0 4px 15px ${currentTheme.primary}40` : 'none',
          }}
        >
          {p.name}
          <span className="pet-selector-level">Lv.{p.level}</span>
        </motion.button>
      ))}

      {/* Add second pet */}
      {pets.length < 2 &&
        (canAddSecondPet ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            onClick={onOpenCreateModal}
            className="pet-selector-add-btn"
            style={{
              background: `linear-gradient(135deg, #ec4899, var(--theme-secondary-gradient, #8b5cf6))`,
              color: '#fff',
              boxShadow: '0 4px 15px rgba(236,72,153,0.35)',
            }}
          >
            +
          </motion.button>
        ) : (
          <div
            className="pet-selector-locked"
            style={{
              background: currentTheme.background.surface,
              border: `1px dashed ${currentTheme.border.default}`,
              color: currentTheme.text.muted,
            }}
          >
            2. Pet ab Lv.15
          </div>
        ))}
    </motion.div>
  );
});
