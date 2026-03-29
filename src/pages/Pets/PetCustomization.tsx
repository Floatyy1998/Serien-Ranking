/**
 * PetCustomization - Color picker and accessory grid
 */

import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { ACCESSORIES, PET_COLORS } from '../../types/pet.types';
import type { Pet } from '../../types/pet.types';
import './PetsPage.css';

interface PetCustomizationProps {
  pet: Pet;
  activeColorBorder: string | null;
  onChangeColor: (color: string) => void;
  onToggleAccessory: (accessoryId: string) => void;
}

export const PetCustomization = memo(function PetCustomization({
  pet,
  activeColorBorder,
  onChangeColor,
  onToggleAccessory,
}: PetCustomizationProps) {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="pet-customization"
    >
      {/* Colors */}
      <div
        className="pet-customization-section pet-customization-section--colors"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h2 className="pet-customization-title" style={{ color: currentTheme.text.primary }}>
          Farben
        </h2>
        <div className="pet-colors-grid">
          {Object.entries(PET_COLORS).map(([colorKey, colorValue]) => {
            const currentActive = activeColorBorder || pet.color;
            const isSelected = currentActive === colorKey;
            return (
              <motion.button
                key={`${colorKey}-${activeColorBorder}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onChangeColor(colorKey)}
                className="pet-color-btn"
                style={{
                  background: colorValue,
                  border: isSelected
                    ? `3px solid ${currentTheme.primary}`
                    : `2px solid ${currentTheme.border.default}`,
                  boxShadow: isSelected
                    ? `0 0 20px ${currentTheme.primary}60, 0 4px 12px ${colorValue}40`
                    : `0 4px 12px ${colorValue}30`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Accessories */}
      <div
        className="pet-customization-section"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h2 className="pet-customization-title" style={{ color: currentTheme.text.primary }}>
          Accessoires
        </h2>
        <div className="pet-accessories-grid">
          {Object.entries(ACCESSORIES)
            .slice(0, 8)
            .map(([accessoryId, accessory]) => {
              const isEquipped = pet.accessories?.some(
                (acc) => acc.id === accessoryId && acc.equipped
              );
              return (
                <motion.button
                  key={`${accessoryId}-${isEquipped}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleAccessory(accessoryId)}
                  className="pet-accessory-btn"
                  style={{
                    background: isEquipped
                      ? `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.primary}15)`
                      : currentTheme.background.default,
                    border: isEquipped
                      ? `2px solid ${currentTheme.primary}`
                      : `1px solid ${currentTheme.border.default}`,
                    color: currentTheme.text.primary,
                    boxShadow: isEquipped ? `0 4px 12px ${currentTheme.primary}30` : 'none',
                  }}
                >
                  {accessory.icon}
                </motion.button>
              );
            })}
        </div>
      </div>
    </motion.div>
  );
});
