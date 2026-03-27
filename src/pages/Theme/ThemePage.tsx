/**
 * ThemePage - Theme Customization (composition only)
 */

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Palette, ColorLens, Brightness6, Wallpaper, FormatColorText } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PageHeader, PageLayout } from '../../components/ui';
import { ThemePreviewCard, type PresetTheme } from './ThemePreviewCard';
import { ColorEditor, type ColorCategory } from './ColorEditor';
import { ResetSection } from './ResetSection';
import './ThemePage.css';

const presetThemes: PresetTheme[] = [
  {
    name: 'Abyss',
    primaryColor: '#00e5ff', // Electric Cyan
    backgroundColor: '#030d18', // Deep ocean black
    surfaceColor: '#060f20', // Very dark blue
    accentColor: '#7c3aed', // Deep violet
  },
  {
    name: 'Inferno',
    primaryColor: '#ff6b35', // Orange-red
    backgroundColor: '#14050a', // Deep dark warm black
    surfaceColor: '#200810', // Dark crimson-black
    accentColor: '#ffd700', // Gold
  },
  {
    name: 'Sakura',
    primaryColor: '#ff7eb3', // Vivid pink
    backgroundColor: '#0d0614', // Deep purple-black
    surfaceColor: '#160a1f', // Dark purple
    accentColor: '#7b61ff', // Indigo-violet
  },
  {
    name: 'Glacier',
    primaryColor: '#7dd3fc', // Sky blue
    backgroundColor: '#0c1220', // Deep slate
    surfaceColor: '#111828', // Dark slate
    accentColor: '#a78bfa', // Soft violet
  },
  {
    name: 'Emerald',
    primaryColor: '#10b981', // Vivid emerald
    backgroundColor: '#031209', // Deep forest black
    surfaceColor: '#051a0d', // Very dark green
    accentColor: '#f59e0b', // Amber
  },
  {
    name: 'Cosmic',
    primaryColor: '#818cf8', // Indigo
    backgroundColor: '#07040e', // Deep space black
    surfaceColor: '#0e0919', // Very dark purple
    accentColor: '#22d3ee', // Cyan
  },
  {
    name: 'Neon',
    primaryColor: '#f0abfc', // Neon pink-purple
    backgroundColor: '#0a0415', // Deep purple-black
    surfaceColor: '#110720', // Dark purple
    accentColor: '#67e8f9', // Ice cyan
  },
  {
    name: 'Ember',
    primaryColor: '#fb923c', // Amber-orange
    backgroundColor: '#100806', // Deep brown-black
    surfaceColor: '#1a0e08', // Dark brown
    accentColor: '#fbbf24', // Warm yellow
  },
];

const colorCategories: ColorCategory[] = [
  {
    key: 'primaryColor',
    name: 'Primary',
    icon: <ColorLens />,
    description: 'Hauptfarbe für Buttons',
  },
  {
    key: 'backgroundColor',
    name: 'Background',
    icon: <Brightness6 />,
    description: 'Hintergrundfarbe',
  },
  {
    key: 'textColor',
    name: 'Text',
    icon: <FormatColorText />,
    description: 'Textfarbe',
  },
  { key: 'surfaceColor', name: 'Surface', icon: <Wallpaper />, description: 'Kartenfarben' },
  { key: 'accentColor', name: 'Accent', icon: <Palette />, description: 'Akzentfarbe' },
];

export const ThemePage = () => {
  const { userConfig, updateTheme, resetTheme, currentTheme } = useTheme();

  const handleColorChange = useCallback(
    (key: string, value: string) => {
      // Nur gültige Hex-Farben ans Theme weiterleiten — verhindert Crash beim Tippen
      if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        updateTheme({ [key]: value });
      }
    },
    [updateTheme]
  );

  const applyPresetTheme = useCallback(
    (preset: PresetTheme) => {
      if (navigator.vibrate) navigator.vibrate(10);
      updateTheme({
        primaryColor: preset.primaryColor,
        backgroundColor: preset.backgroundColor,
        surfaceColor: preset.surfaceColor,
        accentColor: preset.accentColor,
      });
    },
    [updateTheme]
  );

  const isPresetActive = (preset: PresetTheme) =>
    userConfig.primaryColor === preset.primaryColor &&
    userConfig.backgroundColor === preset.backgroundColor &&
    userConfig.surfaceColor === preset.surfaceColor &&
    userConfig.accentColor === preset.accentColor;

  return (
    <PageLayout
      gradientColors={[currentTheme.primary, currentTheme.accent]}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <PageHeader
        title="Design"
        icon={<Palette style={{ fontSize: 28 }} />}
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
      />

      <div className="theme-content">
        {/* Preset Themes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="theme-section"
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h2 className="theme-section-title" style={{ color: currentTheme.text.primary }}>
            Themes
          </h2>
          <div className="theme-preset-grid">
            {presetThemes.map((preset, index) => (
              <ThemePreviewCard
                key={preset.name}
                preset={preset}
                index={index}
                isActive={isPresetActive(preset)}
                currentTheme={currentTheme}
                onApply={applyPresetTheme}
              />
            ))}
          </div>
        </motion.div>

        {/* Color Editors */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="theme-section"
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h2 className="theme-section-title" style={{ color: currentTheme.text.primary }}>
            Farben anpassen
          </h2>
          <div className="theme-color-list">
            {colorCategories.map((category) => (
              <ColorEditor
                key={category.key}
                category={category}
                color={
                  (userConfig[category.key as keyof typeof userConfig] as string) ||
                  (category.key === 'textColor' ? currentTheme.text.secondary : currentTheme.accent)
                }
                currentTheme={currentTheme}
                onColorChange={handleColorChange}
              />
            ))}
          </div>
        </motion.div>

        {/* Reset */}
        <ResetSection currentTheme={currentTheme} onReset={resetTheme} />
      </div>
    </PageLayout>
  );
};
