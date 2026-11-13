import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../../theme/colorUtils';

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: number;
  style?: React.CSSProperties;
}

export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  active,
  onClick,
  icon,
  badge,
  style,
}) => {
  const { currentTheme } = useTheme();
  const activeInk = getOptimalTextColor(currentTheme.primary);

  return (
    <motion.button
      whileTap={{ opacity: 0.7 }}
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: icon ? '8px 14px' : '8px 16px',
        borderRadius: 'var(--radius-xl)',
        border: 'none',
        background: active
          ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
          : `color-mix(in srgb, ${currentTheme.text.secondary} 8%, transparent)`,
        // Schrift passend zum Verlauf — helle Theme-Schrift auf hellem Verlauf war kaum lesbar.
        color: active ? activeInk : currentTheme.text.secondary,
        boxShadow: active ? `0 6px 16px -8px ${currentTheme.primary}` : 'none',
        fontSize: '13px',
        fontWeight: active ? 700 : 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'background 0.2s ease, border-color 0.2s ease',
        ...style,
      }}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            minWidth: '18px',
            height: '18px',
            borderRadius: '9px',
            background: active
              ? `color-mix(in srgb, ${activeInk} 16%, transparent)`
              : `${currentTheme.primary}20`,
            color: active ? activeInk : currentTheme.primary,
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
          }}
        >
          {badge}
        </span>
      )}
    </motion.button>
  );
};
