import AutoAwesome from '@mui/icons-material/AutoAwesome';
import ChevronRight from '@mui/icons-material/ChevronRight';
import History from '@mui/icons-material/History';
import List from '@mui/icons-material/List';
import People from '@mui/icons-material/People';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { motion } from 'framer-motion';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { CastCrew, RecommendationsSection } from '../../components/detail';
import { DetailTabs, FactList, RailSection } from '../../components/detail/kit/DetailKit';
import { BasedOnBookSection } from '../Books/components/BasedOnBookSection';
import { Deferred } from '../../components/ui/feedback/Deferred';
import { AnimeFillerBanner } from './sections/AnimeFillerBanner';
import { RecapSheet } from '../../components/ui/overlay/RecapSheet';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnimeFillerData } from '../../hooks/manga/useAnimeFillerData';
import { useCharacterDescriptions } from '../../hooks/series/useCharacterDescriptions';
import { useEpisodeDiscussionCounts } from '../../hooks/social/discussionCountHooks';
import { useRecapData } from '../../hooks/watch/useRecapData';
import { CharacterGuide } from './sections/CharacterGuide';
import { calculateOverallRating } from '../../lib/rating/rating';
import { notePositiveMoment } from '../../services/app/appReview';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { findNextEpisode, markNextEpisodeWatched } from '../../hooks/watch/markNextEpisode';
import { findNextEpisodePosition } from '../../lib/episode/nextEpisode';
import { calculateWatchingPace, formatPaceLine } from '../../lib/date/paceCalculation';
import { getNextRewatchEpisode, hasActiveRewatch } from '../../lib/validation/rewatch.utils';
import { CrossoverEditorSheet } from '../../components/crossover/CrossoverEditorSheet';
import { CrossoverSheet } from '../../components/crossover/CrossoverSheet';
import { useSeriesCrossovers } from '../../hooks/series/useCrossovers';
import { CrossoverSection } from './sections/CrossoverSection';
import { DropOffSection } from './sections/DropOffSection';
import { FeverCurveSection } from './sections/FeverCurveSection';
import { FriendsProgressStrip } from './sections/FriendsProgressStrip';
import { HeroSection } from './sections/HeroSection';
import { SeasonsSection } from './sections/SeasonsSection';
import { SeriesDetailDialogs } from './dialogs/SeriesDetailDialogs';
import { useFriendsSeriesProgress } from './hooks/useFriendsSeriesProgress';
import { useSeriesActions } from './hooks/useSeriesActions';
import { useSeriesData } from './hooks/useSeriesData';
import { dateLocale, t } from '../../services/i18n';
import './SeriesDetailPage.css';

