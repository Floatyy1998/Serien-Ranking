/**
 * PetCustomization - Apple-style segmented control for Farben, Accessoires, Hintergruende
 * mit Rarity-Filter-Chips fuer schnelles Browsen grosser Inventare.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PET_COLORS, RARITY_COLORS, RARITY_LABELS } from '../../types/pet.types';
import { ACCESSORIES, getAccessoryRarity } from '../../components/pet/data/accessories';
import { PET_BACKGROUNDS, getBackgroundRarity } from '../../components/pet/data/petBackgrounds';
import type { Pet, AccessoryRarity } from '../../types/pet.types';
import './PetsPage.css';
import { tapScale, tapScaleTight } from '../../lib/motion';

interface PetCustomizationProps {
  pet: Pet;
  activeColorBorder: string | null;
  onChangeColor: (color: string) => void;
  onToggleAccessory: (accessoryId: string) => void;
  onEquipBackground: (backgroundId: string | null) => void;
}

type Tab = 'colors' | 'accessories' | 'backgrounds';
type RarityFilter = AccessoryRarity | 'all';

const rarityOrder: AccessoryRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
const filterOrder: RarityFilter[] = ['all', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

const panelMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: 'easeOut' as const },
};

export const PetCustomization = memo(function PetCustomization({
  pet,
  activeColorBorder,
  onChangeColor,
  onToggleAccessory,
  onEquipBackground,
}: PetCustomizationProps) {
  const { currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('colors');
  const [accessoryFilter, setAccessoryFilter] = useState<RarityFilter>('all');
  const [backgroundFilter, setBackgroundFilter] = useState<RarityFilter>('all');

  const sortedAccessories = useMemo(
    () =>
      [...(pet.accessories || [])].sort((a, b) => {
        const ra = rarityOrder.indexOf(getAccessoryRarity(a.id));
        const rb = rarityOrder.indexOf(getAccessoryRarity(b.id));
        return ra - rb;
      }),
    [pet.accessories]
  );

  const ownedBackgrounds = useMemo(
    () =>
      [...(pet.unlockedBackgrounds || [])]
        .filter((id) => PET_BACKGROUNDS[id])
        .sort((a, b) => {
          const ra = rarityOrder.indexOf(getBackgroundRarity(a));
          const rb = rarityOrder.indexOf(getBackgroundRarity(b));
          return ra - rb;
        }),
    [pet.unlockedBackgrounds]
  );

  const accessoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: sortedAccessories.length,
      legendary: 0,
      epic: 0,
      rare: 0,
      uncommon: 0,
      common: 0,
    };
    sortedAccessories.forEach((a) => {
      counts[getAccessoryRarity(a.id)]++;
    });
    return counts;
  }, [sortedAccessories]);

  const backgroundCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: ownedBackgrounds.length,
      legendary: 0,
      epic: 0,
      rare: 0,
      uncommon: 0,
      common: 0,
    };
    ownedBackgrounds.forEach((id) => {
      counts[getBackgroundRarity(id)]++;
    });
    return counts;
  }, [ownedBackgrounds]);

  const filteredAccessories =
    accessoryFilter === 'all'
      ? sortedAccessories
      : sortedAccessories.filter((a) => getAccessoryRarity(a.id) === accessoryFilter);

  const filteredBackgrounds =
    backgroundFilter === 'all'
      ? ownedBackgrounds
      : ownedBackgrounds.filter((id) => getBackgroundRarity(id) === backgroundFilter);

  const equippedAccessoryCount = sortedAccessories.filter((a) => a.equipped).length;
  const tabs: { id: Tab; label: string; count?: number; subline?: string }[] = [
    { id: 'colors', label: 'Farben', count: Object.keys(PET_COLORS).length },
    {
      id: 'accessories',
      label: 'Accessoires',
      count: sortedAccessories.length,
      subline: equippedAccessoryCount > 0 ? `${equippedAccessoryCount} getragen` : undefined,
    },
    {
      id: 'backgrounds',
      label: 'Hintergründe',
      count: ownedBackgrounds.length,
      subline: pet.equippedBackground ? '1 aktiv' : undefined,
    },
  ];

  const renderRarityChips = (
    filter: RarityFilter,
    counts: Record<string, number>,
    onChange: (next: RarityFilter) => void
  ) => (
    <div className="pet-rarity-filter">
      {filterOrder.map((r) => {
        const isActive = filter === r;
        const color = r === 'all' ? currentTheme.primary : RARITY_COLORS[r];
        const label = r === 'all' ? 'Alle' : RARITY_LABELS[r];
        const count = counts[r] ?? 0;
        const disabled = r !== 'all' && count === 0;
        return (
          <button
            key={r}
            type="button"
            onClick={() => !disabled && onChange(r)}
            disabled={disabled}
            className={`pet-rarity-chip${isActive ? ' pet-rarity-chip--active' : ''}`}
            style={
              isActive
                ? {
                    background: color,
                    borderColor: color,
                    color: '#fff',
                    boxShadow: `0 2px 12px ${color}55`,
                  }
                : {
                    borderColor: `${color}55`,
                    color: disabled ? currentTheme.text.muted : currentTheme.text.secondary,
                    opacity: disabled ? 0.4 : 1,
                  }
            }
          >
            <span>{label}</span>
            <span className="pet-rarity-chip-count">{count}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="pet-customization"
    >
      {/* Segmented Control */}
      <div
        className="pet-tabs"
        role="tablist"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`pet-tab${isActive ? ' pet-tab--active' : ''}`}
              style={{
                color: isActive ? currentTheme.text.primary : currentTheme.text.secondary,
              }}
            >
              {isActive && (
                <motion.span
                  layoutId="pet-tab-indicator"
                  className="pet-tab-indicator"
                  style={{
                    background: currentTheme.background.default,
                    boxShadow: `0 2px 10px ${currentTheme.primary}25, 0 1px 3px rgba(0,0,0,0.15)`,
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="pet-tab-content">
                <span className="pet-tab-label">{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className="pet-tab-count"
                    style={{ color: isActive ? currentTheme.primary : currentTheme.text.muted }}
                  >
                    {tab.count}
                    {tab.subline ? ` · ${tab.subline}` : ''}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="pet-tab-panels">
        <AnimatePresence mode="wait">
          {activeTab === 'colors' && (
            <motion.section
              key="colors"
              {...panelMotion}
              className="pet-tab-panel"
              style={{
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <div className="pet-colors-grid">
                {Object.entries(PET_COLORS).map(([colorKey, colorValue]) => {
                  const currentActive = activeColorBorder || pet.color;
                  const isSelected = currentActive === colorKey;
                  return (
                    <motion.button
                      key={`${colorKey}-${activeColorBorder}`}
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={tapScaleTight}
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
            </motion.section>
          )}

          {activeTab === 'accessories' && (
            <motion.section
              key="accessories"
              {...panelMotion}
              className="pet-tab-panel"
              style={{
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              {sortedAccessories.length === 0 ? (
                <p className="pet-empty-state" style={{ color: currentTheme.text.secondary }}>
                  Schau Episoden, um Accessoires zu finden!
                </p>
              ) : (
                <>
                  {renderRarityChips(accessoryFilter, accessoryCounts, setAccessoryFilter)}
                  {filteredAccessories.length === 0 ? (
                    <p className="pet-empty-state" style={{ color: currentTheme.text.muted }}>
                      Noch keine {RARITY_LABELS[accessoryFilter as AccessoryRarity]} entdeckt.
                    </p>
                  ) : (
                    <div className="pet-accessories-grid">
                      {filteredAccessories.map((accessory) => {
                        const rarity = getAccessoryRarity(accessory.id);
                        const rarityColor = RARITY_COLORS[rarity];
                        const def = ACCESSORIES[accessory.id];
                        const equipped = accessory.equipped;
                        return (
                          <motion.button
                            key={`${accessory.id}-${equipped}`}
                            type="button"
                            whileHover={{ scale: 1.06, y: -2 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => onToggleAccessory(accessory.id)}
                            className={`pet-accessory-btn${equipped ? ' pet-accessory-btn--equipped' : ''}`}
                            title={`${def?.name || accessory.name} (${RARITY_LABELS[rarity]})`}
                            style={{
                              background: equipped
                                ? `linear-gradient(135deg, ${rarityColor}38, ${rarityColor}15)`
                                : currentTheme.background.default,
                              border: equipped
                                ? `2px solid ${rarityColor}`
                                : `1px solid ${currentTheme.border.default}`,
                              color: currentTheme.text.primary,
                              boxShadow: equipped
                                ? `0 6px 20px ${rarityColor}40, inset 0 0 0 1px ${rarityColor}30`
                                : 'none',
                            }}
                          >
                            <span className="pet-accessory-icon">
                              {def?.icon || accessory.icon}
                            </span>
                            <span
                              className="pet-rarity-strip"
                              style={{ background: rarityColor }}
                            />
                            {accessory.isNew && (
                              <span
                                className="pet-new-badge"
                                style={{ background: currentTheme.primary }}
                              >
                                NEU
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </motion.section>
          )}

          {activeTab === 'backgrounds' && (
            <motion.section
              key="backgrounds"
              {...panelMotion}
              className="pet-tab-panel"
              style={{
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              {ownedBackgrounds.length === 0 ? (
                <p className="pet-empty-state" style={{ color: currentTheme.text.secondary }}>
                  Öffne Mystery Boxen oder dreh das Glücksrad, um Hintergründe zu finden!
                </p>
              ) : (
                <>
                  {renderRarityChips(backgroundFilter, backgroundCounts, setBackgroundFilter)}
                  <div className="pet-backgrounds-grid">
                    {/* Standard (only on "all") */}
                    {backgroundFilter === 'all' && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={tapScale}
                        onClick={() => onEquipBackground(null)}
                        className={`pet-background-btn pet-background-btn--default${!pet.equippedBackground ? ' pet-background-btn--equipped' : ''}`}
                        title="Standard"
                        style={{
                          background: currentTheme.background.default,
                          border: !pet.equippedBackground
                            ? `2px solid ${currentTheme.primary}`
                            : `1px solid ${currentTheme.border.default}`,
                          boxShadow: !pet.equippedBackground
                            ? `0 6px 20px ${currentTheme.primary}40`
                            : 'none',
                          color: currentTheme.text.secondary,
                        }}
                      >
                        <span>Standard</span>
                      </motion.button>
                    )}
                    {filteredBackgrounds.length === 0 && backgroundFilter !== 'all' ? (
                      <p
                        className="pet-empty-state pet-empty-state--inline"
                        style={{ color: currentTheme.text.muted }}
                      >
                        Noch keine {RARITY_LABELS[backgroundFilter as AccessoryRarity]} entdeckt.
                      </p>
                    ) : (
                      filteredBackgrounds.map((bgId) => {
                        const def = PET_BACKGROUNDS[bgId];
                        const rarity = def.rarity;
                        const rarityColor = RARITY_COLORS[rarity];
                        const isEquipped = pet.equippedBackground === bgId;
                        return (
                          <motion.button
                            key={bgId}
                            type="button"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={tapScale}
                            onClick={() => onEquipBackground(isEquipped ? null : bgId)}
                            className={`pet-background-btn${def.animationClass ? ` ${def.animationClass}` : ''}${isEquipped ? ' pet-background-btn--equipped' : ''}`}
                            title={`${def.name} (${RARITY_LABELS[rarity]})`}
                            style={{
                              background: def.background,
                              border: isEquipped
                                ? `2px solid ${rarityColor}`
                                : `1px solid ${currentTheme.border.default}`,
                              boxShadow: isEquipped ? `0 8px 24px ${rarityColor}60` : 'none',
                            }}
                          >
                            {def.overlay && (
                              <span
                                className="pet-background-btn-overlay"
                                style={{ background: def.overlay }}
                              />
                            )}
                            <span
                              className="pet-rarity-strip"
                              style={{ background: rarityColor }}
                            />
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
