import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface MobileBackButtonProps {
  label?: string;
  style?: React.CSSProperties;
}

export const MobileBackButton: React.FC<MobileBackButtonProps> = ({ label, style }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <button
      onClick={() => navigate('/')}
      style={{
        background: currentTheme.background.surface,
        border: `1px solid ${currentTheme.border.default}`,
        borderRadius: '12px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        color: currentTheme.text.primary,
        transition: 'all 0.2s ease',
        ...style
      }}
      aria-label={label || 'Zurück zur Startseite'}
    >
      <ArrowBack style={{ fontSize: '24px' }} />
    </button>
  );
};