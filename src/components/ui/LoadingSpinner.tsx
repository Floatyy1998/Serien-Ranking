import React from 'react';
import { colors } from '../../theme/colors';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  text?: string;
  showOfflineMessage?: boolean;
  variant?: 'centered' | 'inline';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 50,
  color = 'var(--theme-primary)',
  text = 'Wird geladen...',
  showOfflineMessage = false,
  variant = 'centered'
}) => {
  const spinnerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    border: `4px solid ${color}`,
    borderTop: '4px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const containerStyle: React.CSSProperties = variant === 'centered' ? {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: colors.background.loading,
    color: color,
    flexDirection: 'column',
    gap: '20px',
  } : {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: color,
  };

  const smallContainerStyle: React.CSSProperties = variant === 'centered' ? {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    color: color,
  } : {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: color,
  };

  return (
    <>
      <div style={text.includes('Komponente') ? smallContainerStyle : containerStyle}>
        <div style={spinnerStyle} />
        <div>{text}</div>
        {showOfflineMessage && (
          <div
            style={{
              color: colors.status.warning,
              fontSize: '0.9rem',
              textAlign: 'center',
              marginTop: '10px',
            }}
          >
            Offline-Modus aktiv
            <br />
            Gespeicherte Daten werden geladen...
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};