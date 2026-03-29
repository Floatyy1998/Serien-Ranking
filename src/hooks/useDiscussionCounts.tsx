import React from 'react';
import { useTheme } from '../contexts/ThemeContextDef';

// Simple badge component for discussion count
export const DiscussionBadge: React.FC<{
  count: number;
  size?: 'small' | 'medium';
  style?: React.CSSProperties;
}> = ({ count, size = 'small', style }) => {
  const { currentTheme } = useTheme();

  if (count === 0) return null;

  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '3px' : '4px',
        padding: isSmall ? '2px 6px' : '4px 8px',
        background: `${currentTheme.primary}26`,
        color: currentTheme.primary,
        borderRadius: '10px',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 600,
        ...style,
      }}
    >
      {count}
    </span>
  );
};
