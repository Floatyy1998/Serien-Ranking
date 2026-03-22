import { ArrowDownward, ArrowUpward, DragHandle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { HorizontalScrollContainer } from '../../components/ui';

interface SortOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

const SORT_OPTIONS: SortOption[] = [
  { key: 'custom', label: 'Benutzerdefiniert', icon: <DragHandle style={{ fontSize: '16px' }} /> },
  { key: 'name', label: 'Name' },
  { key: 'date', label: 'Datum' },
  { key: 'progress', label: 'Fortschritt' },
  { key: 'remaining', label: '\u00dcbrig' },
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
      background: active
        ? `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`
        : `rgba(255,255,255,0.05)`,
      border: 'none' as const,
      borderRadius: '10px',
      color: active ? theme.text.secondary : theme.text.primary,
      fontSize: '13px',
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
            whileTap={{ scale: 0.95 }}
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
