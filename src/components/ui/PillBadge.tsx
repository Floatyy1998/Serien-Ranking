import React from 'react';

interface PillBadgeProps {
  children: React.ReactNode;
  color?: string;
  background?: string;
  style?: React.CSSProperties;
}

export const PillBadge: React.FC<PillBadgeProps> = ({
  children,
  color = 'rgba(255, 255, 255, 0.9)',
  background = 'rgba(255, 255, 255, 0.08)',
  style,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 600,
      color,
      background,
      border: '1px solid rgba(255, 255, 255, 0.06)',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);
