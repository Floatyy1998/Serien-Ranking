/**
 * SeriesDetailPage - Composition component using extracted subcomponents + hooks
 */

import { Check, GridView, Info, List, People, Repeat, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { Dialog, ProgressBar } from '../../components/ui';
import { DiscussionThread } from '../../components/Discussion';
import { CastCrew, ProviderBadges, VideoGallery } from '../../components/detail';
import { useTheme } from '../../contexts/ThemeContext';
import { useEpisodeDiscussionCounts } from '../../hooks/useDiscussionCounts';
import { calculateOverallRating } from '../../lib/rating/rating';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { calculateWatchingPace, formatPaceLine } from '../../lib/paceCalculation';
import {
  getImplicitRewatchRound,
  getNextRewatchEpisode,
  getRewatchProgress,
  getRewatchRound,
  hasActiveRewatch,
  hasAnySeasonFullyWatched,
} from '../../lib/validation/rewatch.utils';
import { ActionButtons } from './ActionButtons';
import { EpisodeActionSheet } from './EpisodeActionSheet';
import { HeroSection } from './HeroSection';
import { RatingsCard } from './RatingsCard';
import { SeasonTabs } from './SeasonTabs';
import { useSeriesActions } from './useSeriesActions';
import { useSeriesData } from './useSeriesData';
import './SeriesDetailPage.css';

export const SeriesDetailPage = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'cast'>('info');

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data hook
  const {
    series,
    localSeries,
    tmdbSeries,
    isReadOnlyTmdbSeries,
    loading,
    tmdbBackdrop,
    providers,
    tmdbRating,
    imdbRating,
    tmdbFirstAirDate,
    tmdbOverview,
  } = useSeriesData(id);

  // Actions hook
  const {
    isAdding,
    isDeleting,
    dialog,
    setDialog,
    snackbar,
    showRewatchDialog,
    setShowRewatchDialog,
    handleAddSeries,
    handleDeleteSeries,
    handleWatchlistToggle,
    handleHideToggle,
    handleEpisodeRewatch,
    handleEpisodeUnwatch,
    handleStartRewatch,
    handleStopRewatch,
  } = useSeriesActions(series, user?.uid, tmdbSeries ?? undefined);

  // Auto-select most relevant season tab
  useEffect(() => {
    if (!series?.seasons || series.seasons.length === 0) return;

    if (hasActiveRewatch(series)) {
      const nextEp = getNextRewatchEpisode(series);
      if (nextEp) {
        const idx = series.seasons.findIndex((s) => s.seasonNumber === nextEp.seasonNumber);
        if (idx >= 0) setSelectedSeasonIndex(idx);
        return;
      }
    }

    for (let i = 0; i < series.seasons.length; i++) {
      const eps = series.seasons[i].episodes;
      if (!eps) continue;
      for (const ep of eps) {
        if (!ep.watched && hasEpisodeAired(ep)) {
          setSelectedSeasonIndex(i);
          return;
        }
      }
    }
    setSelectedSeasonIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series?.id]);

  // Episode discussion counts
  const selectedSeasonData = series?.seasons?.[selectedSeasonIndex];
  const episodeDiscussionCounts = useEpisodeDiscussionCounts(
    Number(id) || 0,
    (selectedSeasonData?.seasonNumber || 0) + 1,
    selectedSeasonData?.episodes?.length || 0
  );

  // Computed values
  const overallRating = useMemo(() => {
    if (!series) return '0.00';
    return calculateOverallRating(series);
  }, [series]);

  const progressStats = useMemo(() => {
    if (!series?.seasons) return { watched: 0, total: 0, percentage: 0 };
    let watchedCount = 0;
    let airedCount = 0;
    series.seasons.forEach((season) => {
      season.episodes?.forEach((episode) => {
        if (hasEpisodeAired(episode)) {
          airedCount++;
          if (episode.watched) watchedCount++;
        }
      });
    });
    return {
      watched: watchedCount,
      total: airedCount,
      percentage: airedCount > 0 ? Math.round((watchedCount / airedCount) * 100) : 0,
    };
  }, [series]);

  const paceInfo = useMemo(() => {
    if (!series?.seasons) return null;
    const pace = calculateWatchingPace(series.seasons, series.episodeRuntime);
    if (!pace.shouldShow) return null;
    return { pace, text: formatPaceLine(pace) };
  }, [series]);

  // Loading / Not Found states
  if (!series && !loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Serie nicht gefunden</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Zurück
        </button>
      </div>
    );
  }

  if (loading || !series) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Lade...</p>
      </div>
    );
  }

  const warningColor = currentTheme.status?.warning || '#f59e0b';

  return (
    <div>
      {/* Hero Section */}
      <HeroSection
        series={series}
        tmdbSeries={tmdbSeries}
        tmdbBackdrop={tmdbBackdrop}
        tmdbFirstAirDate={tmdbFirstAirDate}
        overallRating={overallRating}
        progressStats={progressStats}
        paceInfo={paceInfo}
        isReadOnlyTmdbSeries={isReadOnlyTmdbSeries}
        isAdding={isAdding}
        isMobile={isMobile}
        currentTheme={currentTheme}
        onAddSeries={handleAddSeries}
      />

      {/* Ratings & Provider */}
      <div style={{ padding: isMobile ? '12px 16px 0' : '16px 20px 0' }}>
        <RatingsCard
          series={series}
          localSeries={localSeries}
          tmdbRating={tmdbRating}
          imdbRating={imdbRating}
          seriesId={id || ''}
          isMobile={isMobile}
        />

        {/* Provider + VideoGallery in einer Zeile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: isMobile ? '4px' : '8px',
          }}
        >
          {((series.provider?.provider && series.provider.provider.length > 0) || providers) && (
            <ProviderBadges
              providers={
                series.provider?.provider && series.provider.provider.length > 0
                  ? series.provider.provider
                  : (providers ?? undefined)
              }
              size={isMobile ? 'medium' : 'large'}
              maxDisplay={isMobile ? 4 : 6}
              showNames={false}
              searchTitle={series.title || series.name}
              tmdbId={series.tmdb_id || series.id}
              mediaType="tv"
            />
          )}
          <VideoGallery tmdbId={series.tmdb_id || series.id} mediaType="tv" buttonStyle="compact" />
        </div>
      </div>

      {/* Action Buttons */}
      {!isReadOnlyTmdbSeries && (
        <ActionButtons
          series={series}
          overallRating={overallRating}
          isDeleting={isDeleting}
          isMobile={isMobile}
          onNavigateEpisodes={() => navigate(`/episodes/${series.id}`)}
          onNavigateRating={() => navigate(`/rating/series/${series.id}`)}
          onWatchlistToggle={handleWatchlistToggle}
          onHideToggle={handleHideToggle}
          onDelete={handleDeleteSeries}
        />
      )}

      {/* Hidden series banner */}
      {series.hidden && !isReadOnlyTmdbSeries && (
        <div
          style={{
            margin: isMobile ? '0 12px 12px' : '0 20px 20px',
            padding: '10px 16px',
            background: 'rgba(255, 152, 0, 0.15)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#ffb74d',
          }}
        >
          <VisibilityOff style={{ fontSize: '16px' }} />
          Du schaust diese Serie nicht mehr
        </div>
      )}

      {/* Info/Cast Tab Switcher */}
      <div
        className="detail-tab-switcher"
        style={{ padding: isMobile ? '0 12px 12px' : '0 20px 20px' }}
      >
        {(
          [
            {
              key: 'info' as const,
              icon: <List style={{ fontSize: isMobile ? '16px' : '18px' }} />,
              label: 'Info & Episoden',
            },
            {
              key: 'cast' as const,
              icon: <People style={{ fontSize: isMobile ? '16px' : '18px' }} />,
              label: 'Besetzung',
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
            }}
            className="detail-tab-btn"
            style={{
              padding: isMobile ? '8px' : '10px',
              background:
                activeTab === tab.key
                  ? `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`
                  : 'rgba(255, 255, 255, 0.05)',
              borderRadius: isMobile ? '10px' : '12px',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: activeTab === tab.key ? 600 : 500,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'cast' ? (
        <CastCrew tmdbId={series.tmdb_id || series.id} mediaType="tv" seriesData={series} />
      ) : (
        <>
          {/* Description */}
          {(series.beschreibung || series.overview || tmdbOverview) && (
            <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 20px' }}>
              <h3
                style={{
                  fontSize: isMobile ? '14px' : '18px',
                  fontWeight: 600,
                  margin: isMobile ? '0 0 8px' : '0 0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Info style={{ fontSize: isMobile ? '16px' : '20px' }} />
                Beschreibung
              </h3>
              <p
                style={{
                  fontSize: isMobile ? '12px' : '14px',
                  lineHeight: isMobile ? 1.4 : 1.5,
                  opacity: 0.8,
                  margin: 0,
                }}
              >
                {series.beschreibung || series.overview || tmdbOverview}
              </p>
            </div>
          )}

          {/* Seasons Overview */}
          {series.seasons && series.seasons.length > 0 && (
            <SeasonsSection
              series={series}
              selectedSeasonIndex={selectedSeasonIndex}
              setSelectedSeasonIndex={setSelectedSeasonIndex}
              setShowRewatchDialog={setShowRewatchDialog}
              episodeDiscussionCounts={episodeDiscussionCounts}
              warningColor={warningColor}
              currentTheme={currentTheme}
              handleStopRewatch={handleStopRewatch}
              handleStartRewatch={handleStartRewatch}
              navigate={navigate}
            />
          )}
        </>
      )}

      {/* Add Button for TMDB-only series */}
      {isReadOnlyTmdbSeries && (
        <div style={{ padding: '20px' }}>
          <motion.button
            onClick={handleAddSeries}
            disabled={isAdding}
            whileTap={{ scale: isAdding ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '16px',
              background:
                'linear-gradient(135deg, rgba(0, 212, 170, 0.8) 0%, rgba(0, 180, 216, 0.8) 100%)',
              border: '1px solid rgba(0, 212, 170, 0.5)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isAdding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isAdding ? 0.6 : 1,
            }}
          >
            {isAdding ? 'Wird hinzugefügt...' : 'Serie hinzufügen'}
          </motion.button>
        </div>
      )}

      {/* Episode Action Sheet */}
      <EpisodeActionSheet
        isOpen={showRewatchDialog.show}
        episode={showRewatchDialog.item}
        seriesTitle={series?.title || series?.name || ''}
        seasonNumber={showRewatchDialog.seasonNumber || 1}
        episodeNumber={showRewatchDialog.episodeNumber || 1}
        onRewatch={handleEpisodeRewatch}
        onUnwatch={handleEpisodeUnwatch}
        onNavigateToDiscussion={() => {
          const sn = showRewatchDialog.seasonNumber || 1;
          const en = showRewatchDialog.episodeNumber || 1;
          setShowRewatchDialog({ show: false, type: 'episode', item: null });
          navigate(`/episode/${series?.id}/s/${sn}/e/${en}`);
        }}
        onClose={() => setShowRewatchDialog({ show: false, type: 'episode', item: null })}
      />

      {/* Discussion Thread */}
      {series && (
        <div style={{ padding: '0 20px 20px' }}>
          <DiscussionThread
            itemId={series.id}
            itemType="series"
            feedMetadata={{
              itemTitle: series.title || series.name || 'Unbekannte Serie',
              posterPath:
                series.poster && typeof series.poster === 'object'
                  ? series.poster.poster
                  : undefined,
            }}
          />
        </div>
      )}

      {/* Dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        title={
          dialog.type === 'warning'
            ? 'Bestätigung'
            : dialog.type === 'error'
              ? 'Fehler'
              : 'Information'
        }
        message={dialog.message}
        type={dialog.type}
        actions={
          dialog.onConfirm
            ? [
                {
                  label: 'Abbrechen',
                  onClick: () => setDialog({ ...dialog, open: false }),
                  variant: 'secondary',
                },
                { label: 'Bestätigen', onClick: dialog.onConfirm, variant: 'primary' },
              ]
            : []
        }
      />

      {/* Snackbar */}
      {snackbar.open && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(20px + env(safe-area-inset-bottom))',
            left: '20px',
            right: '20px',
            background: currentTheme.status.success,
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            zIndex: 1000,
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: currentTheme.shadow.card,
          }}
        >
          <Check style={{ fontSize: '20px' }} />
          <span>{snackbar.message}</span>
        </div>
      )}
    </div>
  );
});

