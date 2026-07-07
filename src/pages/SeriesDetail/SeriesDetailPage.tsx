import History from '@mui/icons-material/History';
import Info from '@mui/icons-material/Info';
import List from '@mui/icons-material/List';
import People from '@mui/icons-material/People';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { CastCrew, RecommendationsSection } from '../../components/detail';
import { AnimeFillerBanner } from './AnimeFillerBanner';
import { RecapSheet } from '../../components/ui/RecapSheet';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnimeFillerData } from '../../hooks/useAnimeFillerData';
import { useCharacterDescriptions } from '../../hooks/useCharacterDescriptions';
import { useEpisodeDiscussionCounts } from '../../hooks/discussionCountHooks';
import { useRecapData } from '../../hooks/useRecapData';
import { CharacterGuide } from './CharacterGuide';
import { calculateOverallRating } from '../../lib/rating/rating';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { findNextEpisode, markNextEpisodeWatched } from '../../hooks/markNextEpisode';
import { calculateWatchingPace, formatPaceLine } from '../../lib/date/paceCalculation';
import { getNextRewatchEpisode, hasActiveRewatch } from '../../lib/validation/rewatch.utils';
import { FriendsProgressStrip } from './FriendsProgressStrip';
import { HeroSection } from './HeroSection';
import { SeasonsSection } from './SeasonsSection';
import { SeriesDetailDialogs } from './SeriesDetailDialogs';
import { useFriendsSeriesProgress } from './useFriendsSeriesProgress';
import { useSeriesActions } from './useSeriesActions';
import { useSeriesData } from './useSeriesData';
import './SeriesDetailPage.css';
import { tapScaleSmall } from '../../lib/motion';

