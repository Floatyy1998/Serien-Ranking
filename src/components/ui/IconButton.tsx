import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  size?: number;
  borderRadius?: string;
  variant?: 'glass' | 'surface' | 'transparent';
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  size = 40,
  borderRadius = '50%',
  variant = 'surface',
  ariaLabel,
  style,
}) => {
  const { currentTheme } = useTheme();

  const variantStyles: Record<string, React.CSSProperties> = {
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      color: 'white',
    },
    surface: {
      background: currentTheme.background.surface,
      border: `1px solid ${currentTheme.border.default}`,
      color: currentTheme.text.secondary,
    },
    transparent: {
      background: 'transparent',
      border: 'none',
      color: currentTheme.text.secondary,
    },
  };

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: size,
        height: size,
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        padding: 0,
        flexShrink: 0,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {icon}
    </button>
  );
};
