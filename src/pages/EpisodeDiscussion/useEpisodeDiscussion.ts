import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { Series } from '../../types/Series';
import {
  getTVDBIdFromTMDB,
  getTVDBSeasons,
  TVDBEpisode,
  TVDBSeason,
} from '../../services/tvdbService';

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
  const [tvdbEpisode, setTvdbEpisode] = useState<TVDBEpisode | null>(null);
  const [tvdbSeasons, setTvdbSeasons] = useState<TVDBSeason[]>([]);
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

        const fetchTVDBData = async () => {
          try {
            const tvdbId = await getTVDBIdFromTMDB(Number(seriesId));
            if (tvdbId) {
              const seasons = await getTVDBSeasons(tvdbId);
              setTvdbSeasons(seasons);

              const targetSeasonNum = Number(seasonNumber);
              const targetEpisodeNum = Number(episodeNumber);
              const season = seasons.find((s) => s.seasonNumber === targetSeasonNum);
              const episode = season?.episodes.find((e) => e.number === targetEpisodeNum);

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
  const tvdbSeason = tvdbSeasons.find((s) => s.seasonNumber === currentSeasonNum);
  const totalEpisodes =
    tvdbSeason?.episodes?.length ||
    localSeason?.episodes?.length ||
    seasonDetails?.episodes?.length ||
    0;

  const prevTvdbSeason = tvdbSeasons.find((s) => s.seasonNumber === currentSeasonNum - 1);
  const nextTvdbSeason = tvdbSeasons.find((s) => s.seasonNumber === currentSeasonNum + 1);
  const prevLocalSeason = series?.seasons?.find((s) => s.seasonNumber === currentSeasonNum - 2);
  const nextLocalSeason = series?.seasons?.find((s) => s.seasonNumber === currentSeasonNum);

  const hasPrevInSeason = currentEpNum > 1;
  const prevSeasonEpisodeCount =
    prevTvdbSeason?.episodes?.length || prevLocalSeason?.episodes?.length || 0;
  const hasPrevSeason = currentSeasonNum > 1 && prevSeasonEpisodeCount > 0;
  const hasPrevEpisode = hasPrevInSeason || hasPrevSeason;

  const hasNextInSeason = currentEpNum < totalEpisodes;
  const nextSeasonExists =
    nextTvdbSeason?.episodes?.length || nextLocalSeason?.episodes?.length || 0;
  const hasNextSeason = nextSeasonExists > 0;
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
  const prevTvdbEpisodeInSeason = tvdbSeason?.episodes?.find((e) => e.number === currentEpNum - 1);
  const prevTmdbEpisodeInSeason = seasonDetails?.episodes?.find(
    (e) => e.episode_number === currentEpNum - 1
  );
  const lastEpisodeOfPrevSeason = prevTvdbSeason?.episodes?.[prevTvdbSeason.episodes.length - 1];

  const prevEpisode = hasPrevInSeason
    ? prevTvdbEpisodeInSeason || prevTmdbEpisodeInSeason
    : lastEpisodeOfPrevSeason;
  const prevEpisodeLabel = hasPrevInSeason
    ? prevEpisode?.name || `Episode ${currentEpNum - 1}`
    : lastEpisodeOfPrevSeason
      ? `S${currentSeasonNum - 1} E${prevSeasonEpisodeCount}`
      : '';

  const nextTvdbEpisodeInSeason = tvdbSeason?.episodes?.find((e) => e.number === currentEpNum + 1);
  const nextTmdbEpisodeInSeason = seasonDetails?.episodes?.find(
    (e) => e.episode_number === currentEpNum + 1
  );
  const firstEpisodeOfNextSeason = nextTvdbSeason?.episodes?.find((e) => e.number === 1);

  const nextEpisode = hasNextInSeason
    ? nextTvdbEpisodeInSeason || nextTmdbEpisodeInSeason
    : firstEpisodeOfNextSeason;
  const nextEpisodeLabel = hasNextInSeason
    ? nextEpisode?.name || `Episode ${currentEpNum + 1}`
    : firstEpisodeOfNextSeason
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

      const updatedEpisodes = localSeason.episodes!.map((ep, idx) => {
        if (idx === episodeIndex) {
          if (isCurrentlyWatched) {
            const { watchCount, firstWatchedAt, lastWatchedAt, ...rest } =
              ep as Series['seasons'][number]['episodes'][number] & {
                watchCount?: number;
                firstWatchedAt?: string;
                lastWatchedAt?: string;
              };
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
          Number(seasonNumber),
          Number(episodeNumber),
          tvdbEpisode?.runtime || tmdbDetails?.runtime || series.episodeRuntime || 45,
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
  const episodeName =
    tvdbEpisode?.name || localEpisode?.name || tmdbDetails?.name || `Episode ${episodeNumber}`;
  const episodeOverview = tvdbEpisode?.overview || tmdbDetails?.overview || '';
  const episodeAirDate =
    tvdbEpisode?.aired ||
    localEpisode?.air_date ||
    localEpisode?.airDate ||
    localEpisode?.firstAired ||
    tmdbDetails?.air_date;
  const episodeRuntime = tvdbEpisode?.runtime || tmdbDetails?.runtime;
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

  // ---------- Status Flags ----------
  const isNotFound = !series && !tvdbEpisode && !tmdbDetails && !seriesInfo;
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

    // Image helpers
    getStillUrl,
    getProfileUrl,
  };
};
