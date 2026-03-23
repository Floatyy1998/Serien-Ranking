import React, { forwardRef } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';

interface PageLayoutProps {
  children: React.ReactNode;
  gradientColors?: [string, string];
  style?: React.CSSProperties;
}

export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ children, style }, ref) => {
    const { currentTheme } = useTheme();

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
        {children}
      </div>
    );
  }
);
