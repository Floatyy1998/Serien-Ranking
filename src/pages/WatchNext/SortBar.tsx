import { ArrowDownward, ArrowUpward, DragHandle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { HorizontalScrollContainer } from '../../components/ui';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';

interface SortOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

const SORT_OPTIONS: SortOption[] = [
  {
    key: 'custom',
    label: t('Benutzerdefiniert'),
    icon: <DragHandle style={{ fontSize: '16px' }} />,
  },
  { key: 'name', label: t('Name') },
  { key: 'date', label: t('Datum') },
  { key: 'progress', label: t('Fortschritt') },
  { key: 'remaining', label: t('\u00dcbrig') },
];

interface SortBarProps {
  sortOption: string;
  customOrderActive: boolean;
  onSort: (field: string) => void;
  onToggleCustom: () => void;
  theme: {
    primary: string;
    text: { primary: string; secondary: string };
  };
}

export const SortBar = React.memo(
  ({ sortOption, customOrderActive, onSort, onToggleCustom, theme }: SortBarProps) => {
    const isActive = (key: string) =>
      key === 'custom' ? customOrderActive : !customOrderActive && sortOption.startsWith(key);

    const activeStyle = (active: boolean) => ({
      padding: '8px 14px',
      minHeight: 44,
      background: active
        ? `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`
        : `var(--glass-light)`,
      border: 'none' as const,
      borderRadius: 'var(--radius-md)',
      color: active ? getOptimalTextColor(theme.primary) : theme.text.primary,
      fontSize: 'var(--text-sm)',
      fontWeight: 600 as const,
      cursor: 'pointer' as const,
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '6px',
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
      boxShadow: active ? `0 4px 12px ${theme.primary}40` : 'none',
    });

    const renderArrow = (key: string) => {
      if (customOrderActive || !sortOption.startsWith(key)) return null;
      return sortOption.endsWith('asc') ? (
        <ArrowUpward style={{ fontSize: '15px' }} />
      ) : (
        <ArrowDownward style={{ fontSize: '15px' }} />
      );
    };

    return (
      <HorizontalScrollContainer gap={8} style={{}}>
        {SORT_OPTIONS.map((opt) => (
          <motion.button
            key={opt.key}
            whileTap={tapScale}
            onClick={() => (opt.key === 'custom' ? onToggleCustom() : onSort(opt.key))}
            style={activeStyle(isActive(opt.key))}
          >
            {opt.icon}
            {opt.label}
            {opt.key !== 'custom' && renderArrow(opt.key)}
          </motion.button>
        ))}
      </HorizontalScrollContainer>
    );
  }
);

SortBar.displayName = 'SortBar';
