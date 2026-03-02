/**
 * AppearanceSection - Theme and homepage layout navigation buttons
 */

import { ChevronRight, Palette, ViewQuilt } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface AppearanceSectionProps {
  onNavigateTheme: () => void;
  onNavigateLayout: () => void;
}

export const AppearanceSection = memo(
  ({ onNavigateTheme, onNavigateLayout }: AppearanceSectionProps) => {
    const { currentTheme } = useTheme();

    return (
      <>
        {/* Theme Settings */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateTheme}
          className="settings-nav-btn"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.primary}08)`,
            border: `1px solid ${currentTheme.primary}30`,
            color: currentTheme.text.primary,
          }}
        >
          <div
            className="settings-nav-btn-icon"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
            }}
          >
            <Palette style={{ fontSize: '24px', color: 'white' }} />
          </div>
          <div className="settings-nav-btn-text">
            <h2 className="settings-nav-btn-title">Design & Themes</h2>
            <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
              Farben und Aussehen anpassen
            </p>
          </div>
          <ChevronRight style={{ fontSize: '22px', color: currentTheme.text.muted }} />
        </motion.button>

        {/* Homepage Layout */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateLayout}
          className="settings-nav-btn"
          style={{
            background: `linear-gradient(135deg, #a855f715, #a855f708)`,
            border: `1px solid #a855f730`,
            color: currentTheme.text.primary,
          }}
        >
          <div
            className="settings-nav-btn-icon"
            style={{ background: `linear-gradient(135deg, #a855f7, #6366f1)` }}
          >
            <ViewQuilt style={{ fontSize: '24px', color: 'white' }} />
          </div>
          <div className="settings-nav-btn-text">
            <h2 className="settings-nav-btn-title">Homepage Layout</h2>
            <p className="settings-nav-btn-subtitle" style={{ color: currentTheme.text.muted }}>
              Sektionen sortieren & ausblenden
            </p>
          </div>
          <ChevronRight style={{ fontSize: '22px', color: currentTheme.text.muted }} />
        </motion.button>
      </>
    );
  }
);

AppearanceSection.displayName = 'AppearanceSection';
