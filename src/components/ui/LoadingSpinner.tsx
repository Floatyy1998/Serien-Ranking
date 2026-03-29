import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
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
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          position: 'relative',
          margin: '0 auto 16px',
        }}
      >
        {/* Outer ring - slow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `${borderWidth}px solid transparent`,
            borderTopColor: `${spinnerColor}30`,
            borderRightColor: `${spinnerColor}15`,
          }}
        />
        {/* Middle ring - opposite direction */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: size * 0.15,
            borderRadius: '50%',
            border: `${borderWidth}px solid transparent`,
            borderTopColor: `${spinnerColor}60`,
            borderLeftColor: `${spinnerColor}30`,
          }}
        />
        {/* Inner ring - fast */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: size * 0.3,
            borderRadius: '50%',
            border: `${borderWidth}px solid transparent`,
            borderTopColor: spinnerColor,
            boxShadow: `0 0 ${size * 0.3}px ${spinnerColor}40`,
          }}
        />
        {/* Center dot - pulsing */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size * 0.12,
            height: size * 0.12,
            borderRadius: '50%',
            background: spinnerColor,
            boxShadow: `0 0 ${size * 0.4}px ${spinnerColor}60`,
          }}
        />
      </div>
      {text ? (
        <p
          style={{
            color: currentTheme.text.secondary,
            fontSize: '15px',
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
          }}
        >
          {text}
        </p>
      ) : (
        <VisuallyHidden>Daten werden geladen</VisuallyHidden>
      )}
    </div>
  );
};
