import { Check, SkipNext } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnimeFillerData } from '../../hooks/useAnimeFillerData';
import { useEpisodeRatings } from '../../hooks/useCommunityRatings';
import { StarRatingSlider } from '../../components/ui/StarRatingSlider';
import { setEpisodeRating } from '../../services/episodeRatingService';
import { showToast } from '../../lib/toast';
import { fillerLookupKey } from '../../services/animeFillerService';
import { t } from '../../services/i18n';
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
  const { user } = useAuth() || {};

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

  if (loading) {
    return <LoadingState currentTheme={currentTheme} />;
  }

  if (isNotFound) {
    return <NotFoundState currentTheme={currentTheme} onGoBack={() => navigate(-1)} />;
  }

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

      {/* Kein Swipe-Wechsel zur nächsten/vorigen Folge mehr — Navigation nur
          über die Buttons (der Drag kollidierte mit Scroll und Sternen). */}
      <div>
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
          formattedLastWatchedAt={formattedLastWatchedAt}
          watchCount={watchCount}
          isWatched={isWatched}
          fillerInfo={fillerInfo}
          getStillUrl={getStillUrl}
          navigate={navigate}
        />

        {/* Folgenbewertung: eigene Sterne + Community-Durchschnitt */}
        {hasUser && hasSeries && localEpisode && (
          <div
            style={{
              margin: '12px 16px',
              padding: '14px 16px',
              borderRadius: '16px',
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border?.default || 'rgba(255,255,255,0.1)'}`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: currentTheme.text.muted,
                marginBottom: '8px',
              }}
            >
              {t('Folge bewerten')}
            </div>
            <StarRatingSlider
              value={draft}
              onChange={setDraft}
              onCommit={handleCommitRating}
              size={22}
            />
            {communityEntry && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: currentTheme.primary,
                }}
              >
                {t('Community: {n}/10 ({c} Bewertungen)', {
                  n: communityEntry.a,
                  c: communityEntry.c,
                })}
              </div>
            )}
          </div>
        )}

        <QuickActions
          currentTheme={currentTheme}
          hasUser={hasUser}
          hasSeries={hasSeries}
          isWatched={isWatched}
          seriesId={seriesId}
          onToggleWatched={handleToggleWatchedAndRating}
          navigate={navigate}
        />

        <EpisodeNavigation currentTheme={currentTheme} navigation={navigation} />

        <div className="ed-content">
          <OverviewSection
            currentTheme={currentTheme}
            episodeOverview={episodeOverview}
            isWatched={isWatched}
          />

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
    </div>
  );
});

EpisodeDiscussionPage.displayName = 'EpisodeDiscussionPage';
