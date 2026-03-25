import Info from '@mui/icons-material/Info';
import List from '@mui/icons-material/List';
import People from '@mui/icons-material/People';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { CastCrew, ProviderBadges, VideoGallery } from '../../components/detail';
import { RecapSheet } from '../../components/ui/RecapSheet';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useCharacterDescriptions } from '../../hooks/useCharacterDescriptions';
import { useEpisodeDiscussionCounts } from '../../hooks/discussionCountHooks';
import { useRecapData } from '../../hooks/useRecapData';
import { CharacterGuide } from './CharacterGuide';
import { calculateOverallRating } from '../../lib/rating/rating';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { calculateWatchingPace, formatPaceLine } from '../../lib/date/paceCalculation';
import { getNextRewatchEpisode, hasActiveRewatch } from '../../lib/validation/rewatch.utils';
import { ActionButtons } from './ActionButtons';
import { HeroSection } from './HeroSection';
import { RatingsCard } from './RatingsCard';
import { SeasonsSection } from './SeasonsSection';
import { SeriesDetailDialogs } from './SeriesDetailDialogs';
import { useSeriesActions } from './useSeriesActions';
import { useSeriesData } from './useSeriesData';
import './SeriesDetailPage.css';

export const SeriesDetailPage = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'cast' | 'characters'>('info');

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

  // Recap hook
  const recap = useRecapData(localSeries ?? undefined);

  // Character guide hook
  const characterGuide = useCharacterDescriptions(localSeries ?? undefined);
  const [showRecap, setShowRecap] = useState(false);

  // Auto-show recap when data is ready
  useEffect(() => {
    if (recap.shouldShowRecap && !recap.loading && recap.recapEpisodes.length > 0) {
      const timer = setTimeout(() => setShowRecap(true), 800);
      return () => clearTimeout(timer);
    }
  }, [recap.shouldShowRecap, recap.loading, recap.recapEpisodes.length]);

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
      if (!season) return;
      season.episodes?.forEach((episode) => {
        if (!episode || !episode.episode_number) return;
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
            color: currentTheme.text.secondary,
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

  const warningColor = currentTheme.accent;

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
            color: currentTheme.status?.warning || '#f59e0b',
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
            ...(!isReadOnlyTmdbSeries && characterGuide.userProgress
              ? [
                  {
                    key: 'characters' as const,
                    icon: <Info style={{ fontSize: isMobile ? '16px' : '18px' }} />,
                    label: 'KI-Guide',
                  },
                ]
              : []),
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
                  ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
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
      {activeTab === 'characters' ? (
        <CharacterGuide
          characters={characterGuide.characters}
          loading={characterGuide.loading}
          error={characterGuide.error}
          onGenerate={characterGuide.generate}
          userProgress={characterGuide.userProgress}
          isMobile={isMobile}
          onAskQuestion={characterGuide.askQuestion}
          questionAnswer={characterGuide.questionAnswer}
          questionLoading={characterGuide.questionLoading}
        />
      ) : activeTab === 'cast' ? (
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
                <Info
                  style={{ fontSize: isMobile ? '16px' : '20px', color: currentTheme.accent }}
                />
                <span style={{ color: currentTheme.text.primary }}>Beschreibung</span>
              </h3>
              <p
                style={{
                  fontSize: isMobile ? '12px' : '14px',
                  lineHeight: isMobile ? 1.4 : 1.5,
                  color: currentTheme.text.secondary,
                  margin: 0,
                }}
              >
                {series.beschreibung || series.overview || tmdbOverview}
              </p>
            </div>
          )}

          {/* Seasons Overview */}
          {series.seasons && series.seasons.length > 0 && (
            <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 20px' }}>
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
            </div>
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
              background: `linear-gradient(135deg, ${currentTheme.primary}cc 0%, ${currentTheme.accent}cc 100%)`,
              border: `1px solid ${currentTheme.primary}80`,
              borderRadius: '12px',
              color: currentTheme.text.secondary,
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

      <SeriesDetailDialogs
        series={series}
        showRewatchDialog={showRewatchDialog}
        setShowRewatchDialog={setShowRewatchDialog}
        handleEpisodeRewatch={handleEpisodeRewatch}
        handleEpisodeUnwatch={handleEpisodeUnwatch}
        dialog={dialog}
        setDialog={setDialog}
        snackbar={snackbar}
        currentTheme={currentTheme}
        navigate={navigate}
      />

      <RecapSheet
        isOpen={showRecap}
        onClose={() => {
          setShowRecap(false);
          recap.dismiss();
        }}
        onDismissPermanent={() => {
          setShowRecap(false);
          recap.dismissPermanent();
        }}
        seriesTitle={series?.title || localSeries?.title || ''}
        daysSinceLastWatch={recap.daysSinceLastWatch}
        recapEpisodes={recap.recapEpisodes}
        aiRecap={recap.aiRecap}
        aiLoading={recap.aiLoading}
        aiError={recap.aiError}
        onGenerateAiRecap={recap.generateAiRecap}
        loading={recap.loading}
        onAskQuestion={recap.askQuestion}
        questionAnswer={recap.questionAnswer}
        questionLoading={recap.questionLoading}
      />
    </div>
  );
});

SeriesDetailPage.displayName = 'SeriesDetailPage';
