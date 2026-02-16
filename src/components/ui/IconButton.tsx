import { Tooltip } from '@mui/material';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  size?: number;
  borderRadius?: string;
  variant?: 'glass' | 'surface' | 'transparent';
  ariaLabel?: string;
  tooltip?: string;
  style?: React.CSSProperties;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  size = 40,
  borderRadius = '50%',
  variant = 'surface',
  ariaLabel,
  tooltip,
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

  const effectiveAriaLabel = ariaLabel || tooltip;

  if (process.env.NODE_ENV === 'development' && !ariaLabel && !tooltip) {
    console.warn('IconButton: Neither ariaLabel nor tooltip provided. This button is not accessible to screen readers.');
  }

  const button = (
    <button
      onClick={onClick}
      aria-label={effectiveAriaLabel}
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

  if (tooltip) {
    return <Tooltip title={tooltip} arrow>{button}</Tooltip>;
  }

  return button;
};