export const SeriesDetailPage = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'cast' | 'characters'>('info');
  const [markingNext, setMarkingNext] = useState(false);

  const { isMobile } = useDeviceType();

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
      const marked = await markNextEpisodeWatched(user.uid, series);
      if (marked && nextEpisode) showBulkMarkNudge(nextEpisode.seasonIndex, nextEpisode.episodeId);
    } finally {
      setMarkingNext(false);
    }
  };

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
    handleEpisodeRate,
    handleEpisodeQuickToggle,
    handleSeasonMarkWatched,
    showBulkMarkNudge,
    handleStartRewatch,
    handleStopRewatch,
  } = useSeriesActions(series, user?.uid, tmdbSeries ?? undefined);

  const recap = useRecapData(localSeries ?? undefined);
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

    // Staffel der nächsten offenen Folge (ab der zuletzt gesehenen vorwärts, sonst von vorn)
    setSelectedSeasonIndex(findNextEpisodePosition(series)?.seasonIndex ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series?.id]);

  // Restore tab selection after series data is loaded
  useEffect(() => {
    if (!series) return;
    const savedTab = sessionStorage.getItem(`series_${id}_tab`) as
      'info' | 'cast' | 'characters' | null;
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

  const selectedSeasonData = series?.seasons?.[selectedSeasonIndex];
  const episodeDiscussionCounts = useEpisodeDiscussionCounts(
    Number(id) || 0,
    (selectedSeasonData?.seasonNumber || 0) + 1,
    selectedSeasonData?.episodes?.length || 0
  );

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

  // Erfolgsmoment „Serie durch": nur die Flanke innerhalb dieser Sitzung zählt,
  // sonst feuert jeder erneute Aufruf einer längst beendeten Serie mit.
  const prevPercentageRef = useRef<number | null>(null);
  useEffect(() => {
    if (progressStats.total === 0) return;
    const prev = prevPercentageRef.current;
    prevPercentageRef.current = progressStats.percentage;
    if (prev !== null && prev < 100 && progressStats.percentage === 100) {
      notePositiveMoment();
    }
  }, [progressStats]);

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

  // Crossover-Datenbank (gemeinsam, von allen erweiterbar) — Sheet zum Ansehen + Editor.
  const seriesTmdbId = Number(series?.tmdb_id || series?.id) || undefined;
  const crossovers = useSeriesCrossovers(seriesTmdbId);
  const [crossoverView, setCrossoverView] = useState<string | null>(null);
  const [crossoverEdit, setCrossoverEdit] = useState<{ id: string | null } | null>(null);
  const crossoverViewEntry = useMemo(
    () => crossovers.index?.entries.find((e) => e.id === crossoverView)?.entry ?? null,
    [crossovers.index, crossoverView]
  );
  const crossoverEditEntry = useMemo(
    () =>
      crossoverEdit?.id
        ? (crossovers.index?.entries.find((e) => e.id === crossoverEdit.id)?.entry ?? null)
        : null,
    [crossovers.index, crossoverEdit]
  );
  const crossoverPrefill = useMemo(
    () =>
      series && seriesTmdbId
        ? {
            id: seriesTmdbId,
            title: series.title,
            poster: series.poster?.poster,
            season: selectedSeasonIndex + 1,
          }
        : undefined,
    [series, seriesTmdbId, selectedSeasonIndex]
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
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>{t('Serie nicht gefunden')}</h2>
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
          {t('Zurück')}
        </button>
      </div>
    );
  }

  if (loading || !series) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>{t('Lade...')}</p>
      </div>
    );
  }

  const warningColor = currentTheme.accent;

  const overview = series.beschreibung || series.overview || tmdbOverview || undefined;
  const firstAired = tmdbFirstAirDate || series.first_air_date || series.release_date;
  const genreNames = (series.genre?.genres ?? []).filter((g) => g && g !== 'All');
  const statusLabel =
    series.status === 'Returning Series' || series.status === 'ongoing'
      ? t('Wird fortgesetzt')
      : series.status === 'Ended' || series.status === 'Canceled'
        ? t('Beendet')
        : series.status;
  const friendsStrip = friendsProgress.entries.length > 0 && (
    <FriendsProgressStrip
      entries={friendsProgress.entries}
      userPercentage={progressStats.percentage}
      userWatched={progressStats.watched}
      isMobile={isMobile}
    />
  );
  // Aussteiger-Radar — anonymes Abbruch-Aggregat (rendert nur mit Daten)
  const dropOff = (
    <Deferred>
      <DropOffSection seriesId={series.id} currentTheme={currentTheme} isMobile />
    </Deferred>
  );
  // Crossover — Mehrteiler über Serien hinweg, mit Sehstatus je Teil
  const crossoverBlock = (
    <CrossoverSection
      seriesId={seriesTmdbId ?? series.id}
      refs={crossovers.refs}
      currentTheme={currentTheme}
      isMobile
      onOpen={setCrossoverView}
      onAdd={() => setCrossoverEdit({ id: null })}
    />
  );
  // Buchvorlage aus Wikidata — rendert nur, wenn es eine gibt
  const basedOnBook = (
    <Deferred>
      <BasedOnBookSection tmdbId={Number(series.tmdb_id || series.id)} kind="series" isMobile />
    </Deferred>
  );
  const facts = (
    <div className={isMobile ? 'dk-slot' : undefined}>
      <RailSection title={t('Auf einen Blick')}>
        <FactList
          facts={[
            { label: t('Status'), value: statusLabel },
            {
              label: t('Erstausstrahlung'),
              value: firstAired
                ? new Date(firstAired).toLocaleDateString(dateLocale(), {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : null,
            },
            { label: t('Staffeln'), value: series.seasons?.length || null },
            { label: t('Folgen'), value: progressStats.total || null },
            {
              label: t('Laufzeit'),
              value: series.episodeRuntime
                ? t('{n} Min. pro Folge', { n: series.episodeRuntime })
                : null,
            },
            {
              label: t('Originaltitel'),
              value:
                series.original_name && series.original_name !== series.title
                  ? series.original_name
                  : null,
            },
            { label: t('Genres'), value: genreNames.join(', ') },
          ]}
        />
      </RailSection>
    </div>
  );

  return (
    <div className="dk">
      {/* Bühne */}
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
        overview={overview}
        isReadOnlyTmdbSeries={isReadOnlyTmdbSeries}
        isAdding={isAdding}
        isDeleting={isDeleting}
        isMobile={isMobile}
        nextEpisode={nextEpisode}
        markingNext={markingNext}
        onWatchNext={handleWatchNext}
        onAddSeries={handleAddSeries}
        onNavigateEpisodes={() => navigate(`/episodes/${series.id}`)}
        onNavigateRating={() => navigate(`/rating/series/${series.id}`)}
        onWatchlistToggle={handleWatchlistToggle}
        onHideToggle={handleHideToggle}
        onDelete={handleDeleteSeries}
      />

      {series.hidden && !isReadOnlyTmdbSeries && (
        <div className="dk-note">
          <VisibilityOff style={{ fontSize: '16px' }} />
          {t('Du schaust diese Serie nicht mehr')}
        </div>
      )}

      <div className="dk-layout">
        <div className="dk-main">
          {/* Freunde — auch für nicht getrackte Serien: die Freunde-Daten sind
              unabhängig von der eigenen Liste lesbar. Breit wandern sie in die Seitenleiste. */}
          {isMobile && friendsStrip}

          <DetailTabs
            ariaLabel={t('Serien-Bereiche')}
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              { key: 'info', icon: <List style={{ fontSize: 18 }} />, label: t('Info & Episoden') },
              { key: 'cast', icon: <People style={{ fontSize: 18 }} />, label: t('Besetzung') },
              ...(!isReadOnlyTmdbSeries && characterGuide.userProgress
                ? [
                    {
                      key: 'characters' as const,
                      icon: <AutoAwesome style={{ fontSize: 18 }} />,
                      label: t('KI-Guide'),
                    },
                  ]
                : []),
            ]}
          />

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
              {/* Mobil steht die Handlung hier — breite Ansichten zeigen sie auf der Bühne. */}
              {isMobile && overview && (
                <section className="dk-slot">
                  <h2 className="dk-section__title">{t('Handlung')}</h2>
                  <p className="dk-text">{overview}</p>
                </section>
              )}

              {/* Recap — nur wenn die Serie getrackt ist und es gesehene Folgen gibt */}
              {!isReadOnlyTmdbSeries && recap.recapEpisodes.length > 0 && (
                <div className="dk-slot">
                  <motion.button
                    type="button"
                    onClick={() => setShowRecap(true)}
                    whileTap={{ opacity: 0.7 }}
                    disabled={recap.loading}
                    className="dk-recap"
                    style={{ cursor: recap.loading ? 'wait' : 'pointer' }}
                  >
                    <History style={{ fontSize: 20, color: currentTheme.primary }} />
                    <span className="dk-recap__text">
                      <strong>
                        {recap.recapEpisodes.length === 1
                          ? t('Recap der letzten Folge')
                          : t('Recap der letzten {n} Folgen', { n: recap.recapEpisodes.length })}
                      </strong>
                      {recap.daysSinceLastWatch > 0 && (
                        <span>
                          {recap.daysSinceLastWatch === 1
                            ? t('· zuletzt vor 1 Tag')
                            : t('· zuletzt vor {n} Tagen', { n: recap.daysSinceLastWatch })}
                        </span>
                      )}
                    </span>
                    <ChevronRight style={{ fontSize: 20, opacity: 0.6 }} />
                  </motion.button>
                </div>
              )}

              {/* Anime-Filler/Recap — rendert nur für japanische Animation */}
              <AnimeFillerBanner
                enabled={animeFiller.enabled}
                loading={animeFiller.loading}
                data={animeFiller.data}
                isMobile={isMobile}
                onReload={animeFiller.reload}
              />

              {/* Staffeln + Folgen: das Herz der Seite, deshalb ganz oben. */}
              {series.seasons && series.seasons.length > 0 && (
                <div className="dk-slot">
                  <Deferred>
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
                      onMarkSeasonWatched={(idx) => void handleSeasonMarkWatched(idx)}
                      navigate={navigate}
                      fillerByKey={animeFiller.fillerByKey}
                      crossoverByKey={crossovers.byEpisodeKey}
                      onOpenCrossover={setCrossoverView}
                    />
                  </Deferred>
                </div>
              )}

              {/* Fieberkurve — Community-Folgenbewertungen (rendert nur mit Daten) */}
              <div className="dk-slot">
                <Deferred>
                  <FeverCurveSection
                    series={series}
                    currentTheme={currentTheme}
                    isMobile={isMobile}
                    navigate={navigate}
                  />
                </Deferred>
              </div>

              {/* Schmal stehen Radar, Crossover, Fakten und Buchvorlage im Fluss —
                  breit trägt sie die Seitenleiste. */}
              {isMobile && (
                <>
                  <div className="dk-slot">{dropOff}</div>
                  <div className="dk-slot">{crossoverBlock}</div>
                  {facts}
                  {basedOnBook}
                </>
              )}

              {/* TMDB-Empfehlungen */}
              <Deferred>
                <RecommendationsSection id={series.tmdb_id || series.id} mediaType="tv" />
              </Deferred>
            </>
          )}
        </div>

        {!isMobile && (
          <aside className="dk-rail">
            {friendsStrip}
            {facts}
            <div className="dk-rail__slot">{dropOff}</div>
            <div className="dk-rail__slot">{crossoverBlock}</div>
            <div className="dk-rail__bleed">{basedOnBook}</div>
          </aside>
        )}
      </div>

      {/* Add Button for TMDB-only series */}
      {isReadOnlyTmdbSeries && (
        <div style={{ padding: '20px' }}>
          <motion.button
            onClick={handleAddSeries}
            disabled={isAdding}
            whileTap={{ opacity: isAdding ? 1 : 0.75 }}
            style={{
              width: '100%',
              padding: '16px',
              background: `linear-gradient(135deg, ${currentTheme.primary}cc 0%, ${currentTheme.accent}cc 100%)`,
              border: `1px solid ${currentTheme.primary}80`,
              borderRadius: '12px',
              color: getOptimalTextColor(currentTheme.primary),
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
            {isAdding ? t('Wird hinzugefügt...') : t('Serie hinzufügen')}
          </motion.button>
        </div>
      )}

      <SeriesDetailDialogs
        series={series}
        showRewatchDialog={showRewatchDialog}
        setShowRewatchDialog={setShowRewatchDialog}
        handleEpisodeRewatch={handleEpisodeRewatch}
        handleEpisodeUnwatch={handleEpisodeUnwatch}
        handleEpisodeRate={handleEpisodeRate}
        dialog={dialog}
        setDialog={setDialog}
        snackbar={snackbar}
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

      <CrossoverSheet
        isOpen={crossoverView !== null && crossoverViewEntry !== null}
        id={crossoverView}
        entry={crossoverViewEntry}
        navigate={navigate}
        onClose={() => setCrossoverView(null)}
        onEdit={(id) => {
          setCrossoverView(null);
          setCrossoverEdit({ id });
        }}
      />
      <CrossoverEditorSheet
        isOpen={crossoverEdit !== null}
        id={crossoverEdit?.id ?? null}
        initial={crossoverEditEntry}
        prefill={crossoverPrefill}
        onClose={() => setCrossoverEdit(null)}
        onSaved={(id) => setCrossoverView(id)}
      />
    </div>
  );
});

SeriesDetailPage.displayName = 'SeriesDetailPage';
