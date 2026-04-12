import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import type { Series } from '../../types/Series';

export interface TMDBEpisodeDetails {
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

export interface TMDBSeasonDetails {
  season_number: number;
  episodes: {
    id: number;
    name: string;
    episode_number: number;
    still_path: string | null;
    air_date: string;
    vote_average: number;
  }[];
}

export interface EpisodeNavigationInfo {
  hasPrevEpisode: boolean;
  hasNextEpisode: boolean;
  prevEpisodeLabel: string;
  nextEpisodeLabel: string;
  goToPrevEpisode: () => void;
  goToNextEpisode: () => void;
  hasPrevInSeason: boolean;
  hasNextInSeason: boolean;
  hasNextSeason: boolean;
}

export interface EpisodeDetails {
  episodeName: string;
  episodeOverview: string;
  episodeAirDate: string | undefined;
  episodeRuntime: number | null | undefined;
  episodeRating: number | undefined;
  stillPath: string | null | undefined;
  guestStars: TMDBEpisodeDetails['guest_stars'];
  directors: TMDBEpisodeDetails['crew'];
  writers: TMDBEpisodeDetails['crew'];
  seriesTitle: string;
  formattedAirDate: string | null;
  formattedFirstWatchedAt: string | null;
}

export const useEpisodeDiscussion = () => {
  const { seriesId, seasonNumber, episodeNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();

  const [tmdbDetails, setTmdbDetails] = useState<TMDBEpisodeDetails | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeasonDetails | null>(null);
  const [seriesInfo, setSeriesInfo] = useState<{
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null>(null);
  const [tmdbAllSeasons, setTmdbAllSeasons] = useState<TMDBSeasonDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const series = seriesList.find((s: Series) => s.id === Number(seriesId));
  const localSeason = series?.seasons?.find((s) => s.seasonNumber === Number(seasonNumber) - 1);
  const localEpisode = localSeason?.episodes?.find((_, idx) => idx === Number(episodeNumber) - 1);

  // ---------- Data Fetching ----------
  useEffect(() => {
    const fetchAllDetails = async () => {
      const apiKey = import.meta.env.VITE_API_TMDB;
      if (!seriesId || !seasonNumber || !episodeNumber) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

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
              fetch(`https://api.themoviedb.org/3/tv/${seriesId}?api_key=${apiKey}&language=de-DE`),
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

              // Alle Seasons für Navigation holen
              const totalSeasons = data.number_of_seasons || 0;
              const seasonPromises = [];
              for (let s = 1; s <= totalSeasons; s++) {
                seasonPromises.push(
                  fetch(
                    `https://api.themoviedb.org/3/tv/${seriesId}/season/${s}?api_key=${apiKey}&language=de-DE`
                  ).then((r) => (r.ok ? r.json() : null))
                );
              }
              const allSeasons = (await Promise.all(seasonPromises)).filter(Boolean);
              setTmdbAllSeasons(allSeasons);
            }
          } catch (error) {
            console.error('Error fetching TMDB data:', error);
          }
        };

        await fetchTMDBData();
      } catch (error) {
        console.error('Error fetching episode details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDetails();
  }, [seriesId, seasonNumber, episodeNumber]);

  // ---------- Image Helpers ----------
  const getStillUrl = (path: string | null, size: string = 'w780'): string => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  const getProfileUrl = (path: string | null): string => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  // ---------- Episode Navigation ----------
  const currentEpNum = Number(episodeNumber);
  const currentSeasonNum = Number(seasonNumber);

  // TMDB season finden (season_number ist 1-basiert in TMDB)
  const tmdbCurrentSeason = tmdbAllSeasons.find((s) => s.season_number === currentSeasonNum);
  const tmdbPrevSeason = tmdbAllSeasons.find((s) => s.season_number === currentSeasonNum - 1);
  const tmdbNextSeason = tmdbAllSeasons.find((s) => s.season_number === currentSeasonNum + 1);

  // Lokale Seasons (0-basiert)
  const prevLocalSeason = series?.seasons?.find((s) => s.seasonNumber === currentSeasonNum - 2);
  const nextLocalSeason = series?.seasons?.find((s) => s.seasonNumber === currentSeasonNum);

  const totalEpisodes =
    localSeason?.episodes?.length ||
    tmdbCurrentSeason?.episodes?.length ||
    seasonDetails?.episodes?.length ||
    0;

  const hasPrevInSeason = currentEpNum > 1;
  const prevSeasonEpisodeCount =
    prevLocalSeason?.episodes?.length || tmdbPrevSeason?.episodes?.length || 0;
  const hasPrevSeason = currentSeasonNum > 1 && prevSeasonEpisodeCount > 0;
  const hasPrevEpisode = hasPrevInSeason || hasPrevSeason;

  const hasNextInSeason = currentEpNum < totalEpisodes;
  const nextSeasonEpisodeCount =
    nextLocalSeason?.episodes?.length || tmdbNextSeason?.episodes?.length || 0;
  const hasNextSeason = nextSeasonEpisodeCount > 0;
  const hasNextEpisode = hasNextInSeason || hasNextSeason;

  const goToPrevEpisode = () => {
    if (hasPrevInSeason) {
      navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${currentEpNum - 1}`, {
        replace: true,
      });
    } else if (hasPrevSeason) {
      navigate(`/episode/${seriesId}/s/${currentSeasonNum - 1}/e/${prevSeasonEpisodeCount}`, {
        replace: true,
      });
    }
  };

  const goToNextEpisode = () => {
    if (hasNextInSeason) {
      navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${currentEpNum + 1}`, {
        replace: true,
      });
    } else if (hasNextSeason) {
      navigate(`/episode/${seriesId}/s/${currentSeasonNum + 1}/e/1`, { replace: true });
    }
  };

  // Prev/next episode labels
  const prevTmdbEpisodeInSeason = seasonDetails?.episodes?.find(
    (e) => e.episode_number === currentEpNum - 1
  );
  const prevLocalEpisodeInSeason = localSeason?.episodes?.[currentEpNum - 2];

  const prevEpisodeLabel = hasPrevInSeason
    ? prevLocalEpisodeInSeason?.name ||
      prevTmdbEpisodeInSeason?.name ||
      `Episode ${currentEpNum - 1}`
    : hasPrevSeason
      ? `S${currentSeasonNum - 1} E${prevSeasonEpisodeCount}`
      : '';

  const nextTmdbEpisodeInSeason = seasonDetails?.episodes?.find(
    (e) => e.episode_number === currentEpNum + 1
  );
  const nextLocalEpisodeInSeason = localSeason?.episodes?.[currentEpNum];

  const nextEpisodeLabel = hasNextInSeason
    ? nextLocalEpisodeInSeason?.name ||
      nextTmdbEpisodeInSeason?.name ||
      `Episode ${currentEpNum + 1}`
    : hasNextSeason
      ? `S${currentSeasonNum + 1} E1`
      : '';

  // ---------- Toggle Watched ----------
  const handleToggleWatched = async () => {
    if (!user?.uid || !series || !localSeason || !localEpisode) return;

    try {
      const episodeIndex = Number(episodeNumber) - 1;
      const seasonIndex = series.seasons.findIndex(
        (s) => s.seasonNumber === Number(seasonNumber) - 1
      );

      if (seasonIndex === -1) return;

      const isCurrentlyWatched = localEpisode.watched;

      const seasonPath = `users/${user.uid}/seriesWatch/${series.id}/seasons/${seasonIndex}`;
      const eIdx = episodeIndex;
      const db = firebase.database();

      if (isCurrentlyWatched) {
        await db.ref().update({
          [`${seasonPath}/w/${eIdx}`]: 0,
          [`${seasonPath}/c/${eIdx}`]: 0,
          [`${seasonPath}/f/${eIdx}`]: 0,
          [`${seasonPath}/l/${eIdx}`]: 0,
          [`users/${user.uid}/meta/serienVersion`]: firebase.database.ServerValue.TIMESTAMP,
        });
      } else {
        const nowUnix = Math.floor(Date.now() / 1000);
        await db.ref().update({
          [`${seasonPath}/w/${eIdx}`]: 1,
          [`${seasonPath}/c/${eIdx}`]: 1,
          [`${seasonPath}/f/${eIdx}`]: nowUnix,
          [`${seasonPath}/l/${eIdx}`]: nowUnix,
          [`users/${user.uid}/meta/serienVersion`]: firebase.database.ServerValue.TIMESTAMP,
        });
      }

      // Auto-navigate to next unwatched episode (delayed so user sees the checkmark)
      if (!isCurrentlyWatched && series) {
        const epIdx = episodeIndex;
        const sIdx = seasonIndex;
        const seasons = series.seasons;

        // Find next unwatched episode
        let nextPath: string | null = null;
        let nextSeasonNum = 0;
        let nextEpNum = 0;
        let nextEpName = '';

        // 1. Remaining episodes in current season
        const currentSeasonEps = seasons[sIdx]?.episodes || [];
        for (let i = epIdx + 1; i < currentSeasonEps.length; i++) {
          if (!currentSeasonEps[i]?.watched) {
            nextSeasonNum = seasons[sIdx].seasonNumber + 1;
            nextEpNum = i + 1;
            nextEpName = currentSeasonEps[i]?.name || `Episode ${i + 1}`;
            nextPath = `/episode/${seriesId}/s/${nextSeasonNum}/e/${nextEpNum}`;
            break;
          }
        }
        // 2. Next seasons
        if (!nextPath) {
          for (let s = sIdx + 1; s < seasons.length; s++) {
            const eps = seasons[s]?.episodes || [];
            for (let i = 0; i < eps.length; i++) {
              if (!eps[i]?.watched) {
                nextSeasonNum = seasons[s].seasonNumber + 1;
                nextEpNum = i + 1;
                nextEpName = eps[i]?.name || `Episode ${i + 1}`;
                nextPath = `/episode/${seriesId}/s/${nextSeasonNum}/e/${nextEpNum}`;
                break;
              }
            }
            if (nextPath) break;
          }
        }

        if (nextPath) {
          const path = nextPath;
          setNextEpisodeTransition({
            active: true,
            seasonNumber: nextSeasonNum,
            episodeNumber: nextEpNum,
            episodeName: nextEpName,
          });
          setTimeout(() => navigate(path, { replace: true }), 1200);
        }
      }

      if (!isCurrentlyWatched) {
        WatchActivityService.logEpisodeWatch(
          user.uid,
          series.id,
          series.title || series.name || 'Unbekannte Serie',
          Number(seasonNumber),
          Number(episodeNumber),
          (localEpisode as typeof localEpisode & { runtime?: number })?.runtime ||
            tmdbDetails?.runtime ||
            series.episodeRuntime ||
            45,
          false,
          series.genre?.genres,
          series.provider?.provider?.map((p) => p.name)
        );

        // Pet XP vergeben
        await petService.watchedSeriesWithGenreAllPets(user.uid, series.genre?.genres || []);
      }
    } catch (error) {
      console.error('Error toggling watched status:', error);
    }
  };

  // ---------- Derived Episode Details ----------
  const episodeName = localEpisode?.name || tmdbDetails?.name || `Episode ${episodeNumber}`;
  const episodeOverview = tmdbDetails?.overview || '';
  const episodeAirDate =
    localEpisode?.airstamp?.split('T')[0] ||
    localEpisode?.air_date ||
    localEpisode?.airDate ||
    localEpisode?.firstAired ||
    tmdbDetails?.air_date;
  const episodeRuntime =
    (localEpisode as typeof localEpisode & { runtime?: number })?.runtime || tmdbDetails?.runtime;
  const episodeRating = tmdbDetails?.vote_average;
  const stillPath = tmdbDetails?.still_path;
  const guestStars = tmdbDetails?.guest_stars || [];
  const directors = tmdbDetails?.crew?.filter((c) => c.job === 'Director') || [];
  const writers =
    tmdbDetails?.crew?.filter((c) => c.job === 'Writer' || c.job === 'Screenplay') || [];
  const seriesTitle = series?.title || seriesInfo?.name || 'Serie';

  const formattedAirDate = episodeAirDate ? getUnifiedEpisodeDate(episodeAirDate) : null;

  const firstWatchedAtRaw = localEpisode?.watched
    ? (localEpisode as typeof localEpisode & { firstWatchedAt?: string }).firstWatchedAt
    : undefined;
  const formattedFirstWatchedAt = firstWatchedAtRaw
    ? new Date(firstWatchedAtRaw).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  // ---------- Next Episode Transition ----------
  const [nextEpisodeTransition, setNextEpisodeTransition] = useState<{
    active: boolean;
    seasonNumber: number;
    episodeNumber: number;
    episodeName: string;
  } | null>(null);

  // Reset transition overlay when route params change (navigate to next episode)
  useEffect(() => {
    setNextEpisodeTransition(null);
  }, [seriesId, seasonNumber, episodeNumber]);

  // ---------- Status Flags ----------
  const isNotFound = !series && !tmdbDetails && !seriesInfo;
  const hasUser = !!user;
  const hasSeries = !!series;
  const isWatched = !!localEpisode?.watched;

  return {
    // Route params
    seriesId,
    seasonNumber,
    episodeNumber,
    navigate,

    // Loading / error states
    loading,
    isNotFound,

    // Series & local data
    series,
    seriesInfo,
    hasUser,
    hasSeries,
    isWatched,

    // Episode details
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

    // Navigation
    navigation: {
      hasPrevEpisode,
      hasNextEpisode,
      prevEpisodeLabel,
      nextEpisodeLabel,
      goToPrevEpisode,
      goToNextEpisode,
      hasPrevInSeason,
      hasNextInSeason,
      hasNextSeason,
    } as EpisodeNavigationInfo,

    // Actions
    handleToggleWatched,
    nextEpisodeTransition,

    // Image helpers
    getStillUrl,
    getProfileUrl,
  };
};
