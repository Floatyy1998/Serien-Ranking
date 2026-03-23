/**
 * ThemePreviewCard - Preset theme button for the ThemePage
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check } from '@mui/icons-material';
import type { useTheme } from '../../contexts/ThemeContextDef';

export interface PresetTheme {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
}

interface ThemePreviewCardProps {
  preset: PresetTheme;
  index: number;
  isActive: boolean;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  onApply: (preset: PresetTheme) => void;
}

export const ThemePreviewCard = memo(
  ({ preset, index, isActive, currentTheme, onApply }: ThemePreviewCardProps) => {
    const colors = [
      preset.primaryColor,
      preset.backgroundColor,
      preset.surfaceColor,
      preset.accentColor,
    ];

    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03 }}
        onClick={() => onApply(preset)}
        className="theme-preset-btn"
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${preset.primaryColor}25, ${preset.primaryColor}10)`
            : currentTheme.background.default,
          border: isActive
            ? `2px solid ${preset.primaryColor}`
            : `1px solid ${currentTheme.border.default}`,
        }}
      >
        {isActive && (
          <div className="theme-preset-check" style={{ background: currentTheme.status.success }}>
            <Check style={{ fontSize: 11, color: currentTheme.text.secondary }} />
          </div>
        )}
        <div className="theme-preset-dots">
          {colors.map((color, i) => (
            <div
              key={i}
              className="theme-preset-dot"
              style={{
                backgroundColor: color,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            />
          ))}
        </div>
        <span
          className="theme-preset-name"
          style={{ color: isActive ? preset.primaryColor : currentTheme.text.primary }}
        >
          {preset.name}
        </span>
      </motion.button>
    );
  }
);

ThemePreviewCard.displayName = 'ThemePreviewCard';
