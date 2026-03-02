import { Movie as MovieIcon, Public, Star, Tv as TvIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import {
  EmptyState,
  LoadingSpinner,
  PageLayout,
  ProfileItemCard,
  QuickFilter,
  TabSwitcher,
} from '../../components/ui';
import type { ProfileCardProvider } from '../../components/ui';
import { getImageUrl } from '../../utils/imageUrl';
import { PublicProfileHeader } from './PublicProfileHeader';
import {
  calculateProgress,
  calculatePublicRating,
  usePublicProfileData,
} from './usePublicProfileData';
import './PublicProfilePage.css';

/* ------------------------------------------------------------------ */
/*  Loading state                                                      */
/* ------------------------------------------------------------------ */

const LoadingState = memo<{ theme: ReturnType<typeof usePublicProfileData>['currentTheme'] }>(
  ({ theme }) => (
    <div className="pp-loading" style={{ background: theme.background.default }}>
      <div
        className="pp-loading__glow"
        style={{
          background: `radial-gradient(circle, ${theme.primary}20, transparent 70%)`,
        }}
      />
      <div className="pp-loading__content">
        <LoadingSpinner size={60} text="Lade Profil..." />
      </div>
    </div>
  )
);
LoadingState.displayName = 'LoadingState';

/* ------------------------------------------------------------------ */
/*  Not-found state                                                    */
/* ------------------------------------------------------------------ */

const NotFoundState = memo<{
  theme: ReturnType<typeof usePublicProfileData>['currentTheme'];
  onNavigateHome: () => void;
}>(({ theme, onNavigateHome }) => (
  <div
    className="pp-not-found"
    style={{
      background: theme.background.default,
      color: theme.text.primary,
    }}
  >
    <div
      className="pp-not-found__glow"
      style={{
        background: `radial-gradient(circle, ${theme.primary}15, transparent 70%)`,
      }}
    />
    <motion.div
      className="pp-not-found__icon"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Public style={{ fontSize: '48px', opacity: 0.4 }} />
    </motion.div>
    <h2 className="pp-not-found__title">Profil nicht gefunden</h2>
    <p className="pp-not-found__text" style={{ color: theme.text.secondary }}>
      Dieses öffentliche Profil existiert nicht
      <br />
      oder ist nicht mehr öffentlich zugänglich.
    </p>
    <motion.button
      className="pp-not-found__btn"
      whileTap={{ scale: 0.95 }}
      onClick={onNavigateHome}
      style={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`,
      }}
    >
      Zur Startseite
    </motion.button>
  </div>
));
NotFoundState.displayName = 'NotFoundState';

/* ------------------------------------------------------------------ */
/*  Main page (composition only)                                       */
/* ------------------------------------------------------------------ */

export const PublicProfilePage: React.FC = () => {
  const {
    currentTheme,
    navigate,
    scrollRef,
    loading,
    profileExists,
    profileName,
    averageRating,
    itemsWithRatingCount,
    activeTab,
    setActiveTab,
    filters: _filters,
    setFilters,
    ratedSeries,
    ratedMovies,
    currentItems,
    handleItemClick,
  } = usePublicProfileData();

  if (loading) {
    return <LoadingState theme={currentTheme} />;
  }

  if (!profileExists) {
    return <NotFoundState theme={currentTheme} onNavigateHome={() => navigate('/')} />;
  }

  const label = activeTab === 'series' ? 'Serien' : 'Filme';

  return (
    <PageLayout>
      <div ref={scrollRef}>
        <PublicProfileHeader
          profileName={profileName}
          itemsWithRatingCount={itemsWithRatingCount}
          averageRating={averageRating}
          currentTheme={currentTheme}
        />

        <QuickFilter
          onFilterChange={setFilters}
          isMovieMode={activeTab === 'movies'}
          isRatingsMode={true}
          hasBottomNav={false}
        />

        <TabSwitcher
          tabs={[
            { id: 'series', label: 'Serien', icon: TvIcon, count: ratedSeries.length },
            { id: 'movies', label: 'Filme', icon: MovieIcon, count: ratedMovies.length },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as 'series' | 'movies')}
        />

        <div className="pp-grid-area">
          {currentItems.length === 0 ? (
            <EmptyState
              icon={<Star style={{ fontSize: '56px' }} />}
              title={`Keine ${label} gefunden`}
              description="Versuche andere Filter oder entferne sie."
              iconColor={currentTheme.primary}
            />
          ) : (
            <div className="pp-grid">
              {currentItems.map((item, index) => {
                const isMovie = activeTab === 'movies';
                const rating = parseFloat(calculatePublicRating(item));
                const progress = isMovie ? 0 : calculateProgress(item);
                const providers = (
                  item.provider?.provider && item.provider.provider.length > 0
                    ? Array.from(new Set(item.provider.provider.map((p) => p.name)))
                        .slice(0, 2)
                        .map((name) => item.provider!.provider.find((p) => p.name === name))
                        .filter(Boolean)
                    : []
                ) as ProfileCardProvider[];

                return (
                  <ProfileItemCard
                    key={item.id}
                    title={item.title}
                    posterUrl={getImageUrl(item.poster, 'w500')}
                    isMovie={isMovie}
                    rating={isNaN(rating) ? 0 : rating}
                    progress={progress}
                    providers={providers}
                    index={index}
                    animated={false}
                    currentTheme={currentTheme}
                    onClick={() => handleItemClick(item, isMovie ? 'movie' : 'series')}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
