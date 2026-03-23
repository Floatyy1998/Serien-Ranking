import { memo } from 'react';
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
    getStillUrl,
    getProfileUrl,
  } = useEpisodeDiscussion();

  if (loading) {
    return <LoadingState currentTheme={currentTheme} />;
  }

  if (isNotFound) {
    return <NotFoundState currentTheme={currentTheme} onGoBack={() => navigate(-1)} />;
  }

  return (
    <div className="ed-page" style={{ background: currentTheme.background.default }}>
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
    </div>
  );
});

EpisodeDiscussionPage.displayName = 'EpisodeDiscussionPage';
