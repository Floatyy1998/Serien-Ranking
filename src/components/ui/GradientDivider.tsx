import React from 'react';

interface GradientDividerProps {
  style?: React.CSSProperties;
  opacity?: number;
}

export const GradientDivider: React.FC<GradientDividerProps> = ({ style, opacity = 0.08 }) => (
  <div
    aria-hidden
    style={{
      height: '1px',
      background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${opacity}), transparent)`,
      margin: '16px 0',
      ...style,
    }}
  />
);
