/**
 * ThemePage - Premium Theme Customization
 * Beautiful theme editor with live preview
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  CloudOff,
  Refresh,
  Brightness6,
  ColorLens,
  Wallpaper,
  Check,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader } from '../../components/ui';

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
  {
    key: 'surfaceColor',
    name: 'Surface',
    icon: <Wallpaper />,
    description: 'Kartenfarben',
  },
  {
    key: 'accentColor',
    name: 'Accent',
    icon: <Palette />,
    description: 'Akzentfarbe',
  },
];

export const ThemePage = () => {
  const { userConfig, updateTheme, resetTheme, currentTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'colors' | 'sync'>('colors');
  const [selectedColor, setSelectedColor] = useState<string>('primaryColor');
  const [colorValue, setColorValue] = useState<string>(userConfig.primaryColor);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setColorValue((userConfig[selectedColor as keyof typeof userConfig] as string) || '#00fed7');
  }, [userConfig, selectedColor]);

  const handleColorChange = (value: string) => {
    setColorValue(value);
    updateTheme({
      [selectedColor]: value,
    });
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
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
        paddingBottom: '100px',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}40, transparent),
            radial-gradient(ellipse 60% 40% at 20% 30%, ${userConfig.accentColor}20, transparent),
            radial-gradient(ellipse 50% 30% at 80% 20%, #8b5cf615, transparent)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <PageHeader
        title="Design"
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
      />

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex',
          gap: '10px',
          padding: '0 20px 20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {[
          { key: 'colors', label: 'Farben', icon: <Palette style={{ fontSize: '18px' }} /> },
          { key: 'sync', label: 'Einstellungen', icon: <CloudOff style={{ fontSize: '18px' }} /> },
        ].map((tab) => (
          <motion.button
            key={tab.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.key as 'colors' | 'sync')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              background:
                activeTab === tab.key
                  ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                  : currentTheme.background.surface,
              border: activeTab === tab.key ? 'none' : `1px solid ${currentTheme.border.default}`,
              borderRadius: '14px',
              color: activeTab === tab.key ? 'white' : currentTheme.text.secondary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: activeTab === tab.key ? `0 4px 15px ${currentTheme.primary}40` : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'colors' && (
            <motion.div
              key="colors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Preset Themes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '16px',
                }}
              >
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 16px 0',
                    color: currentTheme.text.primary,
                  }}
                >
                  Themes
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '10px',
                  }}
                >
                  {presetThemes.map((preset, index) => {
                    const isActive = isPresetActive(preset);
                    return (
                      <motion.button
                        key={preset.name}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => applyPresetTheme(preset)}
                        style={{
                          padding: '12px 8px',
                          background: isActive
                            ? `linear-gradient(135deg, ${preset.primaryColor}30, ${preset.primaryColor}15)`
                            : currentTheme.background.default,
                          border: isActive
                            ? `2px solid ${preset.primaryColor}`
                            : `1px solid ${currentTheme.border.default}`,
                          borderRadius: '14px',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        {isActive && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check style={{ fontSize: '12px', color: 'white' }} />
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '4px',
                            marginBottom: '8px',
                          }}
                        >
                          {[
                            preset.primaryColor,
                            preset.backgroundColor,
                            preset.surfaceColor,
                            preset.accentColor,
                          ].map((color, i) => (
                            <div
                              key={i}
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: color,
                                border: `1px solid ${currentTheme.border.default}`,
                              }}
                            />
                          ))}
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isActive ? preset.primaryColor : currentTheme.text.secondary,
                          }}
                        >
                          {preset.name}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Color Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '16px',
                }}
              >
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 16px 0',
                    color: currentTheme.text.primary,
                  }}
                >
                  Farben anpassen
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colorCategories.map((category) => {
                    const isActive = selectedColor === category.key;
                    const categoryColor =
                      (userConfig[category.key as keyof typeof userConfig] as string) || '#667eea';
                    return (
                      <motion.button
                        key={category.key}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedColor(category.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px',
                          background: isActive
                            ? `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}10)`
                            : currentTheme.background.default,
                          border: isActive
                            ? `2px solid ${categoryColor}`
                            : `1px solid ${currentTheme.border.default}`,
                          borderRadius: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {category.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: isActive ? categoryColor : currentTheme.text.primary,
                            }}
                          >
                            {category.name}
                          </h3>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '11px',
                              color: currentTheme.text.muted,
                            }}
                          >
                            {category.description}
                          </p>
                        </div>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: categoryColor,
                            border: `2px solid ${currentTheme.border.default}`,
                          }}
                        />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Color Picker */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '20px',
                  padding: '20px',
                }}
              >
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 16px 0',
                    color: currentTheme.text.primary,
                  }}
                >
                  {colorCategories.find((c) => c.key === selectedColor)?.name} Farbe
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '60px',
                      height: '60px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: `2px solid ${currentTheme.border.default}`,
                    }}
                  >
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => handleColorChange(e.target.value)}
                      style={{
                        position: 'absolute',
                        inset: '-10px',
                        width: '80px',
                        height: '80px',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    value={colorValue}
                    onChange={(e) => handleColorChange(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      background: currentTheme.background.default,
                      border: `1px solid ${currentTheme.border.default}`,
                      borderRadius: '12px',
                      color: currentTheme.text.primary,
                      fontSize: '15px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                    placeholder="#00fed7"
                  />
                </div>

                {/* Preview */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${colorValue}20, ${colorValue}10)`,
                    border: `1px solid ${colorValue}40`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${colorValue}, ${colorValue}cc)`,
                        boxShadow: `0 4px 12px ${colorValue}40`,
                      }}
                    />
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          fontWeight: 600,
                          color: colorValue,
                        }}
                      >
                        Vorschau
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: currentTheme.text.muted }}>
                        So sieht die Farbe aus
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'sync' && (
            <motion.div
              key="sync"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Storage Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '16px',
                }}
              >
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 16px 0',
                    color: currentTheme.text.primary,
                  }}
                >
                  Speicherung
                </h2>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: currentTheme.background.default,
                    borderRadius: '14px',
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.primary}10)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloudOff style={{ fontSize: '22px', color: currentTheme.primary }} />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: currentTheme.text.primary,
                      }}
                    >
                      Lokaler Speicher
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: currentTheme.text.muted }}>
                      Themes werden lokal in Ihrem Browser gespeichert
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Current Theme Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '16px',
                }}
              >
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 16px 0',
                    color: currentTheme.text.primary,
                  }}
                >
                  Aktuelles Theme
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colorCategories.map((category) => {
                    const color =
                      (userConfig[category.key as keyof typeof userConfig] as string) || '#667eea';
                    return (
                      <div
                        key={category.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: currentTheme.background.default,
                          borderRadius: '10px',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: currentTheme.text.secondary }}>
                          {category.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '6px',
                              backgroundColor: color,
                              border: `1px solid ${currentTheme.border.default}`,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              color: currentTheme.text.muted,
                            }}
                          >
                            {color}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Reset */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '20px',
                  padding: '20px',
                }}
              >
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: '0 0 16px 0',
                    color: currentTheme.text.primary,
                  }}
                >
                  Zurücksetzen
                </h2>
                <AnimatePresence mode="wait">
                  {!showResetConfirm ? (
                    <motion.button
                      key="reset-button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowResetConfirm(true)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '16px',
                        background: `linear-gradient(135deg, ${currentTheme.status.warning}15, ${currentTheme.status.warning}08)`,
                        border: `1px solid ${currentTheme.status.warning}30`,
                        borderRadius: '14px',
                        color: currentTheme.status.warning,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Refresh style={{ fontSize: '22px' }} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                          Theme zurücksetzen
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '12px',
                            opacity: 0.8,
                          }}
                        >
                          Setzt alle Farben auf Standard
                        </p>
                      </div>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="confirm-buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ display: 'flex', gap: '10px' }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResetTheme}
                        style={{
                          flex: 1,
                          padding: '14px',
                          background: `linear-gradient(135deg, ${currentTheme.status.error}, #ef4444)`,
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Ja, zurücksetzen
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowResetConfirm(false)}
                        style={{
                          flex: 1,
                          padding: '14px',
                          background: currentTheme.background.default,
                          border: `1px solid ${currentTheme.border.default}`,
                          borderRadius: '12px',
                          color: currentTheme.text.secondary,
                          fontSize: '14px',
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
