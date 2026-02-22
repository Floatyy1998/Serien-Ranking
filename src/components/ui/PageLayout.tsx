import React, { forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface PageLayoutProps {
  children: React.ReactNode;
  gradientColors?: [string, string];
  style?: React.CSSProperties;
}

export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(({
  children,
  gradientColors,
  style,
}, ref) => {
  const { currentTheme } = useTheme();
  const color1 = gradientColors?.[0] || currentTheme.primary;
  const color2 = gradientColors?.[1] || '#8b5cf6';

  return (
    <div
      ref={ref}
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 20% 10%, ${color1}12 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 90%, ${color2}12 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {children}
    </div>
  );
});
