/**
 * Statistikseite. Logik in useStatsData, Bausteine in StatsBoard.
 */

import { ReadingStatsBanner } from '../Books/components/ReadingStatsBanner';
import { ChevronRight, EmojiEventsRounded, InsightsRounded, IosShare } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, IconButton, PageHeader, PageLayout } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useFriendTotalsRank } from '../../hooks/social/useFriendTotalsRank';
import { hapticTap } from '../../lib/interaction/haptics';
import { ActorUniverseBanner } from './StatsComponents';
import { StatsCounting, StatsFigures, StatsHero, StatsProgress, StatsRanking } from './StatsBoard';
import { StatsShareSheet } from './StatsShareCard';
import { formatTime, useStatsData } from './useStatsData';
import { t } from '../../services/i18n';
import './StatsPage.css';

export const StatsPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const stats = useStatsData();
  const friendRank = useFriendTotalsRank();
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

      {friendRank.rank !== null && (
        <button
          type="button"
          className="stats-friend-rank"
          onClick={() => navigate('/leaderboard')}
          style={{ color: currentTheme.text.secondary }}
        >
          <EmojiEventsRounded style={{ fontSize: 17, color: currentTheme.accent }} />
          <span>
            {t('Platz {rank} von {of} unter deinen Freunden', {
              rank: friendRank.rank,
              of: friendRank.of,
            })}
          </span>
          <ChevronRight style={{ fontSize: 18, color: currentTheme.text.muted }} />
        </button>
      )}

      <div className="sb">
        <StatsHero stats={stats} timeData={timeData} />
        <StatsProgress stats={stats} color={currentTheme.primary} />
        <StatsFigures stats={stats} />
        {(stats.topGenres.length > 0 || stats.topProviders.length > 0) && (
          <div className="sb-lists">
            <StatsRanking title={t('Top Genres')} items={stats.topGenres} translate />
            <StatsRanking title={t('Streaming-Dienste')} items={stats.topProviders} />
          </div>
        )}
        <StatsCounting stats={stats} onOpenHidden={() => navigate('/hidden-series')} />
        <div className="sb-more">
          <ActorUniverseBanner theme={currentTheme} onNavigate={navigateToActors} />
          <ReadingStatsBanner />
        </div>
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
