/**
 * RatingsPage - Performance-Optimized Ratings Collection
 *
 * Slim composition component. Business logic lives in useRatingsData.
 * Subcomponents: RatingsHeader, RatingItemCard, RatingsEmptyState.
 *
 * Key optimizations:
 * - CSS content-visibility:auto for native browser virtualization
 * - CSS Grid media queries instead of JS window.innerWidth
 * - Pre-computed ratings & progress in useMemo (calculated once)
 * - React.memo on grid items to prevent unnecessary re-renders
 * - Event delegation: single click handler on grid container
 * - No Framer Motion on grid items
 * - Progressive rendering via rAF batches
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { QuickFilter, ScrollToTopButton } from '../../components/ui';
import { RatingItemCard } from './RatingItemCard';
import { RatingsEmptyState } from './RatingsEmptyState';
import { RatingsHeader } from './RatingsHeader';
import { useRatingsData } from './useRatingsData';
import './RatingsPage.css';

export const RatingsPage: React.FC = () => {
  const { currentTheme, getMobilePageBackground } = useTheme();

  const {
    user,
    activeTab,
    itemsToRender,
    currentItems,
    seriesCount,
    moviesCount,
    stats,
    filters,
    handleTabChange,
    handleQuickFilterChange,
    handleGridClick,
    scrollRef,
    quickFilter,
  } = useRatingsData();

  // ─── Loading State ──────────────────────────────────
  if (!user) {
    return (
      <div
        className="ratings-page ratings-page--loading"
        style={{
          background: getMobilePageBackground(),
          color: currentTheme.text.primary,
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────
  return (
    <div
      ref={scrollRef}
      className="ratings-page"
      style={{
        background: currentTheme.background.default,
        color: currentTheme.text.primary,
      }}
    >
      {/* Decorative Background */}
      <div
        className="ratings-decorative-bg"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.accent}30, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.primary}20, transparent)
          `,
        }}
      />

      {/* Sticky Header */}
      <RatingsHeader
        theme={currentTheme}
        stats={stats}
        activeTab={activeTab}
        seriesCount={seriesCount}
        moviesCount={moviesCount}
        onTabChange={handleTabChange}
      />

      {/* Items Grid */}
      <div className="ratings-content">
        {itemsToRender.length > 0 ? (
          <div className="ratings-grid" onClick={handleGridClick}>
            {itemsToRender.map((item) => (
              <RatingItemCard key={item.id} item={item} theme={currentTheme} />
            ))}
            <div className="ratings-spacer" />
          </div>
        ) : currentItems.length === 0 ? (
          <RatingsEmptyState
            theme={currentTheme}
            activeTab={activeTab}
            hasQuickFilter={!!quickFilter}
          />
        ) : null}
      </div>

      {/* QuickFilter FAB */}
      <QuickFilter
        onFilterChange={handleQuickFilterChange}
        isMovieMode={activeTab === 'movies'}
        isRatingsMode={true}
        initialFilters={filters}
      />

      <ScrollToTopButton scrollContainerSelector=".mobile-content" bottomOffset={72} />
    </div>
  );
};