SeriesDetailPage.displayName = 'SeriesDetailPage';

/* ─── Inline SeasonsSection (keeps season/episode rendering close to page) ─── */

interface SeasonsSectionProps {
  series: NonNullable<ReturnType<typeof useSeriesData>['series']>;
  selectedSeasonIndex: number;
  setSelectedSeasonIndex: (i: number) => void;
  setShowRewatchDialog: (d: {
    show: boolean;
    type: 'episode' | 'season';
    item: any;
    seasonNumber?: number;
    episodeNumber?: number;
  }) => void;
  episodeDiscussionCounts: Record<number, number>;
  warningColor: string;
  currentTheme: any;
  handleStopRewatch: () => void;
  handleStartRewatch: (continueExisting?: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}

function SeasonsSection({
  series,
  selectedSeasonIndex,
  setSelectedSeasonIndex,
  setShowRewatchDialog,
  episodeDiscussionCounts,
  warningColor,
  currentTheme,
  handleStopRewatch,
  handleStartRewatch,
  navigate,
}: SeasonsSectionProps) {
  const [episodeView, setEpisodeView] = useState<'list' | 'grid'>('list');
  const selectedSeason = series.seasons[selectedSeasonIndex];
  const watchedEpisodes = selectedSeason?.episodes?.filter((ep) => ep.watched).length || 0;
  const totalEpisodes = selectedSeason?.episodes?.length || 0;
  const seasonProgress =
    totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <List fontSize="small" />
          Staffeln
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/episodes/${series.id}`)}
          style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Alle verwalten
        </motion.button>
      </div>

      {/* Rewatch Progress Banner */}
      {hasActiveRewatch(series) && (
        <RewatchBanner
          series={series}
          warningColor={warningColor}
          currentTheme={currentTheme}
          setSelectedSeasonIndex={setSelectedSeasonIndex}
          setShowRewatchDialog={setShowRewatchDialog}
          handleStopRewatch={handleStopRewatch}
        />
      )}

      {/* Start Rewatch Button */}
      {hasAnySeasonFullyWatched(series) && !hasActiveRewatch(series) && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStartRewatch()}
          style={{
            width: '100%',
            padding: '12px',
            background: `${warningColor}20`,
            border: `1px solid ${warningColor}50`,
            borderRadius: '10px',
            color: warningColor,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <Repeat style={{ fontSize: '18px' }} />
          Rewatch starten
        </motion.button>
      )}

      {/* Implicit Rewatch Detection */}
      {(() => {
        const implicitRound = getImplicitRewatchRound(series);
        if (implicitRound === 0) return null;
        return (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStartRewatch(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: `${warningColor}20`,
              border: `1px solid ${warningColor}50`,
              borderRadius: '10px',
              color: warningColor,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <Repeat style={{ fontSize: '18px' }} />
            Rewatch fortsetzen
          </motion.button>
        );
      })()}

      {/* Season Tabs */}
      <SeasonTabs
        seasons={series.seasons}
        selectedSeasonIndex={selectedSeasonIndex}
        onSelectSeason={setSelectedSeasonIndex}
      />

      {/* Selected Season Content */}
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        {/* Season header with view toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              Staffel {selectedSeason.seasonNumber + 1}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>
              {watchedEpisodes}/{totalEpisodes} Episoden
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View toggle */}
            <button
              onClick={() => setEpisodeView(episodeView === 'list' ? 'grid' : 'list')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '4px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={episodeView === 'list' ? 'Grid-Ansicht' : 'Listen-Ansicht'}
            >
              {episodeView === 'list' ? (
                <GridView style={{ fontSize: '16px' }} />
              ) : (
                <List style={{ fontSize: '16px' }} />
              )}
            </button>
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                background:
                  seasonProgress === 100
                    ? 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)'
                    : 'rgba(255,255,255,0.1)',
              }}
            >
              {seasonProgress}%
            </div>
          </div>
        </div>

        {/* Episode List View (default) */}
        {episodeView === 'list' && (
          <div className="episode-list">
            {selectedSeason.episodes?.map((episode, episodeIndex) => {
              const discussionCount = episodeDiscussionCounts[episodeIndex + 1] || 0;
              const isRewatched = episode.watched && (episode.watchCount || 1) > 1;
              return (
                <div
                  key={episode.id}
                  onClick={() => {
                    if (episode.watched) {
                      setShowRewatchDialog({
                        show: true,
                        type: 'episode',
                        item: episode,
                        seasonNumber: selectedSeason.seasonNumber + 1,
                        episodeNumber: episodeIndex + 1,
                      });
                    } else {
                      navigate(
                        `/episode/${series.id}/s/${selectedSeason.seasonNumber + 1}/e/${episodeIndex + 1}`
                      );
                    }
                  }}
                  className={`episode-list-item ${episode.watched ? 'episode-list-item--watched' : 'episode-list-item--unwatched'}`}
                >
                  {/* Number circle */}
                  <div
                    className="episode-list-number"
                    style={{
                      background: episode.watched
                        ? isRewatched
                          ? `${warningColor}30`
                          : 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)'
                        : 'rgba(255,255,255,0.1)',
                      border: isRewatched ? `2px solid ${warningColor}` : 'none',
                      color: episode.watched ? '#fff' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {episode.watched ? <Check style={{ fontSize: '16px' }} /> : episodeIndex + 1}
                  </div>

                  {/* Episode info */}
                  <div className="episode-list-info">
                    <div className="episode-list-title">Episode {episodeIndex + 1}</div>
                    {episode.name && <div className="episode-list-subtitle">{episode.name}</div>}
                  </div>

                  {/* Rewatch badge */}
                  {isRewatched && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: warningColor,
                      }}
                    >
                      ×{episode.watchCount}
                    </span>
                  )}

                  {/* Discussion dot */}
                  {discussionCount > 0 && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: currentTheme.primary,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Episode Grid View (compact) */}
        {episodeView === 'grid' && (
          <div className="episode-grid">
            {selectedSeason.episodes?.map((episode, episodeIndex) => {
              const discussionCount = episodeDiscussionCounts[episodeIndex + 1] || 0;
              const isRewatched = episode.watched && (episode.watchCount || 1) > 1;
              return (
                <motion.div
                  key={episode.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (episode.watched) {
                      setShowRewatchDialog({
                        show: true,
                        type: 'episode',
                        item: episode,
                        seasonNumber: selectedSeason.seasonNumber + 1,
                        episodeNumber: episodeIndex + 1,
                      });
                    } else {
                      navigate(
                        `/episode/${series.id}/s/${selectedSeason.seasonNumber + 1}/e/${episodeIndex + 1}`
                      );
                    }
                  }}
                  className="episode-cell"
                  style={{
                    background: episode.watched
                      ? isRewatched
                        ? `${warningColor}30`
                        : 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)'
                      : 'rgba(255,255,255,0.1)',
                    border: episode.watched
                      ? isRewatched
                        ? `2px solid ${warningColor}`
                        : 'none'
                      : '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {episodeIndex + 1}
                  {isRewatched && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-6px',
                        background: warningColor,
                        borderRadius: '6px',
                        padding: '0 3px',
                        height: '12px',
                        fontSize: '8px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        lineHeight: 1,
                      }}
                    >
                      ×{episode.watchCount}
                    </span>
                  )}
                  {discussionCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        left: '-2px',
                        background: currentTheme.primary,
                        borderRadius: '50%',
                        width: '6px',
                        height: '6px',
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Rewatch Banner subcomponent ─── */

function RewatchBanner({
  series,
  warningColor,
  currentTheme,
  setSelectedSeasonIndex,
  setShowRewatchDialog,
  handleStopRewatch,
}: {
  series: any;
  warningColor: string;
  currentTheme: any;
  setSelectedSeasonIndex: (i: number) => void;
  setShowRewatchDialog: (d: any) => void;
  handleStopRewatch: () => void;
}) {
  const rewatchRound = getRewatchRound(series);
  const rewatchProgress = getRewatchProgress(series);
  const rewatchPercent =
    rewatchProgress.total > 0
      ? Math.round((rewatchProgress.current / rewatchProgress.total) * 100)
      : 0;
  const nextEp = getNextRewatchEpisode(series);

  return (
    <div
      style={{
        background: `${warningColor}15`,
        border: `1px solid ${warningColor}40`,
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat style={{ fontSize: '16px', color: warningColor }} />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Rewatch #{rewatchRound}</span>
        </div>
        <span
          style={{
            fontSize: '13px',
            color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
          }}
        >
          {rewatchProgress.current}/{rewatchProgress.total} Episoden
        </span>
      </div>
      <ProgressBar value={rewatchPercent} color={warningColor} toColor="#f59e0b" height={6} />
      {nextEp && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const sIdx = series.seasons.findIndex(
              (s: any) => s.seasonNumber === nextEp.seasonNumber
            );
            if (sIdx >= 0) {
              setSelectedSeasonIndex(sIdx);
              setShowRewatchDialog({
                show: true,
                type: 'episode',
                item: series.seasons[sIdx].episodes[nextEp.episodeIndex],
                seasonNumber: nextEp.seasonNumber + 1,
                episodeNumber: nextEp.episodeIndex + 1,
              });
            }
          }}
          style={{
            padding: '8px 14px',
            background: `${warningColor}25`,
            border: `1px solid ${warningColor}60`,
            borderRadius: '8px',
            color: warningColor,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Nächste: S{nextEp.seasonNumber + 1} E{nextEp.episodeIndex + 1} — {nextEp.name}
        </motion.button>
      )}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleStopRewatch}
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: `1px solid ${warningColor}40`,
          borderRadius: '8px',
          color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
          fontSize: '13px',
          cursor: 'pointer',
          alignSelf: 'flex-end',
        }}
      >
        Rewatch beenden
      </motion.button>
    </div>
  );
}
