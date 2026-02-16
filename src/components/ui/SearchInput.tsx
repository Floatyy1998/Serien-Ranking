import React from 'react';
import { Search, Close } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

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
          background: currentTheme.background.default,
          border: `2px solid ${currentTheme.border.default}`,
          borderRadius: '14px',
          color: currentTheme.text.primary,
          fontSize: '16px',
          outline: 'none',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = currentTheme.primary; }}
        onBlur={(e) => { e.target.style.borderColor = currentTheme.border.default; }}
      />
      {value && (
        <button
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
        </button>
      )}
    </div>
  );
};
