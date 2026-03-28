import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { tapScaleSmall } from '../../lib/motion';

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

  return (
    <motion.button
      whileTap={tapScaleSmall}
      onClick={onClick}
      style={{
        padding: icon ? '8px 14px' : '8px 16px',
        borderRadius: 'var(--radius-xl)',
        border: active ? 'none' : `1px solid ${currentTheme.border.default}`,
        background: active
          ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
          : currentTheme.background.surface,
        color: active ? currentTheme.text.secondary : currentTheme.text.muted,
        boxShadow: active ? `0 4px 15px ${currentTheme.primary}40` : 'none',
        fontSize: '13px',
        fontWeight: 600,
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
            background: active ? 'rgba(255,255,255,0.25)' : `${currentTheme.primary}20`,
            color: active ? 'white' : currentTheme.primary,
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
