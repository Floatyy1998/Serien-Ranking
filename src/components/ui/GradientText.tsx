import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface GradientTextProps {
  children: React.ReactNode;
  from?: string;
  to?: string;
  angle?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  style?: React.CSSProperties;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  from,
  to,
  angle = 135,
  as: Tag = 'span',
  style,
}) => {
  // Defensive: useTheme optional — bei Navigation/Lazy Loading kann Context kurzzeitig fehlen
  let currentTheme;
  try {
    currentTheme = useTheme()?.currentTheme;
  } catch {
    // Fallback wenn ThemeProvider noch nicht verfügbar (z.B. während Lazy Loading)
    currentTheme = null;
  }

  const fromColor = from || currentTheme?.primary || '#00fed7';
  const toColor = to || 'rgba(255, 255, 255, 0.9)';

  return (
    <Tag
      style={{
        background: `linear-gradient(${angle}deg, ${fromColor}, ${toColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter:
          'drop-shadow(0 0 8px color-mix(in srgb, var(--theme-primary, #00fed7) 30%, transparent))',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};
