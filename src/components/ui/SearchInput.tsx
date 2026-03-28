import React from 'react';
import { Search, Close } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { scaleButton, tapScaleTight } from '../../lib/motion';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Suchen...',
  autoFocus = false,
}) => {
  const { currentTheme } = useTheme();

  return (
    <div role="search" style={{ position: 'relative' }}>
      <Search
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '20px',
          color: currentTheme.text.secondary,
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder || 'Suchen'}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '16px 16px 16px 48px',
          paddingRight: value ? '44px' : '16px',
          background: currentTheme.background.surface,
          border: `2px solid ${currentTheme.border.default}`,
          borderRadius: 'var(--radius-lg)',
          color: currentTheme.text.primary,
          fontSize: '16px',
          outline: 'none',
          transition:
            'border-color var(--duration-normal) var(--ease-default), box-shadow var(--duration-normal) var(--ease-default)',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = currentTheme.primary;
          e.target.style.boxShadow = `0 0 0 3px ${currentTheme.primary}20`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = currentTheme.border.default;
          e.target.style.boxShadow = 'none';
        }}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            variants={scaleButton}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileTap={tapScaleTight}
            onClick={() => onChange('')}
            aria-label="Suchfeld leeren"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: currentTheme.text.secondary,
            }}
          >
            <Close style={{ fontSize: '16px' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
