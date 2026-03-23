/**
 * ColorEditor - Single color row for editing a theme color
 */

import { memo } from 'react';
import type { useTheme } from '../../contexts/ThemeContextDef';

export interface ColorCategory {
  key: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface ColorEditorProps {
  category: ColorCategory;
  color: string;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  onColorChange: (key: string, value: string) => void;
}

export const ColorEditor = memo(
  ({ category, color, currentTheme, onColorChange }: ColorEditorProps) => {
    return (
      <div
        className="theme-color-row"
        style={{
          background: currentTheme.background.default,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div
          className="theme-color-picker-wrap"
          style={{ border: `2px solid ${currentTheme.border.default}` }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(category.key, e.target.value)}
            className="theme-color-picker-input"
          />
        </div>
        <div className="theme-color-info">
          <h3 style={{ color: currentTheme.text.primary }}>{category.name}</h3>
          <p style={{ color: currentTheme.text.muted }}>{category.description}</p>
        </div>
        <input
          type="text"
          value={color}
          onChange={(e) => onColorChange(category.key, e.target.value)}
          className="theme-color-hex"
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            color: currentTheme.text.secondary,
          }}
        />
      </div>
    );
  }
);

ColorEditor.displayName = 'ColorEditor';
