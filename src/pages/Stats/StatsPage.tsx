/**
 * Bento-Grid-Komposition. Logik in useStatsData,
 * Pods in StatsComponents/StatsDetailSections, Layout in StatsPage.css.
 */

import { InsightsRounded, IosShare } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, IconButton, PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/haptics';
import {
  ActorUniverseBanner,
  ProgressPod,
  QuickPods,
  RatingsSection,
  TopGenresSection,
  TopProvidersSection,
  WatchtimePod,
} from './StatsComponents';
import { StatsShareSheet } from './StatsShareCard';
import { formatTime, useStatsData } from './useStatsData';
import { t } from '../../services/i18n';
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
          title={t('Statistiken')}
          gradientFrom={currentTheme.text.primary}
          subtitle={t('Dein Viewing-Universum in Zahlen')}
          sticky={false}
        />
        <EmptyState
          icon={<InsightsRounded style={{ fontSize: 52 }} />}
          title={t('Noch keine Statistiken')}
          description={t(
            'Sobald du Serien und Filme trackst, entsteht hier dein persönliches Viewing-Universum – Watchtime, Fortschritt, Top-Genres und mehr.'
          )}
          action={{
            label: t('Serien entdecken'),
            onClick: () => navigate('/discover'),
          }}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={t('Statistiken')}
        gradientFrom={currentTheme.text.primary}
        subtitle={t('Dein Viewing-Universum in Zahlen')}
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
            ariaLabel={t('Statistiken als Bild teilen')}
          />
        }
      />

      <div className="stats-bento">
        <WatchtimePod stats={stats} timeData={timeData} theme={currentTheme} />
        <ProgressPod stats={stats} theme={currentTheme} />
        <QuickPods stats={stats} theme={currentTheme} />
        <RatingsSection
          avgSeriesRating={stats.avgSeriesRating}
          avgMovieRating={stats.avgMovieRating}
          theme={currentTheme}
        />
        <TopGenresSection
          genres={stats.topGenres}
          theme={currentTheme}
          wide={stats.topProviders.length === 0}
        />
        <TopProvidersSection
          providers={stats.topProviders}
          theme={currentTheme}
          wide={stats.topGenres.length === 0}
        />
        <ActorUniverseBanner theme={currentTheme} onNavigate={navigateToActors} />
      </div>

      <StatsShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        stats={stats}
        timeData={timeData}
      />
    </PageLayout>
  );
};
