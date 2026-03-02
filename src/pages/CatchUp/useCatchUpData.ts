/**
 * useCatchUpData - Business logic hook for CatchUpPage
 * Handles series calculation, sorting, scroll persistence, and URL params.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { Series } from '../../types/Series';

export interface CatchUpSeries {
  series: Series;
  totalEpisodes: number;
  watchedEpisodes: number;
  remainingEpisodes: number;
  remainingMinutes: number;
  progress: number;
  currentSeason: number;
  currentEpisode: number;
  lastWatchedDate?: string;
}

export type SortOption = 'episodes' | 'time' | 'progress' | 'recent';
export type SortDirection = 'asc' | 'desc';

export interface SortOptionConfig {
  value: SortOption;
  labelDesc: string;
  labelAsc: string;
  icon: string;
}

const SCROLL_STORAGE_KEY = 'catchup-scroll-position';

const VALID_SORT_OPTIONS: SortOption[] = ['episodes', 'time', 'progress', 'recent'];

export const useCatchUpData = () => {
  const { seriesList } = useSeriesList();
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRestoredRef = useRef(false);

  // Initialize sortBy and direction from URL params
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const sortParam = searchParams.get('sort') as SortOption;
    return sortParam && VALID_SORT_OPTIONS.includes(sortParam) ? sortParam : 'episodes';
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const dirParam = searchParams.get('dir') as SortDirection;
    return dirParam && ['asc', 'desc'].includes(dirParam) ? dirParam : 'desc';
  });

  // Handle tab click - toggle direction if same tab, otherwise switch tab
  const handleSortClick = useCallback(
    (value: SortOption) => {
      if (sortBy === value) {
        setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
      } else {
        setSortBy(value);
        setSortDirection('desc');
      }
      // Scroll to top when sort changes
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
    },
    [sortBy]
  );

  // Update URL params when sort changes
  useEffect(() => {
    setSearchParams({ sort: sortBy, dir: sortDirection }, { replace: true });
  }, [sortBy, sortDirection, setSearchParams]);

  // Save scroll position on scroll (debounced)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(container.scrollTop));
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollRestoredRef.current) return;
    scrollRestoredRef.current = true;

    const savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedPosition) {
      const pos = parseInt(savedPosition, 10);
      // Delay to ensure content is rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollContainerRef.current?.scrollTo({ top: pos });
        });
      });
    }
  }, []);

  // Calculate catch-up data for each series
  const catchUpData = useMemo(() => {
    const data: CatchUpSeries[] = [];

    seriesList.forEach((series) => {
      if (!series.seasons || series.seasons.length === 0) return;

      let totalEpisodes = 0;
      let watchedEpisodes = 0;
      let currentSeason = 1;
      let currentEpisode = 1;
      let lastWatchedDate: string | undefined;
      let foundUnwatched = false;
      let remainingMinutes = 0;
      const seriesRuntime = series.episodeRuntime || 45;

      series.seasons.forEach((season) => {
        if (!season.episodes) return;

        season.episodes.forEach((episode, epIndex) => {
          const airDate = episode.air_date || episode.airDate || episode.firstAired;
          if (!airDate) return;
          const hasAired = new Date(airDate) <= new Date();

          if (hasAired) {
            totalEpisodes++;
            if (episode.watched) {
              watchedEpisodes++;
              if (episode.lastWatchedAt || episode.firstWatchedAt) {
                const watchDate = episode.lastWatchedAt || episode.firstWatchedAt;
                if (!lastWatchedDate || watchDate! > lastWatchedDate) {
                  lastWatchedDate = watchDate;
                }
              }
            } else {
              remainingMinutes += episode.runtime || seriesRuntime;
              if (!foundUnwatched) {
                currentSeason = season.seasonNumber || season.season_number || 1;
                currentEpisode = episode.episode_number || epIndex + 1;
                foundUnwatched = true;
              }
            }
          }
        });
      });

      const remainingEpisodes = totalEpisodes - watchedEpisodes;

      if (remainingEpisodes > 0 && totalEpisodes > 0) {
        const progress = (watchedEpisodes / totalEpisodes) * 100;

        data.push({
          series,
          totalEpisodes,
          watchedEpisodes,
          remainingEpisodes,
          remainingMinutes,
          progress,
          currentSeason,
          currentEpisode,
          lastWatchedDate,
        });
      }
    });

    return data;
  }, [seriesList]);

  // Sort the data
  const sortedData = useMemo(() => {
    const sorted = [...catchUpData];
    const dir = sortDirection === 'desc' ? 1 : -1;

    switch (sortBy) {
      case 'episodes':
        sorted.sort((a, b) => dir * (b.remainingEpisodes - a.remainingEpisodes));
        break;
      case 'time':
        sorted.sort((a, b) => dir * (b.remainingMinutes - a.remainingMinutes));
        break;
      case 'progress':
        sorted.sort((a, b) => dir * (b.progress - a.progress));
        break;
      case 'recent':
        sorted.sort((a, b) => {
          if (!a.lastWatchedDate && !b.lastWatchedDate) return 0;
          if (!a.lastWatchedDate) return 1;
          if (!b.lastWatchedDate) return -1;
          return (
            dir * (new Date(b.lastWatchedDate).getTime() - new Date(a.lastWatchedDate).getTime())
          );
        });
        break;
    }

    return sorted;
  }, [catchUpData, sortBy, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalEpisodes = catchUpData.reduce((sum, item) => sum + item.remainingEpisodes, 0);
    const totalMinutes = catchUpData.reduce((sum, item) => sum + item.remainingMinutes, 0);
    const avgProgress =
      catchUpData.length > 0
        ? catchUpData.reduce((sum, item) => sum + item.progress, 0) / catchUpData.length
        : 0;
    return { totalEpisodes, totalMinutes, avgProgress };
  }, [catchUpData]);

  // Derive active label
  const currentLabel = useMemo(() => {
    const labels: Record<SortOption, { desc: string; asc: string }> = {
      episodes: { desc: 'Meiste Episoden', asc: 'Wenigste Episoden' },
      time: { desc: 'Längste Zeit', asc: 'Kürzeste Zeit' },
      progress: { desc: 'Fast fertig', asc: 'Am Anfang' },
      recent: { desc: 'Zuletzt geschaut', asc: 'Am längsten her' },
    };
    return sortDirection === 'desc' ? labels[sortBy].desc : labels[sortBy].asc;
  }, [sortBy, sortDirection]);

  return {
    catchUpData,
    sortedData,
    totals,
    sortBy,
    sortDirection,
    handleSortClick,
    currentLabel,
    scrollContainerRef,
  };
};

// --- Utility helpers ---

export const formatTime = (minutes: number): { value: number; unit: string } => {
  if (minutes < 60) return { value: minutes, unit: 'Min' };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: hours, unit: 'Std' };
  const days = Math.floor(hours / 24);
  return { value: days, unit: 'Tage' };
};

export const formatTimeString = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};
