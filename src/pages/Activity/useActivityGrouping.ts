import { useEffect, useMemo, useState } from 'react';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { getImageUrl } from '../../utils/imageUrl';
import type { FriendActivity } from '../../types/Friend';
import type { ActivityFilterType } from './types';

export const useActivityGrouping = (friendActivities: FriendActivity[]) => {
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [filterType, setFilterType] = useState<ActivityFilterType>('all');
  const [tmdbPosters, setTmdbPosters] = useState<Record<string, string>>({});

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
          title: activity.itemTitle || 'Unbekannte Serie',
          poster: activity.posterPath || activity.poster,
        };
      }
      return series;
    } else {
      const movie = movieList.find((m) => m.id === tmdbId || m.id === Number(tmdbId));
      if (!movie) {
        return {
          id: tmdbId,
          title: activity.itemTitle || 'Unbekannter Film',
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

    if (minutes < 1) return 'gerade eben';
    if (minutes < 60) return `vor ${minutes}m`;
    if (hours < 24) return `vor ${hours}h`;
    if (days < 7) return `vor ${days}d`;

    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const groupedActivities = useMemo(() => {
    let filtered = [...friendActivities];

    if (filterType === 'movies') {
      filtered = filtered.filter(
        (activity) =>
          activity.type === 'movie_added' ||
          activity.type === 'movie_rated' ||
          activity.type === 'rating_updated_movie' ||
          activity.itemType === 'movie'
      );
    } else if (filterType === 'series') {
      filtered = filtered.filter(
        (activity) =>
          activity.type === 'series_added' ||
          activity.type === 'series_rated' ||
          activity.type === 'rating_updated' ||
          activity.type === 'series_added_to_watchlist' ||
          activity.itemType === 'series' ||
          (!activity.itemType &&
            activity.type !== 'movie_added' &&
            activity.type !== 'movie_rated' &&
            activity.type !== 'rating_updated_movie')
      );
    }

    const groups = new Map<string, FriendActivity[]>();

    filtered.forEach((activity) => {
      const userId = activity.userId;
      if (!groups.has(userId)) {
        groups.set(userId, []);
      }
      groups.get(userId)!.push(activity);
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
  }, [friendActivities, filterType]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey || friendActivities.length === 0) return;

    const fetchMissingPosters = async () => {
      const postersToFetch: { id: string; type: 'series' | 'movie' }[] = [];

      for (const activity of friendActivities) {
        const tmdbId = activity.tmdbId || activity.itemId;
        const itemType = activity.itemType;

        if (!tmdbId) continue;

        const cacheKey = `${itemType}_${tmdbId}`;
        if (tmdbPosters[cacheKey]) continue;

        if (itemType === 'series') {
          const series = seriesList.find((s) => s.id === tmdbId || s.id === Number(tmdbId));
          if (series?.poster?.poster) continue;
        } else {
          const movie = movieList.find((m) => m.id === tmdbId || m.id === Number(tmdbId));
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
            const response = await fetch(
              `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${apiKey}&language=de-DE`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.poster_path) {
                newPosters[`${type}_${id}`] = data.poster_path;
              }
            }
          } catch (error) {
            // Silent fail
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
    const posterUrl = tmdbPoster
      ? `https://image.tmdb.org/t/p/w342${tmdbPoster}`
      : getImageUrl(item?.poster);
    return posterUrl;
  };

  return {
    groupedActivities,
    getItemDetails,
    formatTimeAgo,
    filterType,
    setFilterType,
    tmdbPosters,
    getPosterUrl,
  };
};
