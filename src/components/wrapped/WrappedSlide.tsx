/**
 * WrappedSlide - Basis-Komponente für alle Wrapped Slides
 *
 * Wiederverwendbar für jeden Jahresrückblick
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface WrappedSlideProps {
  children: React.ReactNode;
  backgroundColor?: string;
  gradient?: string;
  className?: string;
}

export const WrappedSlide: React.FC<WrappedSlideProps> = ({
  children,
  backgroundColor = '#1a1a2e',
  gradient,
  className = '',
}) => {
  const backgroundStyle = gradient ? { background: gradient } : { backgroundColor };

  return (
    <div
      className={`wrapped-slide ${className}`}
      style={{
        ...backgroundStyle,
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

// Vordefinierte Farbschemata für verschiedene Slide-Typen
export const getSlideThemes = (currentTheme: ReturnType<typeof useTheme>['currentTheme']) => ({
  intro: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
  totalTime: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  topSeries: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  topMovies: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  topGenres: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  topProviders: `linear-gradient(135deg, #6366f1 0%, ${currentTheme.accent} 100%)`,
  timePattern: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  bingeStats: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  achievements: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  monthlyBreakdown: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  summary: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
});

export default WrappedSlide;
