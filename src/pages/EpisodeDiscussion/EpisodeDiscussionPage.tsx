import {
  Check,
  DateRange,
  Edit,
  Movie,
  NavigateBefore,
  NavigateNext,
  PlayCircle,
  Star,
  Tv,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { DiscussionThread } from '../../components/Discussion';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { BackButton, LoadingSpinner } from '../../components/ui';
import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { Series } from '../../types/Series';
import { getTVDBIdFromTMDB, getTVDBSeasons, TVDBEpisode, TVDBSeason } from '../../services/tvdbService';

interface TMDBEpisodeDetails {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  season_number: number;
  episode_number: number;
  crew: { id: number; name: string; job: string; profile_path: string | null }[];
  guest_stars: { id: number; name: string; character: string; profile_path: string | null }[];
}

interface TMDBSeasonDetails {
  episodes: {
    id: number;
    name: string;
    episode_number: number;
    still_path: string | null;
    air_date: string;
    vote_average: number;
  }[];
}

export const EpisodeDiscussionPage = () => {
  const { seriesId, seasonNumber, episodeNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();

  const [tmdbDetails, setTmdbDetails] = useState<TMDBEpisodeDetails | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeasonDetails | null>(null);
  const [seriesInfo, setSeriesInfo] = useState<{ name: string; poster_path: string | null; backdrop_path: string | null } | null>(null);
  const [tvdbEpisode, setTvdbEpisode] = useState<TVDBEpisode | null>(null);
  const [tvdbSeasons, setTvdbSeasons] = useState<TVDBSeason[]>([]);
  const [loading, setLoading] = useState(true);

  const series = seriesList.find((s: Series) => s.id === Number(seriesId));
  const localSeason = series?.seasons?.find((s) => s.seasonNumber === Number(seasonNumber) - 1);
  const localEpisode = localSeason?.episodes?.find((_, idx) => idx === Number(episodeNumber) - 1);

  useEffect(() => {
    const fetchAllDetails = async () => {
      const apiKey = import.meta.env.VITE_API_TMDB;
      if (!seriesId || !seasonNumber || !episodeNumber) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const fetchTVDBData = async () => {
          try {
            const tvdbId = await getTVDBIdFromTMDB(Number(seriesId));
            if (tvdbId) {
              const seasons = await getTVDBSeasons(tvdbId);
              setTvdbSeasons(seasons);

              const targetSeasonNum = Number(seasonNumber);
              const targetEpisodeNum = Number(episodeNumber);
              const season = seasons.find(s => s.seasonNumber === targetSeasonNum);
              const episode = season?.episodes.find(e => e.number === targetEpisodeNum);

              if (episode) {
                setTvdbEpisode(episode);
              }
            }
          } catch (error) {
            console.error('Error fetching TVDB data:', error);
          }
        };

        const fetchTMDBData = async () => {
          if (!apiKey) return;

          try {
            const [episodeRes, seasonRes, seriesRes] = await Promise.all([
              fetch(
                `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${apiKey}&language=de-DE&append_to_response=images`
              ),
              fetch(
                `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?api_key=${apiKey}&language=de-DE`
              ),
              fetch(
                `https://api.themoviedb.org/3/tv/${seriesId}?api_key=${apiKey}&language=de-DE`
              ),
            ]);

            if (episodeRes.ok) {
              const data = await episodeRes.json();
              setTmdbDetails(data);
            }

            if (seasonRes.ok) {
              const data = await seasonRes.json();
              setSeasonDetails(data);
            }

            if (seriesRes.ok) {
              const data = await seriesRes.json();
              setSeriesInfo({
                name: data.name,
                poster_path: data.poster_path,
                backdrop_path: data.backdrop_path,
              });
            }
          } catch (error) {
            console.error('Error fetching TMDB data:', error);
          }
        };

        await Promise.all([fetchTVDBData(), fetchTMDBData()]);
      } catch (error) {
        console.error('Error fetching episode details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [seriesId, seasonNumber, episodeNumber]);

  const getStillUrl = (path: string | null, size: string = 'w780'): string => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  const getProfileUrl = (path: string | null): string => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  const currentEpNum = Number(episodeNumber);
  const currentSeasonNum = Number(seasonNumber);
  const tvdbSeason = tvdbSeasons.find(s => s.seasonNumber === currentSeasonNum);
  const totalEpisodes = tvdbSeason?.episodes?.length || localSeason?.episodes?.length || seasonDetails?.episodes?.length || 0;

  const prevTvdbSeason = tvdbSeasons.find(s => s.seasonNumber === currentSeasonNum - 1);
  const nextTvdbSeason = tvdbSeasons.find(s => s.seasonNumber === currentSeasonNum + 1);
  const prevLocalSeason = series?.seasons?.find((s) => s.seasonNumber === currentSeasonNum - 2);
  const nextLocalSeason = series?.seasons?.find((s) => s.seasonNumber === currentSeasonNum);

  const hasPrevInSeason = currentEpNum > 1;
  const prevSeasonEpisodeCount = prevTvdbSeason?.episodes?.length || prevLocalSeason?.episodes?.length || 0;
  const hasPrevSeason = currentSeasonNum > 1 && prevSeasonEpisodeCount > 0;
  const hasPrevEpisode = hasPrevInSeason || hasPrevSeason;

  const hasNextInSeason = currentEpNum < totalEpisodes;
  const nextSeasonExists = nextTvdbSeason?.episodes?.length || nextLocalSeason?.episodes?.length || 0;
  const hasNextSeason = nextSeasonExists > 0;
  const hasNextEpisode = hasNextInSeason || hasNextSeason;

  const goToPrevEpisode = () => {
    if (hasPrevInSeason) {
      navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${currentEpNum - 1}`, { replace: true });
    } else if (hasPrevSeason) {
      navigate(`/episode/${seriesId}/s/${currentSeasonNum - 1}/e/${prevSeasonEpisodeCount}`, { replace: true });
    }
  };

  const goToNextEpisode = () => {
    if (hasNextInSeason) {
      navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${currentEpNum + 1}`, { replace: true });
    } else if (hasNextSeason) {
      navigate(`/episode/${seriesId}/s/${currentSeasonNum + 1}/e/1`, { replace: true });
    }
  };

  const handleToggleWatched = async () => {
    if (!user?.uid || !series || !localSeason || !localEpisode) return;

    try {
      const episodeIndex = Number(episodeNumber) - 1;
      const seasonIndex = series.seasons.findIndex((s) => s.seasonNumber === Number(seasonNumber) - 1);

      if (seasonIndex === -1) return;

      const isCurrentlyWatched = localEpisode.watched;

      const updatedEpisodes = localSeason.episodes!.map((ep, idx) => {
        if (idx === episodeIndex) {
          if (isCurrentlyWatched) {
            const { watchCount, firstWatchedAt, lastWatchedAt, ...rest } = ep as Series['seasons'][number]['episodes'][number] & { watchCount?: number; firstWatchedAt?: string; lastWatchedAt?: string };
            return { ...rest, watched: false };
          } else {
            return {
              ...ep,
              watched: true,
              watchCount: 1,
              firstWatchedAt: new Date().toISOString(),
              lastWatchedAt: new Date().toISOString(),
            };
          }
        }
        return ep;
      });

      const updatedSeasons = series.seasons.map((s, idx) => {
        if (idx === seasonIndex) {
          return { ...s, episodes: updatedEpisodes };
        }
        return s;
      });

      await firebase.database().ref(`${user.uid}/serien/${series.nmr}/seasons`).set(updatedSeasons);

      if (!isCurrentlyWatched) {
        WatchActivityService.logEpisodeWatch(
          user.uid,
          series.id,
          series.title || series.name || 'Unbekannte Serie',
          series.nmr,
          Number(seasonNumber),
          Number(episodeNumber),
          localEpisode.name,
          series.episodeRuntime || 45,
          false,
          1,
          series.genre?.genres,
          series.provider?.provider?.map(p => p.name)
        );

        // Pet XP vergeben
        await petService.watchedSeriesWithGenreAllPets(user.uid, series.genre?.genres || []);
      }
    } catch (error) {
      console.error('Error toggling watched status:', error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: currentTheme.background.default,
          gap: '20px',
          position: 'relative',
        }}
      >
        {/* Decorative background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 30% 20%, ${currentTheme.primary}15 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, #8b5cf615 0%, transparent 50%)`,
          pointerEvents: 'none',
        }} />

        <LoadingSpinner size={50} text="Lade Episodendetails..." />
      </div>
    );
  }

  if (!series && !tvdbEpisode && !tmdbDetails && !seriesInfo) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: currentTheme.background.default,
          position: 'relative',
        }}
      >
        {/* Decorative background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${currentTheme.primary}10 0%, transparent 50%)`,
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '40px',
            background: currentTheme.background.card,
            borderRadius: '24px',
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <Movie style={{ fontSize: '72px', color: currentTheme.text.muted, marginBottom: '20px' }} />
          <h2 style={{
            color: currentTheme.text.primary,
            marginBottom: '12px',
            fontSize: '22px',
            fontWeight: 800,
          }}>
            Episode nicht gefunden
          </h2>
          <p style={{ color: currentTheme.text.muted, marginBottom: '28px', fontSize: '15px' }}>
            Diese Episode konnte nicht geladen werden.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            style={{
              padding: '14px 32px',
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              border: 'none',
              borderRadius: '14px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '15px',
              boxShadow: `0 4px 15px ${currentTheme.primary}40`,
            }}
          >
            Zurück
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const episodeName = tvdbEpisode?.name || localEpisode?.name || tmdbDetails?.name || `Episode ${episodeNumber}`;
  const episodeOverview = tvdbEpisode?.overview || tmdbDetails?.overview || '';
  const episodeAirDate = tvdbEpisode?.aired || localEpisode?.air_date || localEpisode?.airDate || localEpisode?.firstAired || tmdbDetails?.air_date;
  const episodeRuntime = tvdbEpisode?.runtime || tmdbDetails?.runtime;
  const episodeRating = tmdbDetails?.vote_average;
  const stillPath = tmdbDetails?.still_path;
  const guestStars = tmdbDetails?.guest_stars || [];
  const directors = tmdbDetails?.crew?.filter((c) => c.job === 'Director') || [];
  const writers = tmdbDetails?.crew?.filter((c) => c.job === 'Writer' || c.job === 'Screenplay') || [];
  const seriesTitle = series?.title || seriesInfo?.name || 'Serie';

  const prevTvdbEpisodeInSeason = tvdbSeason?.episodes?.find((e) => e.number === currentEpNum - 1);
  const prevTmdbEpisodeInSeason = seasonDetails?.episodes?.find((e) => e.episode_number === currentEpNum - 1);
  const lastEpisodeOfPrevSeason = prevTvdbSeason?.episodes?.[prevTvdbSeason.episodes.length - 1];

  const prevEpisode = hasPrevInSeason
    ? (prevTvdbEpisodeInSeason || prevTmdbEpisodeInSeason)
    : lastEpisodeOfPrevSeason;
  const prevEpisodeLabel = hasPrevInSeason
    ? (prevEpisode?.name || `Episode ${currentEpNum - 1}`)
    : (lastEpisodeOfPrevSeason ? `S${currentSeasonNum - 1} E${prevSeasonEpisodeCount}` : '');

  const nextTvdbEpisodeInSeason = tvdbSeason?.episodes?.find((e) => e.number === currentEpNum + 1);
  const nextTmdbEpisodeInSeason = seasonDetails?.episodes?.find((e) => e.episode_number === currentEpNum + 1);
  const firstEpisodeOfNextSeason = nextTvdbSeason?.episodes?.find((e) => e.number === 1);

  const nextEpisode = hasNextInSeason
    ? (nextTvdbEpisodeInSeason || nextTmdbEpisodeInSeason)
    : firstEpisodeOfNextSeason;
  const nextEpisodeLabel = hasNextInSeason
    ? (nextEpisode?.name || `Episode ${currentEpNum + 1}`)
    : (firstEpisodeOfNextSeason ? `S${currentSeasonNum + 1} E1` : '');

  return (
    <div style={{
      background: currentTheme.background.default,
      minHeight: '100vh',
      paddingBottom: '40px',
      position: 'relative',
    }}>
      {/* Hero Section */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '340px',
          overflow: 'hidden',
        }}
      >
        {stillPath ? (
          <img
            src={getStillUrl(stillPath, 'original')}
            alt={episodeName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        ) : seriesInfo?.backdrop_path ? (
          <img
            src={getStillUrl(seriesInfo.backdrop_path, 'original')}
            alt={seriesTitle}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: 0.7,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #8b5cf6 100%)`,
            }}
          />
        )}

        {/* Premium Gradient Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom,
              rgba(0,0,0,0.4) 0%,
              transparent 25%,
              transparent 45%,
              ${currentTheme.background.default}dd 85%,
              ${currentTheme.background.default} 100%)`,
          }}
        />

        {/* Top Navigation */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(16px + env(safe-area-inset-top))',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <BackButton
            style={{
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(20,20,40,0.5))',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/series/${seriesId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, rgba(0,0,0,0.5), rgba(20,20,40,0.5))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Tv style={{ fontSize: '16px' }} />
            Zur Serie
          </motion.button>
        </div>

        {/* Episode Info Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px 20px',
          }}
        >
          {/* Series Title Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/series/${seriesId}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              marginBottom: '14px',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Tv style={{ fontSize: '15px', color: '#fff' }} />
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{seriesTitle}</span>
          </motion.div>

          {/* Season & Episode Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                padding: '6px 14px',
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                boxShadow: `0 4px 12px ${currentTheme.primary}50`,
              }}
            >
              S{seasonNumber} E{episodeNumber}
            </span>
            {episodeRating !== undefined && episodeRating > 0 && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,193,7,0.15))',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffd700',
                }}
              >
                <Star style={{ fontSize: '15px' }} />
                {episodeRating.toFixed(1)}
              </span>
            )}
            {localEpisode?.watched && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: `linear-gradient(135deg, ${currentTheme.status.success}30, ${currentTheme.status.success}15)`,
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: currentTheme.status.success,
                }}
              >
                <Check style={{ fontSize: '15px' }} />
                Gesehen
              </span>
            )}
          </motion.div>

          {/* Episode Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: currentTheme.text.primary,
              margin: '0 0 10px 0',
              lineHeight: 1.2,
            }}
          >
            {episodeName}
          </motion.h1>

          {/* Meta Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
              fontSize: '14px',
              color: currentTheme.text.secondary,
            }}
          >
            {episodeAirDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DateRange style={{ fontSize: '18px', color: currentTheme.primary }} />
                {getUnifiedEpisodeDate(episodeAirDate)}
              </span>
            )}
            {episodeRuntime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlayCircle style={{ fontSize: '18px', color: '#8b5cf6' }} />
                {episodeRuntime} Min.
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Premium Quick Actions */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '20px',
          borderBottom: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {series && user && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleWatched}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px',
              background: localEpisode?.watched
                ? `linear-gradient(135deg, ${currentTheme.status.success}25, ${currentTheme.status.success}10)`
                : currentTheme.background.card,
              border: localEpisode?.watched
                ? `1px solid ${currentTheme.status.success}50`
                : `1px solid ${currentTheme.border.default}`,
              borderRadius: '16px',
              color: localEpisode?.watched ? currentTheme.status.success : currentTheme.text.primary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: localEpisode?.watched ? `0 4px 15px ${currentTheme.status.success}20` : 'none',
            }}
          >
            {localEpisode?.watched ? (
              <>
                <Visibility style={{ fontSize: '22px' }} />
                Gesehen
              </>
            ) : (
              <>
                <VisibilityOff style={{ fontSize: '22px' }} />
                Als gesehen markieren
              </>
            )}
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/episodes/${seriesId}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 18px',
            background: currentTheme.background.card,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            color: currentTheme.text.primary,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <Edit style={{ fontSize: '20px' }} />
        </motion.button>
      </div>

      {/* Premium Episode Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '16px 20px',
          background: currentTheme.background.surface,
          borderBottom: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <motion.button
          whileTap={{ scale: hasPrevEpisode ? 0.95 : 1 }}
          onClick={goToPrevEpisode}
          disabled={!hasPrevEpisode}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            background: currentTheme.background.card,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            cursor: hasPrevEpisode ? 'pointer' : 'default',
            opacity: hasPrevEpisode ? 1 : 0.4,
            textAlign: 'left',
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: hasPrevEpisode ? currentTheme.background.surfaceHover : currentTheme.background.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <NavigateBefore style={{ fontSize: '24px', color: currentTheme.text.muted }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', color: currentTheme.text.muted, margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Vorherige
            </p>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.primary,
                margin: '3px 0 0 0',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {prevEpisodeLabel}
            </p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: hasNextEpisode ? 0.95 : 1 }}
          onClick={goToNextEpisode}
          disabled={!hasNextEpisode}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px',
            background: hasNextEpisode
              ? `linear-gradient(135deg, ${currentTheme.primary}12, #8b5cf612)`
              : currentTheme.background.card,
            border: hasNextEpisode
              ? `1px solid ${currentTheme.primary}30`
              : `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            cursor: hasNextEpisode ? 'pointer' : 'default',
            opacity: hasNextEpisode ? 1 : 0.4,
            textAlign: 'right',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', color: currentTheme.text.muted, margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nächste
            </p>
            <p
              style={{
                fontSize: '14px',
                color: currentTheme.text.primary,
                margin: '3px 0 0 0',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nextEpisodeLabel}
            </p>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: hasNextEpisode
              ? `linear-gradient(135deg, ${currentTheme.primary}30, #8b5cf630)`
              : currentTheme.background.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <NavigateNext style={{ fontSize: '24px', color: hasNextEpisode ? currentTheme.primary : currentTheme.text.muted }} />
          </div>
        </motion.button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Premium Overview */}
        <AnimatePresence>
          {episodeOverview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '24px',
                padding: '20px',
                background: currentTheme.background.card,
                borderRadius: '20px',
                border: `1px solid ${currentTheme.border.default}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '150px',
                height: '150px',
                background: `radial-gradient(circle, ${currentTheme.primary}10 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Movie style={{ fontSize: '18px', color: currentTheme.primary }} />
                </div>
                Handlung
              </h3>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.75,
                  color: currentTheme.text.secondary,
                  margin: 0,
                }}
              >
                {episodeOverview}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Crew Info */}
        {(directors.length > 0 || writers.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            {directors.length > 0 && (
              <div
                style={{
                  padding: '18px',
                  background: currentTheme.background.card,
                  borderRadius: '16px',
                  border: `1px solid ${currentTheme.border.default}`,
                }}
              >
                <h4
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: currentTheme.text.muted,
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Regie
                </h4>
                {directors.slice(0, 2).map((d, i) => (
                  <p key={i} style={{
                    fontSize: '14px',
                    color: currentTheme.text.primary,
                    margin: i > 0 ? '6px 0 0 0' : 0,
                    fontWeight: 600,
                  }}>
                    {d.name}
                  </p>
                ))}
              </div>
            )}
            {writers.length > 0 && (
              <div
                style={{
                  padding: '18px',
                  background: currentTheme.background.card,
                  borderRadius: '16px',
                  border: `1px solid ${currentTheme.border.default}`,
                }}
              >
                <h4
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: currentTheme.text.muted,
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Drehbuch
                </h4>
                {writers.slice(0, 2).map((w, i) => (
                  <p key={i} style={{
                    fontSize: '14px',
                    color: currentTheme.text.primary,
                    margin: i > 0 ? '6px 0 0 0' : 0,
                    fontWeight: 600,
                  }}>
                    {w.name}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Premium Guest Stars */}
        {guestStars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              marginBottom: '24px',
              padding: '20px',
              background: currentTheme.background.card,
              borderRadius: '20px',
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: currentTheme.text.primary,
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              Gaststars
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: currentTheme.primary,
                background: `${currentTheme.primary}15`,
                padding: '4px 10px',
                borderRadius: '8px',
              }}>
                {guestStars.length}
              </span>
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '18px',
                overflowX: 'auto',
                paddingBottom: '8px',
                WebkitOverflowScrolling: 'touch',
                margin: '0 -20px',
                padding: '0 20px 8px 20px',
              }}
            >
              {guestStars.slice(0, 15).map((star, index) => (
                <motion.div
                  key={star.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    flexShrink: 0,
                    width: '95px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '75px',
                      height: '75px',
                      borderRadius: '50%',
                      margin: '0 auto 12px',
                      overflow: 'hidden',
                      background: currentTheme.background.surface,
                      border: `3px solid ${currentTheme.border.default}`,
                      boxShadow: `0 6px 16px ${currentTheme.background.default}80`,
                    }}
                  >
                    {star.profile_path ? (
                      <img
                        src={getProfileUrl(star.profile_path)}
                        alt={star.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '32px',
                          background: `linear-gradient(135deg, ${currentTheme.primary}30, #8b5cf630)`,
                        }}
                      >
                        👤
                      </div>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                      margin: '0 0 4px 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {star.name}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: currentTheme.primary,
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 600,
                    }}
                  >
                    {star.character}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Discussion Thread */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DiscussionThread
            itemId={Number(seriesId)}
            itemType="episode"
            seasonNumber={Number(seasonNumber)}
            episodeNumber={Number(episodeNumber)}
            title="Episoden-Diskussion"
            isWatched={localEpisode?.watched}
            feedMetadata={{
              itemTitle: seriesTitle,
              posterPath: seriesInfo?.poster_path || undefined,
              episodeTitle: episodeName,
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
