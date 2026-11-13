import { Check, SkipNext } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnimeFillerData } from '../../hooks/manga/useAnimeFillerData';
import { useSeriesCrossovers } from '../../hooks/series/useCrossovers';
import { CrossoverSheet } from '../../components/crossover/CrossoverSheet';
import { CrossoverStrip } from '../../components/crossover/CrossoverStrip';
import { crossoverSeasonKey } from '../../lib/crossover/crossoverIndex';
import { useEpisodeRatings } from '../../hooks/rating/useCommunityRatings';
import { StarRatingSlider } from '../../components/ui/input/StarRatingSlider';
import { setEpisodeRating } from '../../services/rating/episodeRatingService';
import { showToast } from '../../lib/interaction/toast';
import { fillerLookupKey } from '../../services/catalog/animeFillerService';
import { t } from '../../services/i18n';
import { useEpisodeDiscussion } from './useEpisodeDiscussion';
import { ShareEpisodeSheet } from './ShareEpisodeSheet';
import {
  DiscussionSection,
  EpisodeNavigation,
  GuestStarsSection,
  LoadingState,
  NotFoundState,
  OverviewSection,
} from './EpisodeDiscussionComponents';
import { EpisodeStage } from './EpisodeStage';
import { SeasonEpisodeList } from './SeasonEpisodeList';
import { FactList, RailSection } from '../../components/detail/kit/DetailKit';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import './EpisodeDiscussionPage.css';

