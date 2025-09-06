import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

interface MobileBackButtonProps {
  label?: string;
  style?: React.CSSProperties;
}

export const MobileBackButton: React.FC<MobileBackButtonProps> = ({ label, style }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        color: 'white',
        transition: 'all 0.2s ease',
        ...style
      }}
      aria-label={label || 'Zurück zur Startseite'}
    >
      <ArrowBack style={{ fontSize: '20px' }} />
    </button>
  );
};