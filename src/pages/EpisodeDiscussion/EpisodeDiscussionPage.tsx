import { Check, SkipNext } from '@mui/icons-material';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { memo, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useEpisodeDiscussion } from './useEpisodeDiscussion';
import {
  CrewSection,
  DiscussionSection,
  EpisodeNavigation,
  GuestStarsSection,
  HeroSection,
  LoadingState,
  NotFoundState,
  OverviewSection,
  QuickActions,
} from './EpisodeDiscussionComponents';
import './EpisodeDiscussionPage.css';

export const EpisodeDiscussionPage = memo(() => {
  const { currentTheme } = useTheme();

  const {
    seriesId,
    seasonNumber,
    episodeNumber,
    navigate,
    loading,
    isNotFound,
    seriesInfo,
    hasUser,
    hasSeries,
    isWatched,
    episodeName,
    episodeOverview,
    episodeAirDate,
    episodeRuntime,
    episodeRating,
    stillPath,
    guestStars,
    directors,
    writers,
    seriesTitle,
    formattedAirDate,
    formattedFirstWatchedAt,
    navigation,
    handleToggleWatched,
    nextEpisodeTransition,
    getStillUrl,
    getProfileUrl,
  } = useEpisodeDiscussion();

  const handleSwipeNav = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) < 60 || Math.abs(info.velocity.x) < 100) return;
      if (info.offset.x < 0 && navigation.hasNextEpisode) {
        navigation.goToNextEpisode();
      } else if (info.offset.x > 0 && navigation.hasPrevEpisode) {
        navigation.goToPrevEpisode();
      }
    },
    [navigation]
  );

  if (loading) {
    return <LoadingState currentTheme={currentTheme} />;
  }

  if (isNotFound) {
    return <NotFoundState currentTheme={currentTheme} onGoBack={() => navigate(-1)} />;
  }

  return (
    <div className="ed-page" style={{ background: currentTheme.background.default }}>
      {/* Next episode transition overlay */}
      <AnimatePresence>
        {nextEpisodeTransition?.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              background: `${currentTheme.background.default}f0`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.primary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 32px ${currentTheme.status.success}40`,
              }}
            >
              <Check style={{ fontSize: '28px', color: '#fff' }} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ textAlign: 'center' }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: currentTheme.text.muted,
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <SkipNext style={{ fontSize: '16px' }} />
                Nächste Episode
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: currentTheme.primary,
                }}
              >
                S{String(nextEpisodeTransition.seasonNumber).padStart(2, '0')}E
                {String(nextEpisodeTransition.episodeNumber).padStart(2, '0')}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                  marginTop: '2px',
                }}
              >
                {nextEpisodeTransition.episodeName}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        dragMomentum={false}
        dragSnapToOrigin
        onDragEnd={handleSwipeNav}
        style={{ touchAction: 'pan-y' }}
      >
        <HeroSection
          currentTheme={currentTheme}
          stillPath={stillPath}
          backdropPath={seriesInfo?.backdrop_path}
          episodeName={episodeName}
          seriesTitle={seriesTitle}
          seriesId={seriesId}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          episodeRating={episodeRating}
          episodeAirDate={episodeAirDate}
          episodeRuntime={episodeRuntime}
          formattedAirDate={formattedAirDate}
          formattedFirstWatchedAt={formattedFirstWatchedAt}
          isWatched={isWatched}
          getStillUrl={getStillUrl}
          navigate={navigate}
        />

        <QuickActions
          currentTheme={currentTheme}
          hasUser={hasUser}
          hasSeries={hasSeries}
          isWatched={isWatched}
          seriesId={seriesId}
          onToggleWatched={handleToggleWatched}
          navigate={navigate}
        />

        <EpisodeNavigation currentTheme={currentTheme} navigation={navigation} />

        <div className="ed-content">
          <OverviewSection currentTheme={currentTheme} episodeOverview={episodeOverview} />

          <CrewSection currentTheme={currentTheme} directors={directors} writers={writers} />

          <GuestStarsSection
            currentTheme={currentTheme}
            guestStars={guestStars}
            getProfileUrl={getProfileUrl}
          />

          <DiscussionSection
            seriesId={seriesId}
            seasonNumber={seasonNumber}
            episodeNumber={episodeNumber}
            seriesTitle={seriesTitle}
            episodeName={episodeName}
            posterPath={seriesInfo?.poster_path}
            isWatched={isWatched}
          />
        </div>
      </motion.div>
    </div>
  );
});

EpisodeDiscussionPage.displayName = 'EpisodeDiscussionPage';
