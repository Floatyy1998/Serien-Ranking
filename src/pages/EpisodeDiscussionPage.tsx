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
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../App';
import { BackButton } from '../components/BackButton';
import { DiscussionThread } from '../components/DiscussionThread';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { getUnifiedEpisodeDate } from '../lib/date/episodeDate.utils';
import { Series } from '../types/Series';
import { getTVDBIdFromTMDB, getTVDBSeasons, TVDBEpisode, TVDBSeason } from '../services/tvdbService';

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

  // Find the series locally
  const series = seriesList.find((s: Series) => s.id === Number(seriesId));

  // Find the episode in local data
  const localSeason = series?.seasons?.find((s) => s.seasonNumber === Number(seasonNumber) - 1);
  const localEpisode = localSeason?.episodes?.find((_, idx) => idx === Number(episodeNumber) - 1);

  // Fetch episode details from TVDB and TMDB
  useEffect(() => {
    const fetchAllDetails = async () => {
      const apiKey = import.meta.env.VITE_API_TMDB;
      if (!seriesId || !seasonNumber || !episodeNumber) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch TVDB data (primary source for episode info)
        const fetchTVDBData = async () => {
          try {
            const tvdbId = await getTVDBIdFromTMDB(Number(seriesId));
            console.log('TVDB ID from TMDB:', tvdbId);
            if (tvdbId) {
              const seasons = await getTVDBSeasons(tvdbId);
              console.log('TVDB Seasons loaded:', seasons.length, 'seasons');
              setTvdbSeasons(seasons);

              // Find the specific episode
              const targetSeasonNum = Number(seasonNumber);
              const targetEpisodeNum = Number(episodeNumber);
              console.log('Looking for Season', targetSeasonNum, 'Episode', targetEpisodeNum);

              const season = seasons.find(s => s.seasonNumber === targetSeasonNum);
              console.log('Found season:', season ? `Season ${season.seasonNumber} with ${season.episodes.length} episodes` : 'NOT FOUND');

              const episode = season?.episodes.find(e => e.number === targetEpisodeNum);
              console.log('Found episode:', episode ? `"${episode.name}"` : 'NOT FOUND');

              if (episode) {
                setTvdbEpisode(episode);
              }
            }
          } catch (error) {
            console.error('Error fetching TVDB data:', error);
          }
        };

        // Fetch TMDB data (for images, ratings, crew, etc.)
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

        // Fetch both in parallel
        await Promise.all([fetchTVDBData(), fetchTMDBData()]);
      } catch (error) {
        console.error('Error fetching episode details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [seriesId, seasonNumber, episodeNumber]);

  // Image URLs
  const getStillUrl = (path: string | null, size: string = 'w780'): string => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  const getProfileUrl = (path: string | null): string => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  // Navigation - prioritize TVDB data for episode count
  const currentEpNum = Number(episodeNumber);
  const currentSeasonNum = Number(seasonNumber);
  const tvdbSeason = tvdbSeasons.find(s => s.seasonNumber === currentSeasonNum);
  const totalEpisodes = tvdbSeason?.episodes?.length || localSeason?.episodes?.length || seasonDetails?.episodes?.length || 0;
  const hasPrevEpisode = currentEpNum > 1;
  const hasNextEpisode = currentEpNum < totalEpisodes;

  const goToPrevEpisode = () => {
    if (hasPrevEpisode) {
      navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${currentEpNum - 1}`, { replace: true });
    }
  };

  const goToNextEpisode = () => {
    if (hasNextEpisode) {
      navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${currentEpNum + 1}`, { replace: true });
    }
  };

  // Toggle watched status
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
            // Unwatch
            const { watchCount, firstWatchedAt, lastWatchedAt, ...rest } = ep as any;
            return { ...rest, watched: false };
          } else {
            // Watch
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
          gap: '16px',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${currentTheme.border.default}`,
            borderTopColor: currentTheme.primary,
            borderRadius: '50%',
          }}
        />
        <p style={{ color: currentTheme.text.muted }}>Lade Episodendetails...</p>
      </div>
    );
  }

  // Show "not found" only if we have no local series AND no TVDB/TMDB data at all
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
        }}
      >
        <Movie style={{ fontSize: '64px', color: currentTheme.text.muted, marginBottom: '16px' }} />
        <h2 style={{ color: currentTheme.text.primary, marginBottom: '8px' }}>Episode nicht gefunden</h2>
        <p style={{ color: currentTheme.text.muted, marginBottom: '24px' }}>
          Diese Episode konnte nicht geladen werden.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            background: currentTheme.primary,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Zurück
        </button>
      </div>
    );
  }

  // Prefer TVDB data over local/TMDB data
  const episodeName = tvdbEpisode?.name || localEpisode?.name || tmdbDetails?.name || `Episode ${episodeNumber}`;
  const episodeOverview = tvdbEpisode?.overview || tmdbDetails?.overview || '';
  const episodeAirDate = tvdbEpisode?.aired || localEpisode?.air_date || localEpisode?.airDate || localEpisode?.firstAired || tmdbDetails?.air_date;
  const episodeRuntime = tvdbEpisode?.runtime || tmdbDetails?.runtime;
  const episodeRating = tmdbDetails?.vote_average; // TMDB only
  const stillPath = tmdbDetails?.still_path; // TMDB only (TVDB doesn't have episode images in free tier)
  const guestStars = tmdbDetails?.guest_stars || [];
  const directors = tmdbDetails?.crew?.filter((c) => c.job === 'Director') || [];
  const writers = tmdbDetails?.crew?.filter((c) => c.job === 'Writer' || c.job === 'Screenplay') || [];
  const seriesTitle = series?.title || seriesInfo?.name || 'Serie';

  // Get next/prev episode info from TVDB (primary) or TMDB (fallback)
  const prevTvdbEpisode = tvdbSeason?.episodes?.find((e) => e.number === currentEpNum - 1);
  const nextTvdbEpisode = tvdbSeason?.episodes?.find((e) => e.number === currentEpNum + 1);
  const prevEpisode = prevTvdbEpisode || seasonDetails?.episodes?.find((e) => e.episode_number === currentEpNum - 1);
  const nextEpisode = nextTvdbEpisode || seasonDetails?.episodes?.find((e) => e.episode_number === currentEpNum + 1);

  return (
    <div style={{ background: currentTheme.background.default, minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '320px',
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
              background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.status.info} 100%)`,
            }}
          />
        )}

        {/* Gradient Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.8) 100%)',
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
          <BackButton style={{ backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.4)' }} />

          {/* Series Link Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/series/${seriesId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '20px',
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
            padding: '20px',
          }}
        >
          {/* Series Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/series/${seriesId}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            <Tv style={{ fontSize: '14px', color: '#fff' }} />
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{seriesTitle}</span>
          </motion.div>

          {/* Season & Episode */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                padding: '4px 10px',
                background: currentTheme.primary,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              S{seasonNumber} E{episodeNumber}
            </span>
            {episodeRating && episodeRating > 0 && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  background: 'rgba(255,215,0,0.2)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffd700',
                }}
              >
                <Star style={{ fontSize: '14px' }} />
                {episodeRating.toFixed(1)}
              </span>
            )}
            {localEpisode?.watched && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  background: 'rgba(76,175,80,0.2)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#4caf50',
                }}
              >
                <Check style={{ fontSize: '14px' }} />
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
              fontSize: '26px',
              fontWeight: 800,
              color: '#fff',
              margin: '0 0 8px 0',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
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
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            {episodeAirDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DateRange style={{ fontSize: '16px' }} />
                {getUnifiedEpisodeDate(episodeAirDate)}
              </span>
            )}
            {episodeRuntime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PlayCircle style={{ fontSize: '16px' }} />
                {episodeRuntime} Min.
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {/* Watch/Unwatch Button */}
        {series && user && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleWatched}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: localEpisode?.watched
                ? `${currentTheme.status.success}20`
                : currentTheme.background.card,
              border: `1px solid ${localEpisode?.watched ? currentTheme.status.success : currentTheme.border.default}`,
              borderRadius: '12px',
              color: localEpisode?.watched ? currentTheme.status.success : currentTheme.text.primary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {localEpisode?.watched ? (
              <>
                <Visibility style={{ fontSize: '20px' }} />
                Gesehen
              </>
            ) : (
              <>
                <VisibilityOff style={{ fontSize: '20px' }} />
                Als gesehen markieren
              </>
            )}
          </motion.button>
        )}

        {/* Episodes Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/episodes/${seriesId}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: currentTheme.background.card,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '12px',
            color: currentTheme.text.primary,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <Edit style={{ fontSize: '18px' }} />
        </motion.button>
      </div>

      {/* Episode Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '16px 20px',
          background: currentTheme.background.card,
          borderBottom: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {/* Previous Episode */}
        <motion.button
          whileTap={{ scale: hasPrevEpisode ? 0.95 : 1 }}
          onClick={goToPrevEpisode}
          disabled={!hasPrevEpisode}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '12px',
            cursor: hasPrevEpisode ? 'pointer' : 'default',
            opacity: hasPrevEpisode ? 1 : 0.4,
            textAlign: 'left',
          }}
        >
          <NavigateBefore style={{ fontSize: '24px', color: currentTheme.text.muted }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', color: currentTheme.text.muted, margin: 0 }}>Vorherige</p>
            <p
              style={{
                fontSize: '13px',
                color: currentTheme.text.primary,
                margin: 0,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {prevEpisode?.name || `Episode ${currentEpNum - 1}`}
            </p>
          </div>
        </motion.button>

        {/* Next Episode */}
        <motion.button
          whileTap={{ scale: hasNextEpisode ? 0.95 : 1 }}
          onClick={goToNextEpisode}
          disabled={!hasNextEpisode}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: hasNextEpisode
              ? `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.status.info}15)`
              : currentTheme.background.surface,
            border: `1px solid ${hasNextEpisode ? currentTheme.primary + '40' : currentTheme.border.default}`,
            borderRadius: '12px',
            cursor: hasNextEpisode ? 'pointer' : 'default',
            opacity: hasNextEpisode ? 1 : 0.4,
            textAlign: 'right',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', color: currentTheme.text.muted, margin: 0 }}>Nächste</p>
            <p
              style={{
                fontSize: '13px',
                color: currentTheme.text.primary,
                margin: 0,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nextEpisode?.name || `Episode ${currentEpNum + 1}`}
            </p>
          </div>
          <NavigateNext style={{ fontSize: '24px', color: currentTheme.primary }} />
        </motion.button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Overview */}
        {episodeOverview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: currentTheme.background.card,
              borderRadius: '16px',
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: currentTheme.text.primary,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Movie style={{ fontSize: '20px', color: currentTheme.primary }} />
              Handlung
            </h3>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.7,
                color: currentTheme.text.secondary,
                margin: 0,
              }}
            >
              {episodeOverview}
            </p>
          </motion.div>
        )}

        {/* Crew Info */}
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
                  padding: '16px',
                  background: currentTheme.background.card,
                  borderRadius: '12px',
                  border: `1px solid ${currentTheme.border.default}`,
                }}
              >
                <h4
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: currentTheme.text.muted,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Regie
                </h4>
                {directors.slice(0, 2).map((d, i) => (
                  <p key={i} style={{ fontSize: '14px', color: currentTheme.text.primary, margin: i > 0 ? '4px 0 0 0' : 0, fontWeight: 500 }}>
                    {d.name}
                  </p>
                ))}
              </div>
            )}
            {writers.length > 0 && (
              <div
                style={{
                  padding: '16px',
                  background: currentTheme.background.card,
                  borderRadius: '12px',
                  border: `1px solid ${currentTheme.border.default}`,
                }}
              >
                <h4
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: currentTheme.text.muted,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Drehbuch
                </h4>
                {writers.slice(0, 2).map((w, i) => (
                  <p key={i} style={{ fontSize: '14px', color: currentTheme.text.primary, margin: i > 0 ? '4px 0 0 0' : 0, fontWeight: 500 }}>
                    {w.name}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Guest Stars */}
        {guestStars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: currentTheme.background.card,
              borderRadius: '16px',
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: currentTheme.text.primary,
                marginBottom: '16px',
              }}
            >
              Gaststars ({guestStars.length})
            </h3>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                paddingBottom: '8px',
                WebkitOverflowScrolling: 'touch',
                margin: '0 -16px',
                padding: '0 16px 8px 16px',
              }}
            >
              {guestStars.slice(0, 15).map((star) => (
                <div
                  key={star.id}
                  style={{
                    flexShrink: 0,
                    width: '90px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      margin: '0 auto 10px',
                      overflow: 'hidden',
                      background: currentTheme.background.surface,
                      border: `3px solid ${currentTheme.border.default}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
                          fontSize: '28px',
                          background: `linear-gradient(135deg, ${currentTheme.primary}40, ${currentTheme.status.info}40)`,
                        }}
                      >
                        👤
                      </div>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: currentTheme.text.primary,
                      margin: '0 0 2px 0',
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
                      fontWeight: 500,
                    }}
                  >
                    {star.character}
                  </p>
                </div>
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
          />
        </motion.div>
      </div>
    </div>
  );
};
