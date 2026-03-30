/**
 * WrappedPage - Hauptseite für den Jahresrückblick
 *
 * Diese Seite ist Jahr-agnostisch und kann jedes Jahr recycelt werden.
 * Einfach das Jahr im URL-Parameter oder als Default ändern.
 *
 * Composition-only component. Business logic lives in useWrappedData.
 * Repeated UI blocks live in WrappedComponents.
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
    handleShare,
  } = useWrappedData();

  // Wrapped deaktiviert - "Noch nicht verfügbar" Seite
  if (!wrappedConfig.loading && !wrappedConfig.enabled) {
    return <WrappedNotAvailablePage year={wrappedConfig.year} onBack={() => navigate('/')} />;
  }

  // Premium Loading State
  if (loading) {
    return <WrappedLoadingState year={year} />;
  }

  // Premium Error State
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
      {/* Slide Container */}
      <div
        className="wrapped-slide-track"
        style={{ transform: `translateY(-${currentSlide * 100}%)` }}
      >
        {enabledSlides.map((slide) => (
          <div key={slide.type} className="wrapped-slide">
            {stats && (
              <WrappedSlideRenderer
                slideType={slide.type}
                stats={stats}
                year={year}
                username={user?.displayName || user?.email?.split('@')[0]}
                onShare={handleShare}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <WrappedProgressBar currentSlide={currentSlide} totalSlides={enabledSlides.length} />

      {/* Close Button */}
      <WrappedCloseButton onClick={() => navigate(-1)} />

      {/* Navigation Hint (nur auf erstem Slide) */}
      {currentSlide === 0 && <WrappedNavigationHint />}
    </div>
  );
};
