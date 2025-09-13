import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '../components/BackButton';
import {
  Palette,
  CloudOff,
  CloudSync,
  Refresh,
  Preview,
  Brightness6,
  ColorLens,
  Wallpaper,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import './ThemePage.css';

const presetThemes = [
  { name: 'Ocean', primaryColor: '#00fed7', backgroundColor: '#000814', surfaceColor: '#001d3d', accentColor: '#ffd60a' },
  { name: 'Fire', primaryColor: '#ff6b6b', backgroundColor: '#2d1b2e', surfaceColor: '#5d737e', accentColor: '#feca57' },
  { name: 'Sakura', primaryColor: '#ff9ff3', backgroundColor: '#1a0e1a', surfaceColor: '#3d2b3d', accentColor: '#54a0ff' },
  { name: 'Diamond', primaryColor: '#dfe6e9', backgroundColor: '#2d3436', surfaceColor: '#636e72', accentColor: '#00b894' },
  { name: 'Forest', primaryColor: '#55efc4', backgroundColor: '#2d3436', surfaceColor: '#636e72', accentColor: '#fdcb6e' },
  { name: 'Electric', primaryColor: '#6c5ce7', backgroundColor: '#2d3436', surfaceColor: '#636e72', accentColor: '#a29bfe' },
  { name: 'Unicorn', primaryColor: '#fd79a8', backgroundColor: '#2d3436', surfaceColor: '#636e72', accentColor: '#00cec9' },
  { name: 'Sunset', primaryColor: '#e17055', backgroundColor: '#2d3436', surfaceColor: '#636e72', accentColor: '#fdcb6e' },
];

const colorCategories = [
  { key: 'primaryColor', name: 'Primary', icon: <ColorLens />, description: 'Hauptfarbe für Buttons und Links' },
  { key: 'backgroundColor', name: 'Background', icon: <Brightness6 />, description: 'Hintergrundfarbe der App' },
  { key: 'surfaceColor', name: 'Surface', icon: <Wallpaper />, description: 'Kartenfarbe und Oberflächen' },
  { key: 'accentColor', name: 'Accent', icon: <Palette />, description: 'Akzentfarbe für Highlights' },
];

export const ThemePage = () => {
  const {
    userConfig,
    updateTheme,
    resetTheme,
    currentTheme,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'colors' | 'sync'>('colors');
  const [selectedColor, setSelectedColor] = useState<string>('primaryColor');
  const [colorValue, setColorValue] = useState<string>(userConfig.primaryColor);

  // Update color value when theme or selected color changes
  useEffect(() => {
    setColorValue(userConfig[selectedColor as keyof typeof userConfig] as string || '#00fed7');
  }, [userConfig, selectedColor]);


  const handleColorChange = (value: string) => {
    setColorValue(value);
    updateTheme({
      [selectedColor]: value,
    });
    // Theme wird jetzt automatisch in updateTheme gespeichert
  };

  const applyPresetTheme = (preset: typeof presetThemes[0]) => {
    if (navigator.vibrate) navigator.vibrate(10);
    updateTheme({
      primaryColor: preset.primaryColor,
      backgroundColor: preset.backgroundColor,
      surfaceColor: preset.surfaceColor,
      accentColor: preset.accentColor,
    });
    // Theme wird jetzt automatisch in updateTheme gespeichert
  };

  const handleResetTheme = () => {
    if (navigator.vibrate) navigator.vibrate(20);
    resetTheme();
  };


  return (
    <div className="mobile-theme-page">
      {/* Header */}
      <div className="theme-header" style={{
        background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`
      }}>
        <BackButton />
        <h1>Theme Anpassen</h1>
        <button className="preview-button">
          <Preview />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="theme-tabs">
        <button
          className={`theme-tab ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          <Palette />
          <span>Farben</span>
        </button>
        <button
          className={`theme-tab ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          <CloudSync />
          <span>Sync</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="theme-content">
        <AnimatePresence mode="wait">
          {activeTab === 'colors' && (
            <motion.div
              key="colors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="colors-tab"
            >
              {/* Preset Themes */}
              <div className="section">
                <h3>Vorgefertigte Themes</h3>
                <div className="preset-grid">
                  {presetThemes.map((preset, index) => (
                    <motion.button
                      key={preset.name}
                      className="preset-card"
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => applyPresetTheme(preset)}
                    >
                      <div className="preset-colors">
                        <div className="color-dot" style={{ backgroundColor: preset.primaryColor }} />
                        <div className="color-dot" style={{ backgroundColor: preset.backgroundColor }} />
                        <div className="color-dot" style={{ backgroundColor: preset.surfaceColor }} />
                        <div className="color-dot" style={{ backgroundColor: preset.accentColor }} />
                      </div>
                      <span>{preset.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Color Categories */}
              <div className="section">
                <h3>Farben Anpassen</h3>
                <div className="color-categories">
                  {colorCategories.map((category) => (
                    <button
                      key={category.key}
                      className={`category-button ${selectedColor === category.key ? 'active' : ''}`}
                      onClick={() => setSelectedColor(category.key)}
                    >
                      {category.icon}
                      <div className="category-info">
                        <span className="category-name">{category.name}</span>
                        <span className="category-desc">{category.description}</span>
                      </div>
                      <div
                        className="category-preview"
                        style={{ backgroundColor: userConfig[category.key as keyof typeof userConfig] as string || '#667eea' }}
                      />
                    </button>
                  ))}
                </div>

                {/* Color Picker */}
                <div className="color-picker-section">
                  <h4>
                    {colorCategories.find(c => c.key === selectedColor)?.name} Farbe
                  </h4>
                  <div className="color-input-container">
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={colorValue}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="hex-input"
                      placeholder="#00fed7"
                    />
                  </div>
                  <div className="color-preview">
                    <div 
                      className="preview-swatch"
                      style={{ backgroundColor: colorValue }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sync' && (
            <motion.div
              key="sync"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="sync-tab"
            >
              {/* Local Storage Info */}
              <div className="section">
                <h3>Speicherung</h3>
                <div className="sync-option">
                  <div className="sync-info">
                    <CloudOff />
                    <div>
                      <h4>Lokaler Speicher</h4>
                      <p>Themes werden lokal in Ihrem Browser gespeichert</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Options */}
              <div className="section">
                <h3>Theme Zurücksetzen</h3>
                <div className="reset-options">
                  <button
                    className="reset-button local"
                    onClick={handleResetTheme}
                  >
                    <Refresh />
                    <div>
                      <span>Theme Zurücksetzen</span>
                      <p>Setzt das Theme auf Standard zurück</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Theme Info */}
              <div className="section">
                <h3>Theme Info</h3>
                <div className="theme-info">
                  <div className="info-row">
                    <span>Speicherort:</span>
                    <span>Lokal</span>
                  </div>
                  <div className="info-row">
                    <span>Primary Farbe:</span>
                    <div className="color-info">
                      <div
                        className="color-dot"
                        style={{ backgroundColor: userConfig.primaryColor }}
                      />
                      <span>{userConfig.primaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};