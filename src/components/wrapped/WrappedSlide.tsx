/**
 * WrappedSlide - Basis-Komponente für alle Wrapped Slides
 *
 * Wiederverwendbar für jeden Jahresrückblick
 */

import React from 'react';

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

export default WrappedSlide;
