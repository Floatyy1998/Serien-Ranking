/**
 * Jahresrückblick-Seite — Jahr-agnostisch, kann jedes Jahr recycelt werden:
 * einfach das Jahr im URL-Parameter oder als Default ändern.
 */

import React from 'react';
import { WrappedNotAvailablePage } from '../../components/wrapped';
import { useWrappedData } from './useWrappedData';
import {
  WrappedLoadingState,
  WrappedErrorState,
  WrappedProgressBar,
  WrappedCloseButton,
  WrappedNavigationHint,
  WrappedSlideRenderer,
} from './WrappedComponents';
import './WrappedPage.css';

export const WrappedPage: React.FC = () => {
  const {
    year,
    wrappedConfig,
    user,
    navigate,
    stats,
    loading,
    error,
    currentSlide,
    enabledSlides,
    containerRef,
    handleTouchStart,
    handleTouchEnd,
  } = useWrappedData();

  if (wrappedConfig.loading) {
    return <WrappedLoadingState year={year} />;
  }
  if (!wrappedConfig.enabled) {
    return <WrappedNotAvailablePage year={wrappedConfig.year} onBack={() => navigate('/')} />;
  }

  if (loading) {
    return <WrappedLoadingState year={year} />;
  }

  if (error) {
    return <WrappedErrorState error={error} onBack={() => navigate('/')} />;
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="wrapped-container"
    >
      <div
        className="wrapped-slide-track"
        style={{ transform: `translateY(-${currentSlide * 100}%)` }}
      >
        {enabledSlides.map((slide, index) => (
          <div key={slide.type} className="wrapped-slide">
            {stats && (
              <WrappedSlideRenderer
                slideType={slide.type}
                stats={stats}
                year={year}
                username={user?.displayName || user?.email?.split('@')[0]}
                active={index === currentSlide}
              />
            )}
          </div>
        ))}
      </div>

      <WrappedProgressBar currentSlide={currentSlide} totalSlides={enabledSlides.length} />

      <WrappedCloseButton onClick={() => navigate(-1)} />

      {currentSlide === 0 && <WrappedNavigationHint />}
    </div>
  );
};
