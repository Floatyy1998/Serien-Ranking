/**
 * CatchUpPage - Premium Catch Up Experience
 * Zeigt Serien an, bei denen der User hinterherhinkt
 *
 * Composition-only component. Business logic lives in useCatchUpData.
 * Subcomponents: HeroStats, SortToolbar, SeriesCard, EmptyState.
 */

import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader, PageLayout, ScrollToTopButton } from '../../components/ui';
import { useCatchUpData } from './useCatchUpData';
import { HeroStats } from './HeroStats';
import { SortToolbar } from './SortToolbar';
import { SeriesCard } from './SeriesCard';
import { EmptyState } from './EmptyState';
import './CatchUpPage.css';

export const CatchUpPage: React.FC = () => {
  const { currentTheme } = useTheme();

  const {
    catchUpData,
    sortedData,
    totals,
    sortBy,
    sortDirection,
    handleSortClick,
    currentLabel,
    scrollContainerRef,
  } = useCatchUpData();

  const hasData = catchUpData.length > 0;

  return (
    <PageLayout
      ref={scrollContainerRef}
      style={{
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: currentTheme.text.primary,
      }}
    >
      <div className="cu-content">
        {/* Header */}
        <PageHeader
          title="Backlog"
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.text.secondary}
          sticky={false}
          actions={hasData ? <HeaderBadge count={catchUpData.length} /> : undefined}
        />

        {/* Hero Stats */}
        {hasData && (
          <HeroStats
            totalEpisodes={totals.totalEpisodes}
            totalMinutes={totals.totalMinutes}
            avgProgress={totals.avgProgress}
          />
        )}

        {/* Sort Toolbar */}
        {hasData && (
          <SortToolbar
            sortBy={sortBy}
            sortDirection={sortDirection}
            currentLabel={currentLabel}
            onSortClick={handleSortClick}
          />
        )}

        {/* Empty State */}
        {!hasData && <EmptyState />}

        {/* Series List */}
        <div className="cu-series-list">
          {sortedData.map((item) => (
            <SeriesCard key={item.series.id} item={item} />
          ))}
        </div>
      </div>

      <ScrollToTopButton scrollContainerRef={scrollContainerRef} />
    </PageLayout>
  );
};

/* ---------- Tiny inline subcomponent ---------- */

const HeaderBadge: React.FC<{ count: number }> = ({ count }) => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="cu-header-badge"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
        border: `1px solid ${currentTheme.primary}40`,
        color: currentTheme.primary,
      }}
    >
      {count} Serien
    </motion.div>
  );
};
