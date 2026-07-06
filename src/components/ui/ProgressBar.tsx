import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface ProgressBarProps {
  value: number;
  color?: string;
  toColor?: string;
  height?: number;
  animated?: boolean;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color,
  toColor,
  height = 8,
  animated = true,
  style,
}) => {
  const { currentTheme } = useTheme();
  const fromColor = color || currentTheme.primary;
  const endColor = toColor || currentTheme.accent;
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      style={{
        height,
        background: `${currentTheme.text.muted}15`,
        borderRadius: height / 2,
        overflow: 'hidden',
        ...style,
      }}
    >
      <motion.div
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${clampedValue}%` }}
        transition={animated ? { duration: 1, ease: [0.4, 0, 0.2, 1] } : undefined}
        style={{
          height: '100%',
          background: `linear-gradient(90deg, ${fromColor}, ${endColor})`,
          borderRadius: height / 2,
          boxShadow: `0 0 12px ${fromColor}50, 0 0 4px ${fromColor}30`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-50%',
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'progressShimmer 2s ease-in-out infinite',
          }}
        />
      </motion.div>
    </div>
  );
};
