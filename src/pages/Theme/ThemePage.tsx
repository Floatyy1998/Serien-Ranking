/**
 * ThemePage - Theme Customization
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Refresh, Check, ColorLens, Brightness6, Wallpaper } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader, PageLayout } from '../../components/ui';

const presetThemes = [
  {
    name: 'Ocean',
    primaryColor: '#00fed7',
    backgroundColor: '#000814',
    surfaceColor: '#001d3d',
    accentColor: '#ffd60a',
  },
  {
    name: 'Fire',
    primaryColor: '#ff6b6b',
    backgroundColor: '#2d1b2e',
    surfaceColor: '#5d737e',
    accentColor: '#feca57',
  },
  {
    name: 'Sakura',
    primaryColor: '#ff9ff3',
    backgroundColor: '#1a0e1a',
    surfaceColor: '#3d2b3d',
    accentColor: '#54a0ff',
  },
  {
    name: 'Diamond',
    primaryColor: '#dfe6e9',
    backgroundColor: '#2d3436',
    surfaceColor: '#636e72',
    accentColor: '#00b894',
  },
  {
    name: 'Forest',
    primaryColor: '#55efc4',
    backgroundColor: '#2d3436',
    surfaceColor: '#636e72',
    accentColor: '#fdcb6e',
  },
  {
    name: 'Electric',
    primaryColor: '#6c5ce7',
    backgroundColor: '#2d3436',
    surfaceColor: '#636e72',
    accentColor: '#a29bfe',
  },
  {
    name: 'Unicorn',
    primaryColor: '#fd79a8',
    backgroundColor: '#2d3436',
    surfaceColor: '#636e72',
    accentColor: '#00cec9',
  },
  {
    name: 'Sunset',
    primaryColor: '#e17055',
    backgroundColor: '#2d3436',
    surfaceColor: '#636e72',
    accentColor: '#fdcb6e',
  },
];

const colorCategories = [
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
  { key: 'surfaceColor', name: 'Surface', icon: <Wallpaper />, description: 'Kartenfarben' },
  { key: 'accentColor', name: 'Accent', icon: <Palette />, description: 'Akzentfarbe' },
];

export const ThemePage = () => {
  const { userConfig, updateTheme, resetTheme, currentTheme } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleColorChange = (key: string, value: string) => {
    updateTheme({ [key]: value });
  };

  const applyPresetTheme = (preset: (typeof presetThemes)[0]) => {
    if (navigator.vibrate) navigator.vibrate(10);
    updateTheme({
      primaryColor: preset.primaryColor,
      backgroundColor: preset.backgroundColor,
      surfaceColor: preset.surfaceColor,
      accentColor: preset.accentColor,
    });
  };

  const handleResetTheme = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    resetTheme();
    setShowResetConfirm(false);
  };

  const isPresetActive = (preset: (typeof presetThemes)[0]) => {
    return (
      userConfig.primaryColor === preset.primaryColor &&
      userConfig.backgroundColor === preset.backgroundColor &&
      userConfig.surfaceColor === preset.surfaceColor &&
      userConfig.accentColor === preset.accentColor
    );
  };

  return (
    <PageLayout
      gradientColors={[currentTheme.primary, '#8b5cf6']}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <PageHeader
        title="Design"
        icon={<Palette style={{ fontSize: 28 }} />}
        gradientFrom={currentTheme.primary}
        gradientTo="#8b5cf6"
      />

      <div
        style={{
          padding: '0 20px',
          paddingBottom: 120,
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Preset Themes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: '0 0 14px 0',
              color: currentTheme.text.primary,
            }}
          >
            Themes
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {presetThemes.map((preset, index) => {
              const isActive = isPresetActive(preset);
              return (
                <motion.button
                  key={preset.name}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => applyPresetTheme(preset)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    background: isActive
                      ? `linear-gradient(135deg, ${preset.primaryColor}25, ${preset.primaryColor}10)`
                      : currentTheme.background.default,
                    border: isActive
                      ? `2px solid ${preset.primaryColor}`
                      : `1px solid ${currentTheme.border.default}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    position: 'relative',
                    textAlign: 'left',
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: currentTheme.status.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check style={{ fontSize: 11, color: 'white' }} />
                    </div>
                  )}
                  {/* Color dots */}
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {[
                      preset.primaryColor,
                      preset.backgroundColor,
                      preset.surfaceColor,
                      preset.accentColor,
                    ].map((color, i) => (
                      <div
                        key={i}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: `1px solid ${currentTheme.border.default}`,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive ? preset.primaryColor : currentTheme.text.primary,
                    }}
                  >
                    {preset.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Color Editors */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: '0 0 14px 0',
              color: currentTheme.text.primary,
            }}
          >
            Farben anpassen
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {colorCategories.map((category) => {
              const color =
                (userConfig[category.key as keyof typeof userConfig] as string) || '#667eea';
              return (
                <div
                  key={category.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: currentTheme.background.default,
                    borderRadius: 14,
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                >
                  {/* Color picker */}
                  <div
                    style={{
                      position: 'relative',
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: `2px solid ${currentTheme.border.default}`,
                    }}
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(category.key, e.target.value)}
                      style={{
                        position: 'absolute',
                        inset: -8,
                        width: 56,
                        height: 56,
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 600,
                        color: currentTheme.text.primary,
                      }}
                    >
                      {category.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: 11, color: currentTheme.text.muted }}>
                      {category.description}
                    </p>
                  </div>
                  {/* Hex value */}
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => handleColorChange(category.key, e.target.value)}
                    style={{
                      width: 80,
                      padding: '6px 8px',
                      background: currentTheme.background.surface,
                      border: `1px solid ${currentTheme.border.default}`,
                      borderRadius: 8,
                      color: currentTheme.text.secondary,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      outline: 'none',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Reset */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: 20,
            padding: 20,
          }}
        >
          <AnimatePresence mode="wait">
            {!showResetConfirm ? (
              <motion.button
                key="reset-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowResetConfirm(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  background: `${currentTheme.status.warning}12`,
                  border: `1px solid ${currentTheme.status.warning}30`,
                  borderRadius: 14,
                  color: currentTheme.status.warning,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Refresh style={{ fontSize: 20 }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Theme zurücksetzen</h3>
                  <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>Alle Farben auf Standard</p>
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', gap: 10 }}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResetTheme}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: currentTheme.status.error,
                    border: 'none',
                    borderRadius: 12,
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Zurücksetzen
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    flex: 1,
                    padding: 14,
                    background: currentTheme.background.default,
                    border: `1px solid ${currentTheme.border.default}`,
                    borderRadius: 12,
                    color: currentTheme.text.secondary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </PageLayout>
  );
};
