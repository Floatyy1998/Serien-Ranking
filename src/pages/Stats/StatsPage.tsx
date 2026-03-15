/**
 * StatsPage - Premium Statistics Dashboard
 * Slim composition component (~50 lines). Business logic in useStatsData,
 * subcomponents in StatsComponents, layout in StatsPage.css.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { trackStatsActorUniverseClicked } from '../../firebase/analytics';
import {
  ActorUniverseBanner,
  HeroSection,
  RatingsSection,
  TimeBreakdownSection,
  TopGenresSection,
  TopProvidersSection,
  WeekActivitySection,
} from './StatsComponents';
import { formatTime, useStatsData } from './useStatsData';
import './StatsPage.css';

export const StatsPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const stats = useStatsData();

  const timeData = useMemo(() => formatTime(stats.totalMinutes), [stats.totalMinutes]);
  const navigateToActors = useMemo(
    () => () => {
      trackStatsActorUniverseClicked();
      navigate('/actor-universe');
    },
    [navigate]
  );

  return (
    <PageLayout>
      <PageHeader
        title="Statistiken"
        gradientFrom={currentTheme.text.primary}
        subtitle="Dein Viewing-Universum in Zahlen"
        sticky={false}
      />

      <HeroSection stats={stats} timeData={timeData} theme={currentTheme} />

      <ActorUniverseBanner theme={currentTheme} onNavigate={navigateToActors} />

      <TimeBreakdownSection
        seriesMinutes={stats.seriesMinutes}
        movieMinutes={stats.movieMinutes}
        theme={currentTheme}
      />

      <RatingsSection
        avgSeriesRating={stats.avgSeriesRating}
        avgMovieRating={stats.avgMovieRating}
        theme={currentTheme}
      />

      <TopGenresSection genres={stats.topGenres} theme={currentTheme} />

      <TopProvidersSection providers={stats.topProviders} theme={currentTheme} />

      <WeekActivitySection lastWeekWatched={stats.lastWeekWatched} theme={currentTheme} />
    </PageLayout>
  );
};
