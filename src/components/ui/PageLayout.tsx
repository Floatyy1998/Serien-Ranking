import React, { forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface PageLayoutProps {
  children: React.ReactNode;
  gradientColors?: [string, string];
  style?: React.CSSProperties;
}

export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, gradientColors, style }, ref) => {
    const { currentTheme } = useTheme();
    const color1 = gradientColors?.[0] || currentTheme.primary;
    const color2 = gradientColors?.[1] || currentTheme.secondary;

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
        {/* Cinematic mesh gradient — multi-layer ambient glow */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: '-15%',
            pointerEvents: 'none',
            zIndex: 0,
            background: `
              radial-gradient(ellipse 70% 45% at 15% 10%, ${color1}1a 0%, transparent 55%),
              radial-gradient(ellipse 55% 65% at 85% 50%, ${color2}14 0%, transparent 55%),
              radial-gradient(ellipse 50% 40% at 50% 90%, ${currentTheme.secondary}0c 0%, transparent 50%),
              radial-gradient(ellipse 80% 35% at 65% 0%, ${color1}10 0%, transparent 45%),
              radial-gradient(ellipse 40% 50% at 10% 70%, ${color2}08 0%, transparent 50%)
            `,
            filter: 'blur(70px) saturate(1.3)',
            animation: 'meshShift 30s ease-in-out infinite alternate',
          }}
        />

        {/* Subtle film grain overlay */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.025,
            mixBlendMode: 'overlay',
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Vignette effect for cinematic depth */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            background:
              'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.25) 100%)',
          }}
        />

        {children}
      </div>
    );
  }
);
