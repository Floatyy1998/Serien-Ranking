import {
  CompareArrows,
  ExpandLess,
  ExpandMore,
  Movie as MovieIcon,
  Star,
  Tv as TvIcon,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import {
  EmptyState,
  Skeleton,
  SkeletonPosterRow,
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
import { useFriendCurrentlyWatching } from './useFriendCurrentlyWatching';
import { useFriendAnticipation } from './useFriendAnticipation';
import { useFriendPet } from './useFriendPet';
import { FriendCurrentlyWatchingCard } from './FriendCurrentlyWatchingCard';
import { FriendAnticipationSection } from './FriendAnticipationSection';
import { FriendPetCard } from './FriendPetCard';
import './FriendProfilePage.css';

export const FriendProfilePage = memo(() => {
  const { currentTheme } = useTheme();

  const {
    loading,
    friendId,
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

  const currentlyWatching = useFriendCurrentlyWatching(friendId);
  const anticipation = useFriendAnticipation(friendId);
  const friendPet = useFriendPet(friendId);

  const [insightsOpen, setInsightsOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('friendInsightsCollapsed') !== '1';
    } catch {
      return true;
    }
  });
  const toggleInsights = () => {
    setInsightsOpen((open) => {
      const next = !open;
      try {
        localStorage.setItem('friendInsightsCollapsed', next ? '0' : '1');
      } catch {
        // ignore quota / privacy mode
      }
      return next;
    });
  };

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
        <div
          role="status"
          aria-label="Lade Profil"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            width: '100%',
          }}
        >
          <Skeleton width={96} height={96} shape="circle" />
          <Skeleton width={160} height={20} shape="text" />
          <Skeleton width={220} height={14} shape="text" />
          <div style={{ height: 12 }} />
          <SkeletonPosterRow count={4} posterWidth={110} />
        </div>
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

        {/* Friend Insights — Currently Watching, Pet, Anticipation */}
        {friendId && (
          <div className="fp-insights">
            <button
              className="fp-insights-toggle"
              onClick={toggleInsights}
              style={{ color: currentTheme.text.muted }}
            >
              <span>{insightsOpen ? 'Insights ausblenden' : 'Insights einblenden'}</span>
              {insightsOpen ? (
                <ExpandLess style={{ fontSize: 18 }} />
              ) : (
                <ExpandMore style={{ fontSize: 18 }} />
              )}
            </button>
            <AnimatePresence initial={false}>
              {insightsOpen && (
                <motion.div
                  key="insights-body"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="fp-insights-content">
                    <div className="fp-insights-row">
                      {currentlyWatching.data ? (
                        <FriendCurrentlyWatchingCard
                          friendName={friendName}
                          data={currentlyWatching.data}
                        />
                      ) : (
                        <div className="fp-insights-placeholder">
                          <div className="fp-insights-placeholder-title">Nichts Aktuelles</div>
                          <div className="fp-insights-placeholder-text">
                            {currentlyWatching.loading
                              ? 'Lade Aktivität …'
                              : `${friendName} hat in den letzten 14 Tagen nichts geschaut.`}
                          </div>
                        </div>
                      )}
                      {friendPet.pet ? (
                        <FriendPetCard friendUid={friendId} pet={friendPet.pet} />
                      ) : (
                        <div className="fp-insights-placeholder">
                          <div className="fp-insights-placeholder-title">Kein Pet</div>
                          <div className="fp-insights-placeholder-text">
                            {friendPet.loading
                              ? 'Lade Pet …'
                              : `${friendName} hat noch kein aktives Pet.`}
                          </div>
                        </div>
                      )}
                    </div>
                    {anticipation.items.length > 0 ? (
                      <FriendAnticipationSection
                        friendName={friendName}
                        items={anticipation.items}
                      />
                    ) : (
                      !anticipation.loading && (
                        <div className="fp-insights-placeholder fp-insights-placeholder--wide">
                          <div className="fp-insights-placeholder-title">
                            Keine kommenden Folgen
                          </div>
                          <div className="fp-insights-placeholder-text">
                            Auf {friendName}s Liste sind keine Folgen mit Termin in Sicht.
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

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
