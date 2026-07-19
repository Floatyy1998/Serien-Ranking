import { useEffect, useMemo, useRef, useState } from 'react';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { getTmdbApiKey, tmdbFetch } from '../../services/tmdbClient';
import { t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';
import type { FriendActivity } from '../../types/Friend';
import type { ActivityFilterType } from './types';

export const useActivityGrouping = (friendActivities: FriendActivity[]) => {
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [filterType, setFilterType] = useState<ActivityFilterType>('all');
  const [tmdbPosters, setTmdbPosters] = useState<Record<string, string>>({});

  const seriesListRef = useRef(seriesList);
  const movieListRef = useRef(movieList);
  const tmdbPostersRef = useRef(tmdbPosters);
  const friendActivitiesRef = useRef(friendActivities);
  useEffect(() => {
    seriesListRef.current = seriesList;
  }, [seriesList]);
  useEffect(() => {
    movieListRef.current = movieList;
  }, [movieList]);
  useEffect(() => {
    tmdbPostersRef.current = tmdbPosters;
  }, [tmdbPosters]);
  useEffect(() => {
    friendActivitiesRef.current = friendActivities;
  }, [friendActivities]);

  const getItemDetails = (activity: FriendActivity) => {
    const tmdbId = activity.tmdbId || activity.itemId;

    if (
      activity.type === 'series_added' ||
      activity.type === 'series_rated' ||
      activity.type === 'rating_updated' ||
      activity.type === 'series_added_to_watchlist' ||
      activity.itemType === 'series'
    ) {
      const series = seriesList.find((s) => s.id === tmdbId || s.id === Number(tmdbId));
      if (!series) {
        return {
          id: tmdbId,
          title: activity.itemTitle || t('Unbekannte Serie'),
          poster: activity.posterPath || activity.poster,
        };
      }
      return series;
    } else {
      const movie = movieList.find((m) => m.id === tmdbId || m.id === Number(tmdbId));
      if (!movie) {
        return {
          id: tmdbId,
          title: activity.itemTitle || t('Unbekannter Film'),
          poster: activity.posterPath || activity.poster,
        };
      }
      return movie;
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('gerade eben');
    if (minutes < 60) return t('vor {n}m', { n: minutes });
    if (hours < 24) return t('vor {n}h', { n: hours });
    if (days < 7) return t('vor {n}d', { n: days });

    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredActivities = useMemo(() => {
    let filtered = [...friendActivities];

    if (filterType === 'movies') {
      filtered = filtered.filter(
        (activity) =>
          activity.type === 'movie_added' ||
          activity.type === 'movie_rated' ||
          activity.type === 'rating_updated_movie' ||
          activity.type === 'movie_added_to_watchlist' ||
          activity.type === 'movie_removed_from_watchlist' ||
          activity.type === 'movie_deleted' ||
          activity.itemType === 'movie'
      );
    } else if (filterType === 'series') {
      filtered = filtered.filter(
        (activity) =>
          activity.type === 'series_added' ||
          activity.type === 'series_rated' ||
          activity.type === 'rating_updated' ||
          activity.type === 'series_added_to_watchlist' ||
          activity.type === 'series_removed_from_watchlist' ||
          activity.type === 'series_deleted' ||
          activity.type === 'episode_watched' ||
          activity.type === 'episodes_watched' ||
          activity.itemType === 'series' ||
          (!activity.itemType &&
            activity.type !== 'movie_added' &&
            activity.type !== 'movie_rated' &&
            activity.type !== 'rating_updated_movie')
      );
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [friendActivities, filterType]);

  const groupedActivities = useMemo(() => {
    const filtered = filteredActivities;

    const groups = new Map<string, FriendActivity[]>();

    filtered.forEach((activity) => {
      const userId = activity.userId;
      if (!groups.has(userId)) {
        groups.set(userId, []);
      }
      groups.get(userId)?.push(activity);
    });

    groups.forEach((activities) => {
      activities.sort((a, b) => b.timestamp - a.timestamp);
    });

    const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
      const aLatest = a[1][0]?.timestamp || 0;
      const bLatest = b[1][0]?.timestamp || 0;
      return bLatest - aLatest;
    });

    return sortedGroups;
  }, [filteredActivities]);

  useEffect(() => {
    const currentActivities = friendActivitiesRef.current;
    if (!getTmdbApiKey() || currentActivities.length === 0) return;

    const fetchMissingPosters = async () => {
      const postersToFetch: { id: string; type: 'series' | 'movie' }[] = [];

      for (const activity of currentActivities) {
        const tmdbId = activity.tmdbId || activity.itemId;
        const itemType = activity.itemType;

        if (!tmdbId) continue;

        const cacheKey = `${itemType}_${tmdbId}`;
        if (tmdbPostersRef.current[cacheKey]) continue;

        if (itemType === 'series') {
          const series = seriesListRef.current.find(
            (s) => s.id === tmdbId || s.id === Number(tmdbId)
          );
          if (series?.poster?.poster) continue;
        } else {
          const movie = movieListRef.current.find(
            (m) => m.id === tmdbId || m.id === Number(tmdbId)
          );
          if (movie?.poster?.poster) continue;
        }

        if (activity.posterPath || activity.poster) continue;

        postersToFetch.push({
          id: String(tmdbId),
          type: itemType === 'movie' ? 'movie' : 'series',
        });
      }

      if (postersToFetch.length === 0) return;

      const newPosters: Record<string, string> = {};
      await Promise.all(
        postersToFetch.map(async ({ id, type }) => {
          try {
            const endpoint = type === 'movie' ? 'movie' : 'tv';
            const data = await tmdbFetch<{ poster_path?: string | null }>(`${endpoint}/${id}`);
            if (data.poster_path) {
              newPosters[`${type}_${id}`] = data.poster_path;
            }
          } catch {
            // Silent fail (auch HTTP-Fehler — tmdbFetch wirft bei !ok)
          }
        })
      );

      if (Object.keys(newPosters).length > 0) {
        setTmdbPosters((prev) => ({ ...prev, ...newPosters }));
      }
    };

    fetchMissingPosters();
  }, [friendActivities.length]);

  const getPosterUrl = (activity: FriendActivity): string | undefined => {
    const tmdbId = activity.tmdbId || activity.itemId;
    const itemType = activity.itemType;
    const cacheKey = `${itemType}_${tmdbId}`;
    const tmdbPoster = tmdbPosters[cacheKey];
    const item = getItemDetails(activity);
    const posterUrl = tmdbPoster ? getImageUrl(tmdbPoster) : getImageUrl(item?.poster);
    return posterUrl;
  };

  return {
    groupedActivities,
    filteredActivities,
    getItemDetails,
    formatTimeAgo,
    filterType,
    setFilterType,
    tmdbPosters,
    getPosterUrl,
  };
};