export const EpisodeDiscussionPage = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { isMobile } = useDeviceType();

  const {
    seriesId,
    seasonNumber,
    episodeNumber,
    navigate,
    loading,
    isNotFound,
    series,
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
    formattedLastWatchedAt,
    watchCount,
    navigation,
    handleToggleWatched,
    nextEpisodeTransition,
    getStillUrl,
    getProfileUrl,
  } = useEpisodeDiscussion();

  // Folgenbewertung: lokale Episode (userRating + id + seasonIndex) auflösen.
  const localEpisode = useMemo(() => {
    const sn = Number(seasonNumber);
    const en = Number(episodeNumber);
    if (!series?.seasons || !sn || !en) return null;
    const seasonIndex = series.seasons.findIndex((s) => (s.seasonNumber ?? 0) + 1 === sn);
    const episode = series.seasons[seasonIndex]?.episodes?.[en - 1];
    if (seasonIndex === -1 || !episode?.id) return null;
    return { seasonIndex, episodeId: episode.id, userRating: episode.userRating };
  }, [series, seasonNumber, episodeNumber]);

  const communityEpisodeRatings = useEpisodeRatings(series?.id);
  const communityEntry = localEpisode
    ? (communityEpisodeRatings?.[String(localEpisode.episodeId)] ?? null)
    : null;

  const currentRating = localEpisode?.userRating || 0;
  const [draft, setDraft] = useState(currentRating);
  const [shareOpen, setShareOpen] = useState(false);
  const sharedEpisode = useMemo(
    () => ({
      seriesId: Number(seriesId),
      season: Number(seasonNumber),
      episode: Number(episodeNumber),
      seriesTitle: seriesTitle || '',
      episodeTitle: episodeName || undefined,
      poster: seriesInfo?.poster_path || undefined,
    }),
    [seriesId, seasonNumber, episodeNumber, seriesTitle, episodeName, seriesInfo?.poster_path]
  );
  // Auch auf die Folge hören, nicht nur auf den Wert: hat die nächste Folge
  // dieselbe Bewertung (meist 0), bliebe der Entwurf sonst stehen und würde
  // beim Speichern der FALSCHEN Folge zugeschrieben.
  useEffect(() => {
    setDraft(currentRating);
  }, [currentRating, localEpisode?.episodeId]);
  const ratingDirty = draft !== currentRating;

  const saveRating = useCallback(
    async (raw: number) => {
      if (!user || !series || !localEpisode) return;
      const value = raw >= 0.5 ? raw : null;
      try {
        await setEpisodeRating(
          user.uid,
          series.id,
          localEpisode.seasonIndex,
          localEpisode.episodeId,
          value
        );
        showToast(
          value
            ? t('Folge mit {n}/10 bewertet', { n: value.toFixed(1) })
            : t('Folgenbewertung entfernt'),
          2000,
          'success'
        );
      } catch {
        showToast(t('Fehler beim Speichern'), 2500, 'error');
      }
    },
    [user, series, localEpisode]
  );

  // Ende der Regler-Eingabe: hier speichern, nicht bei jeder Zwischenstufe.
  const handleCommitRating = useCallback(
    (value: number) => {
      if (value === currentRating) return;
      void saveRating(value);
    },
    [currentRating, saveRating]
  );

  // Abhaken springt zur nächsten Folge — ein noch offener Entwurf (etwa per
  // Tastatur ohne Enter) wäre sonst verloren. Vorher festschreiben.
  const handleToggleWatchedAndRating = useCallback(async () => {
    if (ratingDirty) await saveRating(draft);
    await handleToggleWatched();
  }, [ratingDirty, draft, saveRating, handleToggleWatched]);

  // Anime filler/recap data – backend-driven, no direct AniList/Jikan calls.
  const animeFiller = useAnimeFillerData(series?.tmdb_id || series?.id, series?.seasons);
  const currentFiller =
    seasonNumber && episodeNumber
      ? animeFiller.fillerByKey.get(fillerLookupKey(Number(seasonNumber), Number(episodeNumber)))
      : undefined;
  const fillerInfo = currentFiller
    ? { filler: currentFiller.filler, recap: currentFiller.recap }
    : null;

  // Crossover-Teil dieser Folge (gemeinsame Datenbank) + Sheet mit der ganzen Reihenfolge.
  const crossovers = useSeriesCrossovers(Number(series?.tmdb_id || seriesId) || undefined);
  const crossoverRefs = useMemo(
    () =>
      seasonNumber && episodeNumber
        ? crossovers.byEpisodeKey.get(
            crossoverSeasonKey(Number(seasonNumber), Number(episodeNumber))
          ) || []
        : [],
    [crossovers.byEpisodeKey, seasonNumber, episodeNumber]
  );
  const [crossoverView, setCrossoverView] = useState<string | null>(null);
  const crossoverViewEntry = crossoverView
    ? (crossovers.index?.entries.find((e) => e.id === crossoverView)?.entry ?? null)
    : null;

  const season = localEpisode ? series?.seasons?.[localEpisode.seasonIndex] : undefined;
  const seasonEpisodes = useMemo(
    () => (season?.episodes ?? []).map((e) => ({ key: e.id, watched: !!e.watched })),
    [season]
  );

  if (loading) {
    return <LoadingState currentTheme={currentTheme} />;
  }

  if (isNotFound) {
    return <NotFoundState currentTheme={currentTheme} onGoBack={() => navigate(-1)} />;
  }

  const facts = (
    <RailSection title={t('Auf einen Blick')}>
      <FactList
        facts={[
          { label: t('Erstausstrahlung'), value: episodeAirDate ? formattedAirDate : null },
          { label: t('Regie'), value: directors.map((d) => d.name).join(', ') },
          { label: t('Drehbuch'), value: writers.map((w) => w.name).join(', ') },
          {
            label: t('Laufzeit'),
            value: episodeRuntime ? t('{n} Min.', { n: episodeRuntime }) : null,
          },
          { label: t('Erstmals gesehen'), value: isWatched ? formattedFirstWatchedAt : null },
          { label: t('Zuletzt gesehen'), value: isWatched ? formattedLastWatchedAt : null },
          { label: t('Mal gesehen'), value: watchCount > 1 ? `${watchCount}×` : null },
        ]}
      />
    </RailSection>
  );
  const seasonList = season ? (
    <SeasonEpisodeList
      seasonNumber={Number(seasonNumber)}
      currentEpisode={Number(episodeNumber)}
      episodes={(season.episodes ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        watched: !!e.watched,
      }))}
      onOpen={(n) => navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${n}`)}
    />
  ) : null;

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
              backdropFilter: 'var(--blur-lg)',
              WebkitBackdropFilter: 'var(--blur-lg)',
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
                {t('Nächste Episode')}
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

      <div className="dk">
        <EpisodeStage
          currentTheme={currentTheme}
          stillPath={stillPath}
          backdropPath={seriesInfo?.backdrop_path}
          posterPath={seriesInfo?.poster_path}
          episodeName={episodeName}
          seriesTitle={seriesTitle}
          seriesId={seriesId}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          episodeRating={episodeRating}
          ownRating={draft}
          community={communityEntry}
          episodeRuntime={episodeRuntime}
          formattedAirDate={episodeAirDate ? formattedAirDate : null}
          watchCount={watchCount}
          isWatched={isWatched}
          fillerInfo={fillerInfo}
          seasonEpisodes={seasonEpisodes}
          canTrack={hasUser && hasSeries}
          rating={
            hasUser && hasSeries && localEpisode ? (
              <StarRatingSlider
                value={draft}
                onChange={setDraft}
                onCommit={handleCommitRating}
                size={24}
                showValue={false}
              />
            ) : undefined
          }
          onToggleWatched={handleToggleWatchedAndRating}
          onOpenEpisode={(n) => navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${n}`)}
          onShare={hasUser ? () => setShareOpen(true) : undefined}
          getStillUrl={getStillUrl}
          navigate={navigate}
        />

        <CrossoverStrip refs={crossoverRefs} navigate={navigate} onOpen={setCrossoverView} />
        <CrossoverSheet
          isOpen={crossoverView !== null && crossoverViewEntry !== null}
          id={crossoverView}
          entry={crossoverViewEntry}
          navigate={navigate}
          onClose={() => setCrossoverView(null)}
        />

        <EpisodeNavigation currentTheme={currentTheme} navigation={navigation} />

        <div className="dk-layout">
          <div className="dk-main ed-content">
            <OverviewSection
              currentTheme={currentTheme}
              episodeOverview={episodeOverview}
              isWatched={isWatched}
            />

            <GuestStarsSection
              currentTheme={currentTheme}
              guestStars={guestStars}
              getProfileUrl={getProfileUrl}
              onPersonClick={(personId) => navigate(`/person/${personId}`)}
            />

            {isMobile && (
              <div className="ed-rail-inline">
                {facts}
                {seasonList}
              </div>
            )}

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

          {!isMobile && (
            <aside className="dk-rail">
              {facts}
              {seasonList}
            </aside>
          )}
        </div>
      </div>
      {hasUser && sharedEpisode.seriesTitle && (
        <ShareEpisodeSheet
          episode={sharedEpisode}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
});

EpisodeDiscussionPage.displayName = 'EpisodeDiscussionPage';
