import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

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
      // Liegt oft auf Artwork: getönter Grund statt Glasrahmen.
      background: `linear-gradient(var(--glass-medium), var(--glass-medium)), color-mix(in srgb, ${currentTheme.background.default} 62%, transparent)`,
      border: 'none',
      backdropFilter: 'var(--blur-sm)',
      WebkitBackdropFilter: 'var(--blur-sm)',
      color: currentTheme.text.secondary,
    },
    surface: {
      background: 'var(--glass-medium)',
      border: 'none',
      color: currentTheme.text.secondary,
    },
    transparent: {
      background: 'transparent',
      border: 'none',
      color: currentTheme.text.secondary,
    },
  };

  const effectiveAriaLabel = ariaLabel || tooltip;

  if (import.meta.env.DEV && !ariaLabel && !tooltip) {
    console.warn(
      'IconButton: Neither ariaLabel nor tooltip provided. This button is not accessible to screen readers.'
    );
  }

  const button = (
    <motion.button
      onClick={onClick}
      whileTap={{ opacity: 0.6 }}
      aria-label={effectiveAriaLabel}
      style={{
        width: size,
        height: size,
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
        padding: 0,
        flexShrink: 0,
        pointerEvents: 'auto',
        position: 'relative',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {/* pointer-events:none — Klicks aufs Icon sollen am <button> ankommen,
          nicht am Icon-DOM-Element haengen bleiben */}
      <span
        style={{
          pointerEvents: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </span>
    </motion.button>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};
