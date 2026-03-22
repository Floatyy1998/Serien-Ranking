import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface GradientTextProps {
  children: React.ReactNode;
  from?: string;
  to?: string;
  angle?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  style?: React.CSSProperties;
  /** Animated shimmer sweep across the text */
  shimmer?: boolean;
  /** Slowly rotating gradient animation */
  animatedGradient?: boolean;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  from,
  to,
  angle = 135,
  as: Tag = 'span',
  style,
  shimmer = false,
  animatedGradient = false,
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
  const toColor = to || currentTheme?.accent || '#8b5cf6';
  const midColor = currentTheme?.accent || '#8b5cf6';

  // Build CSS class list for animated variants
  const classNames: string[] = [];
  if (animatedGradient) classNames.push('gradient-text-animated');
  if (shimmer) classNames.push('gradient-shimmer');

  // Enhanced gradients with smoother color transitions
  const gradientBg =
    shimmer || animatedGradient
      ? `linear-gradient(${angle}deg, ${fromColor}, ${midColor}, ${toColor}, ${fromColor})`
      : `linear-gradient(${angle}deg, ${fromColor} 0%, color-mix(in srgb, ${fromColor} 70%, ${toColor}) 50%, ${toColor} 100%)`;

  return (
    <Tag
      className={classNames.length > 0 ? classNames.join(' ') : undefined}
      style={{
        background: gradientBg,
        backgroundSize: shimmer ? '300% 100%' : animatedGradient ? '200% auto' : undefined,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter:
          'drop-shadow(0 0 12px color-mix(in srgb, var(--theme-primary, #00fed7) 25%, transparent))',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};
