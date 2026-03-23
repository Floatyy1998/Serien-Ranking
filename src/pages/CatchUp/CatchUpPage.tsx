/**
 * CatchUpPage - Premium Catch Up Experience
 * Zeigt Serien an, bei denen der User hinterherhinkt
 *
 * Composition-only component. Business logic lives in useCatchUpData.
 * Subcomponents: HeroStats, SortToolbar, SeriesCard, EmptyState.
 */

import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { PageHeader, PageLayout, ScrollToTopButton } from '../../components/ui';
import { staggerContainer, staggerItem } from '../../lib/motion';
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
        <motion.div
          className="cu-series-list"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {sortedData.map((item) => (
            <motion.div key={item.series.id} variants={staggerItem}>
              <SeriesCard item={item} />
            </motion.div>
          ))}
        </motion.div>
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
      initial={{ scale: 0, filter: 'blur(8px)' }}
      animate={{ scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="cu-header-badge"
      style={{
        background: currentTheme.background.surface,
        border: `1px solid ${currentTheme.border.default}`,
        color: currentTheme.primary,
        boxShadow: `0 0 20px ${currentTheme.primary}10`,
      }}
    >
      {count} Serien
    </motion.div>
  );
};
