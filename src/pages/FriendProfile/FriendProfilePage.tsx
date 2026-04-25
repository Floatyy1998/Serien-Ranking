import { CompareArrows, Movie as MovieIcon, Star, Tv as TvIcon } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import {
  EmptyState,
  LoadingSpinner,
  PageHeader,
  PageLayout,
  ProfileItemCard,
  QuickFilter,
  ScrollToTopButton,
  TabSwitcher,
} from '../../components/ui';
import type { ProfileCardProvider } from '../../components/ui';
import { getImageUrl } from '../../utils/imageUrl';
import {
  calculateFriendRating,
  calculateProgress,
  useFriendProfileData,
} from './useFriendProfileData';
import './FriendProfilePage.css';

export const FriendProfilePage = memo(() => {
  const { currentTheme } = useTheme();

  const {
    loading,
    friendName,
    activeTab,
    setActiveTab,
    setFilters,
    ratedSeries,
    ratedMovies,
    currentItems,
    averageRating,
    itemsWithRatingCount,
    scrollRef,
    handleItemClick,
    navigateToTasteMatch,
  } = useFriendProfileData();

  if (loading) {
    return (
      <PageLayout
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoadingSpinner size={50} text="Lade Profil..." />
      </PageLayout>
    );
  }

  const label = activeTab === 'series' ? 'Serien' : 'Filme';

  return (
    <PageLayout>
      <div ref={scrollRef}>
        {/* Header */}
        <PageHeader
          title={friendName}
          sticky={false}
          subtitle={`\u00D8 ${averageRating.toFixed(1)} | ${itemsWithRatingCount} bewertet`}
          actions={
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={navigateToTasteMatch}
              className="fp-match-btn"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              }}
            >
              <CompareArrows style={{ fontSize: 20 }} />
              Match
            </motion.button>
          }
        />

        {/* Quick Filter */}
        <QuickFilter
          onFilterChange={setFilters}
          isMovieMode={activeTab === 'movies'}
          isRatingsMode={true}
          hasBottomNav={false}
        />

        {/* Tab Switcher */}
        <TabSwitcher
          tabs={[
            { id: 'series', label: 'Serien', icon: TvIcon, count: ratedSeries.length },
            { id: 'movies', label: 'Filme', icon: MovieIcon, count: ratedMovies.length },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as 'series' | 'movies')}
        />

        {/* Items Grid */}
        <div className="fp-grid-wrapper">
          <AnimatePresence mode="wait">
            {currentItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <EmptyState
                  icon={<Star style={{ fontSize: '56px' }} />}
                  title={`Keine ${label} gefunden`}
                  description={`${friendName} hat noch keine ${label} bewertet`}
                  iconColor={currentTheme.text.muted}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fp-grid"
              >
                {currentItems.map((item, index) => {
                  const isMovie = 'release_date' in item && !item.seasons?.length;
                  const rating = parseFloat(calculateFriendRating(item));
                  const progress = isMovie ? 0 : calculateProgress(item);
                  const providers = (
                    item.provider?.provider && item.provider.provider.length > 0
                      ? Array.from(new Set(item.provider.provider.map((p) => p.name)))
                          .map((name) => item.provider?.provider.find((p) => p.name === name))
                          .filter(Boolean)
                      : []
                  ) as ProfileCardProvider[];
                  const genreList = (item.genres || item.genre?.genres || []).filter(
                    (g) => g.toLowerCase() !== 'all'
                  );
                  const genres =
                    genreList.length > 0 ? genreList.slice(0, 2).join(', ') : undefined;
                  const year =
                    isMovie && item.release_date ? item.release_date.slice(0, 4) : undefined;

                  return (
                    <ProfileItemCard
                      key={item.id}
                      title={item.title}
                      posterUrl={getImageUrl(item.poster)}
                      isMovie={isMovie}
                      rating={isNaN(rating) ? 0 : rating}
                      progress={progress > 0 ? progress : undefined}
                      providers={providers}
                      year={year}
                      genres={genres}
                      index={index}
                      currentTheme={currentTheme}
                      onClick={() => handleItemClick(item, isMovie ? 'movie' : 'series')}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </PageLayout>
  );
});

FriendProfilePage.displayName = 'FriendProfilePage';
