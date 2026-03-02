/**
 * SectionToggleCard - Toggle switch for section visibility
 * Inline styles ONLY for theme colors, CSS classes for layout
 */

import { useTheme } from '../../contexts/ThemeContext';

interface SectionToggleCardProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export const SectionToggleCard = ({ checked, onChange, label }: SectionToggleCardProps) => {
  const { currentTheme } = useTheme();

  return (
    <label className="hl-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="hl-toggle-input"
      />
      <span
        className="hl-toggle-track"
        style={{
          backgroundColor: checked ? currentTheme.primary : `${currentTheme.text.muted}30`,
        }}
      >
        <span
          className={`hl-toggle-thumb ${checked ? 'hl-toggle-thumb--on' : 'hl-toggle-thumb--off'}`}
        />
      </span>
    </label>
  );
};
