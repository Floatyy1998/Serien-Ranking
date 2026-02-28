import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { VisuallyHidden } from './VisuallyHidden';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  borderWidth?: number;
  text?: string;
  style?: React.CSSProperties;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 48,
  color,
  borderWidth = 3,
  text,
  style,
}) => {
  const { currentTheme } = useTheme();
  const spinnerColor = color || currentTheme.primary;

  return (
    <div role="status" style={{ textAlign: 'center', padding: '40px 0', ...style }}>
      <motion.div
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: size,
          height: size,
          border: `${borderWidth}px solid ${spinnerColor}20`,
          borderTop: `${borderWidth}px solid ${spinnerColor}`,
          borderRadius: '50%',
          margin: '0 auto 16px',
        }}
      />
      {text ? (
        <p style={{ color: currentTheme.text.secondary, fontSize: '15px', margin: 0 }}>{text}</p>
      ) : (
        <VisuallyHidden>Daten werden geladen</VisuallyHidden>
      )}
    </div>
  );
};
