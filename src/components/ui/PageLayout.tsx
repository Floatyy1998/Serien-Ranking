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
        {/* Animated ambient orbs */}
        <div
          style={{
            position: 'fixed',
            top: '-10%',
            left: '-15%',
            width: '55%',
            height: '45%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${color1}22 0%, transparent 70%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'orbFloat 20s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: '50%',
            right: '-12%',
            width: '45%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${color2}18 0%, transparent 70%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'orbFloat 25s ease-in-out infinite reverse',
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: '30%',
            left: '30%',
            width: '40%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${currentTheme.secondary}0d 0%, transparent 70%)`,
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'orbFloat 30s ease-in-out infinite',
            animationDelay: '-10s',
          }}
        />
        {children}
      </div>
    );
  }
);
