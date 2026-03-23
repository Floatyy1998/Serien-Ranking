/**
 * PetCreationModal - Full-screen modal for creating a new pet
 */

import { motion } from 'framer-motion';
import { memo } from 'react';
import { GradientText } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PET_TYPE_NAMES, PET_TYPES } from '../../types/pet.types';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';

interface PetCreationModalProps {
  petName: string;
  selectedType: Pet['type'];
  onNameChange: (name: string) => void;
  onTypeChange: (type: Pet['type']) => void;
  onCreatePet: () => void;
}

export const PetCreationModal = memo(function PetCreationModal({
  petName,
  selectedType,
  onNameChange,
  onTypeChange,
  onCreatePet,
}: PetCreationModalProps) {
  const { currentTheme } = useTheme();

  return (
    <div className="pet-create-page" style={{ background: currentTheme.background.default }}>
      {/* Decorative Background */}
      <div
        className="pet-create-bg"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, ${currentTheme.accent}30, transparent),
            radial-gradient(ellipse 60% 40% at 80% 60%, ${currentTheme.primary}20, transparent)
          `,
        }}
      />

      <div className="pet-create-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="pet-create-card"
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <GradientText
            as="h2"
            from={currentTheme.primary}
            style={{
              fontSize: '28px',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            Erschaffe dein Pet!
          </GradientText>

          <input
            type="text"
            value={petName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Pet Name..."
            className="pet-create-input"
            style={{
              backgroundColor: currentTheme.background.default,
              border: `2px solid ${currentTheme.border.default}`,
              color: currentTheme.text.primary,
            }}
          />

          <div style={{ marginBottom: '24px' }}>
            <h2 className="pet-create-type-label" style={{ color: currentTheme.text.primary }}>
              Wähle deinen Typ:
            </h2>
            <div className="pet-create-type-grid">
              {(Object.keys(PET_TYPES) as Pet['type'][]).map((type) => (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTypeChange(type)}
                  className="pet-create-type-btn"
                  style={{
                    background:
                      selectedType === type
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                        : currentTheme.background.default,
                    border:
                      selectedType === type ? 'none' : `1px solid ${currentTheme.border.default}`,
                    color:
                      selectedType === type
                        ? currentTheme.text.secondary
                        : currentTheme.text.primary,
                    boxShadow:
                      selectedType === type ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  {PET_TYPE_NAMES[type]}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onCreatePet}
            disabled={!petName.trim()}
            className="pet-create-submit"
            style={{
              background: petName.trim()
                ? `linear-gradient(135deg, ${currentTheme.accent}, ${currentTheme.accent})`
                : currentTheme.background.default,
              color: petName.trim() ? currentTheme.text.secondary : currentTheme.text.muted,
              cursor: petName.trim() ? 'pointer' : 'not-allowed',
              boxShadow: petName.trim() ? `0 8px 24px ${currentTheme.accent}40` : 'none',
            }}
          >
            Pet erschaffen!
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
});