export const SeriesDetailPage = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'cast' | 'characters'>('info');
  const [markingNext, setMarkingNext] = useState(false);

  // Responsive state
  const { isMobile } = useDeviceType();

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

  // Nächste ungesehene, ausgestrahlte Folge für den „Weiterschauen"-CTA im Hero.
  const nextEpisode = useMemo(
    () => (series && !isReadOnlyTmdbSeries ? findNextEpisode(series) : null),
    [series, isReadOnlyTmdbSeries]
  );

  const handleWatchNext = async () => {
    if (!user || !series || markingNext) return;
    setMarkingNext(true);
    try {
      await markNextEpisodeWatched(user.uid, series);
    } finally {
      setMarkingNext(false);
    }
  };

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
    handleEpisodeQuickToggle,
    handleStartRewatch,
    handleStopRewatch,
  } = useSeriesActions(series, user?.uid, tmdbSeries ?? undefined);

  // Recap hook
  const recap = useRecapData(localSeries ?? undefined);

  // Character guide hook
  const characterGuide = useCharacterDescriptions(localSeries ?? undefined);
  const [showRecap, setShowRecap] = useState(false);

  // Anime filler/recap data – read from backend (Firebase admin/animeFiller).
  // The frontend never queries AniList/Jikan; reload goes through the backend
  // endpoint. Shared by the inline banner and the per-episode chips.
  const animeFiller = useAnimeFillerData(series?.tmdb_id || series?.id, series?.seasons);

  // Auto-select most relevant season tab, or restore from session
  useEffect(() => {
    if (!series?.seasons || series.seasons.length === 0) return;

    // Try to restore saved selection (back-navigation)
    const saved = sessionStorage.getItem(`series_${id}_season`);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (idx >= 0 && idx < series.seasons.length) {
        setSelectedSeasonIndex(idx);
        return;
      }
    }

    // Otherwise auto-select the most relevant season
    if (hasActiveRewatch(series)) {
      const nextEp = getNextRewatchEpisode(series);
      if (nextEp) {
        const idx = series.seasons.findIndex((s) => s?.seasonNumber === nextEp.seasonNumber);
        if (idx >= 0) {
          setSelectedSeasonIndex(idx);
          return;
        }
      }
    }

    for (let i = 0; i < series.seasons.length; i++) {
      const eps = series.seasons[i]?.episodes;
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

  // Restore tab selection after series data is loaded
  useEffect(() => {
    if (!series) return;
    const savedTab = sessionStorage.getItem(`series_${id}_tab`) as
      | 'info'
      | 'cast'
      | 'characters'
      | null;
    if (savedTab && savedTab !== 'info') {
      setActiveTab(savedTab);
    }
  }, [id, series?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist season and tab selection for back-navigation (only after series loaded)
  useEffect(() => {
    if (!series) return;
    sessionStorage.setItem(`series_${id}_season`, String(selectedSeasonIndex));
  }, [id, selectedSeasonIndex, series]);

  useEffect(() => {
    if (!series) return;
    sessionStorage.setItem(`series_${id}_tab`, activeTab);
  }, [id, activeTab, series]);

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

  const friendsProgress = useFriendsSeriesProgress(
    series?.id,
    progressStats.total,
    series?.seasons
  );

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
        localSeries={localSeries}
        tmdbSeries={tmdbSeries}
        tmdbBackdrop={tmdbBackdrop}
        tmdbFirstAirDate={tmdbFirstAirDate}
        tmdbRating={tmdbRating}
        imdbRating={imdbRating}
        providers={providers}
        overallRating={overallRating}
        progressStats={progressStats}
        paceInfo={paceInfo}
        isReadOnlyTmdbSeries={isReadOnlyTmdbSeries}
        isAdding={isAdding}
        isDeleting={isDeleting}
        isMobile={isMobile}
        currentTheme={currentTheme}
        onAddSeries={handleAddSeries}
        onNavigateEpisodes={() => navigate(`/episodes/${series.id}`)}
        onNavigateRating={() => navigate(`/rating/series/${series.id}`)}
        onWatchlistToggle={handleWatchlistToggle}
        onHideToggle={handleHideToggle}
        onDelete={handleDeleteSeries}
      />

      {/* Weiterschauen-CTA: nächste ungesehene Folge mit einem Tap markieren */}
      {nextEpisode && !series.hidden && (
        <div style={{ margin: isMobile ? '0 12px 12px' : '0 20px 16px' }}>
          <button
            type="button"
            onClick={handleWatchNext}
            disabled={markingNext}
            aria-label={`Nächste Folge S${nextEpisode.seasonNumber} E${nextEpisode.episodeNumber} als gesehen markieren`}
            style={{
              width: '100%',
              minHeight: 48,
              padding: '12px 18px',
              borderRadius: 14,
              border: 'none',
              cursor: markingNext ? 'default' : 'pointer',
              fontSize: 15,
              fontWeight: 700,
              opacity: markingNext ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              color: getOptimalTextColor(currentTheme.primary),
            }}
          >
            ▶ Weiter: S{nextEpisode.seasonNumber} E{nextEpisode.episodeNumber}
            {nextEpisode.episodeName ? ` · ${nextEpisode.episodeName}` : ''} — gesehen
          </button>
        </div>
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

      {/* Friends Progress Strip — only when user actually tracks this series */}
      {!isReadOnlyTmdbSeries && friendsProgress.entries.length > 0 && (
        <FriendsProgressStrip
          entries={friendsProgress.entries}
          userPercentage={progressStats.percentage}
          userWatched={progressStats.watched}
          isMobile={isMobile}
        />
      )}

      {/* Info/Cast Tab Switcher */}
      <div
        className="detail-tab-switcher"
        style={{ margin: isMobile ? '8px 12px 12px' : '12px 20px 20px' }}
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
              background:
                activeTab === tab.key
                  ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                  : undefined,
              color: activeTab === tab.key ? getOptimalTextColor(currentTheme.primary) : undefined,
              fontSize: isMobile ? '12px' : '13px',
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
          {/* Recap Trigger – only when user tracks the series and has watched episodes */}
          {!isReadOnlyTmdbSeries && recap.recapEpisodes.length > 0 && (
            <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 16px' }}>
              <motion.button
                onClick={() => setShowRecap(true)}
                whileTap={tapScaleSmall}
                whileHover={{ y: -1 }}
                disabled={recap.loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isMobile ? '10px 14px' : '12px 18px',
                  background: `linear-gradient(135deg, color-mix(in srgb, ${currentTheme.primary} 12%, transparent), color-mix(in srgb, ${currentTheme.accent} 8%, transparent))`,
                  border: `1px solid color-mix(in srgb, ${currentTheme.primary} 28%, transparent)`,
                  borderRadius: '12px',
                  color: currentTheme.text.primary,
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 600,
                  cursor: recap.loading ? 'wait' : 'pointer',
                  textAlign: 'left',
                  opacity: recap.loading ? 0.7 : 1,
                  transition: 'background var(--duration-fast) var(--ease-default)',
                }}
              >
                <History
                  style={{ fontSize: isMobile ? '18px' : '20px', color: currentTheme.primary }}
                />
                <span style={{ flex: 1 }}>
                  Recap der letzten {recap.recapEpisodes.length} Folge
                  {recap.recapEpisodes.length === 1 ? '' : 'n'}
                  {recap.daysSinceLastWatch > 0 && (
                    <span
                      style={{
                        color: currentTheme.text.secondary,
                        fontWeight: 400,
                        marginLeft: 6,
                      }}
                    >
                      · zuletzt vor {recap.daysSinceLastWatch} Tag
                      {recap.daysSinceLastWatch === 1 ? '' : 'en'}
                    </span>
                  )}
                </span>
                <span style={{ color: currentTheme.primary, fontSize: '18px' }}>→</span>
              </motion.button>
            </div>
          )}

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

          {/* Anime Filler / Recap Info – only renders for Japanese animation */}
          <AnimeFillerBanner
            enabled={animeFiller.enabled}
            loading={animeFiller.loading}
            data={animeFiller.data}
            isMobile={isMobile}
            onReload={animeFiller.reload}
          />

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
                handleEpisodeQuickToggle={handleEpisodeQuickToggle}
                navigate={navigate}
                fillerByKey={animeFiller.fillerByKey}
              />
            </div>
          )}

          {/* TMDB-Empfehlungen */}
          <RecommendationsSection id={series.tmdb_id || series.id} mediaType="tv" />
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
