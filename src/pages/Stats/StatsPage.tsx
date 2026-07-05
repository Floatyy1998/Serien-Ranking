/**
 * StatsPage - Premium Statistics Dashboard
 * Slim composition component (~50 lines). Business logic in useStatsData,
 * subcomponents in StatsComponents, layout in StatsPage.css.
 */

import { InsightsRounded, IosShare } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, IconButton, PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import { hapticTap } from '../../lib/haptics';
import {
  ActorUniverseBanner,
  HeroSection,
  RatingsSection,
  TimeBreakdownSection,
  TopGenresSection,
  TopProvidersSection,
  WeekActivitySection,
} from './StatsComponents';
import { StatsShareSheet } from './StatsShareCard';
import { formatTime, useStatsData } from './useStatsData';
import './StatsPage.css';

export const StatsPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const stats = useStatsData();
  const [shareOpen, setShareOpen] = useState(false);

  const timeData = useMemo(() => formatTime(stats.totalMinutes), [stats.totalMinutes]);
  const navigateToActors = useMemo(
    () => () => {
      navigate('/actor-universe');
    },
    [navigate]
  );

  const isEmpty = stats.totalSeries === 0 && stats.totalMovies === 0;

  if (isEmpty) {
    return (
      <PageLayout>
        <PageHeader
          title="Statistiken"
          gradientFrom={currentTheme.text.primary}
          subtitle="Dein Viewing-Universum in Zahlen"
          sticky={false}
        />
        <EmptyState
          icon={<InsightsRounded style={{ fontSize: 52 }} />}
          title="Noch keine Statistiken"
          description="Sobald du Serien und Filme trackst, entsteht hier dein persönliches Viewing-Universum – Watchtime, Fortschritt, Top-Genres und mehr."
          action={{
            label: 'Serien entdecken',
            onClick: () => navigate('/discover'),
          }}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Statistiken"
        gradientFrom={currentTheme.text.primary}
        subtitle="Dein Viewing-Universum in Zahlen"
        sticky={false}
        actions={
          <IconButton
            icon={<IosShare style={{ fontSize: 20 }} />}
            onClick={() => {
              hapticTap();
              setShareOpen(true);
            }}
            size={44}
            variant="glass"
            ariaLabel="Statistiken als Bild teilen"
          />
        }
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

      <StatsShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        stats={stats}
        timeData={timeData}
      />
    </PageLayout>
  );
};
