import { ArrowBack } from '@mui/icons-material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MobileBackButtonProps {
  label?: string;
  style?: React.CSSProperties;
}

export const MobileBackButton = ({ label, style }: MobileBackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Try to go back in history, if no history go to home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleBack}
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
        ...style,
      }}
      aria-label={label || 'Zurück'}
    >
      <ArrowBack style={{ fontSize: '20px' }} />
    </button>
  );
};
