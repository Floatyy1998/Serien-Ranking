/**
 * PetCustomization - Color picker and accessory inventory
 */

import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import {
  PET_COLORS,
  ACCESSORIES,
  RARITY_COLORS,
  RARITY_LABELS,
  getAccessoryRarity,
  PET_BACKGROUNDS,
  getBackgroundRarity,
} from '../../types/pet.types';
import type { Pet, AccessoryRarity } from '../../types/pet.types';
import './PetsPage.css';

interface PetCustomizationProps {
  pet: Pet;
  activeColorBorder: string | null;
  onChangeColor: (color: string) => void;
  onToggleAccessory: (accessoryId: string) => void;
  onEquipBackground: (backgroundId: string | null) => void;
}

const rarityOrder: AccessoryRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

export const PetCustomization = memo(function PetCustomization({
  pet,
  activeColorBorder,
  onChangeColor,
  onToggleAccessory,
  onEquipBackground,
}: PetCustomizationProps) {
  const { currentTheme } = useTheme();

  const ownedBackgrounds = [...(pet.unlockedBackgrounds || [])]
    .filter((id) => PET_BACKGROUNDS[id])
    .sort((a, b) => {
      const ra = rarityOrder.indexOf(getBackgroundRarity(a));
      const rb = rarityOrder.indexOf(getBackgroundRarity(b));
      return ra - rb;
    });

  // Sort pet's accessories by rarity (best first)
  const sortedAccessories = [...(pet.accessories || [])].sort((a, b) => {
    const ra = rarityOrder.indexOf(getAccessoryRarity(a.id));
    const rb = rarityOrder.indexOf(getAccessoryRarity(b.id));
    return ra - rb;
  });

  const equippedCount = sortedAccessories.filter((a) => a.equipped).length;

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

      {/* Accessories Inventory */}
      <div
        className="pet-customization-section"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h2 className="pet-customization-title" style={{ color: currentTheme.text.primary }}>
          Accessoires
          <span
            style={{
              fontSize: '0.75rem',
              color: currentTheme.text.secondary,
              marginLeft: 8,
              fontWeight: 400,
            }}
          >
            {sortedAccessories.length}
            {equippedCount > 0 ? ' \u00B7 1 getragen' : ''}
          </span>
        </h2>
        {sortedAccessories.length === 0 ? (
          <p
            style={{
              color: currentTheme.text.secondary,
              fontSize: '0.85rem',
              textAlign: 'center',
              padding: '12px 0',
            }}
          >
            Schau Episoden um Accessoires zu finden!
          </p>
        ) : (
          <div className="pet-accessories-grid">
            {sortedAccessories.map((accessory) => {
              const rarity = getAccessoryRarity(accessory.id);
              const rarityColor = RARITY_COLORS[rarity];
              const def = ACCESSORIES[accessory.id];

              return (
                <motion.button
                  key={`${accessory.id}-${accessory.equipped}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleAccessory(accessory.id)}
                  className="pet-accessory-btn"
                  title={`${def?.name || accessory.name} (${RARITY_LABELS[rarity]})`}
                  style={{
                    background: accessory.equipped
                      ? `linear-gradient(135deg, ${rarityColor}30, ${rarityColor}15)`
                      : currentTheme.background.default,
                    border: accessory.equipped
                      ? `2px solid ${rarityColor}`
                      : `1px solid ${currentTheme.border.default}`,
                    color: currentTheme.text.primary,
                    boxShadow: accessory.equipped ? `0 4px 12px ${rarityColor}40` : 'none',
                    position: 'relative',
                  }}
                >
                  {def?.icon || accessory.icon}
                  {/* Rarity dot */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      right: 3,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: rarityColor,
                    }}
                  />
                  {/* New badge */}
                  {accessory.isNew && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: currentTheme.primary,
                        color: '#fff',
                        fontSize: '8px',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '6px',
                        lineHeight: '12px',
                        letterSpacing: '0.3px',
                      }}
                    >
                      NEU
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Backgrounds Inventory */}
      <div
        className="pet-customization-section"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          marginTop: 16,
        }}
      >
        <h2 className="pet-customization-title" style={{ color: currentTheme.text.primary }}>
          Hintergründe
          <span
            style={{
              fontSize: '0.75rem',
              color: currentTheme.text.secondary,
              marginLeft: 8,
              fontWeight: 400,
            }}
          >
            {ownedBackgrounds.length}
            {pet.equippedBackground ? ' \u00B7 1 aktiv' : ''}
          </span>
        </h2>
        {ownedBackgrounds.length === 0 ? (
          <p
            style={{
              color: currentTheme.text.secondary,
              fontSize: '0.85rem',
              textAlign: 'center',
              padding: '12px 0',
            }}
          >
            Öffne Mystery Boxen oder drehe das Glücksrad um Hintergründe zu finden!
          </p>
        ) : (
          <div className="pet-backgrounds-grid">
            {/* Default / none */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onEquipBackground(null)}
              className="pet-background-btn"
              title="Standard"
              style={{
                background: currentTheme.background.default,
                border: !pet.equippedBackground
                  ? `2px solid ${currentTheme.primary}`
                  : `1px solid ${currentTheme.border.default}`,
                boxShadow: !pet.equippedBackground
                  ? `0 4px 12px ${currentTheme.primary}40`
                  : 'none',
                color: currentTheme.text.secondary,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700 }}>Standard</span>
            </motion.button>
            {ownedBackgrounds.map((bgId) => {
              const def = PET_BACKGROUNDS[bgId];
              const rarity = def.rarity;
              const rarityColor = RARITY_COLORS[rarity];
              const isEquipped = pet.equippedBackground === bgId;

              return (
                <motion.button
                  key={bgId}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEquipBackground(isEquipped ? null : bgId)}
                  className={`pet-background-btn${def.animationClass ? ` ${def.animationClass}` : ''}`}
                  title={`${def.name} (${RARITY_LABELS[rarity]})`}
                  style={{
                    background: def.background,
                    border: isEquipped
                      ? `2px solid ${rarityColor}`
                      : `1px solid ${currentTheme.border.default}`,
                    boxShadow: isEquipped ? `0 4px 16px ${rarityColor}60` : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {def.overlay && (
                    <span
                      className="pet-background-btn-overlay"
                      style={{ background: def.overlay }}
                    />
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: rarityColor,
                      boxShadow: `0 0 6px ${rarityColor}`,
                    }}
                  />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
});
