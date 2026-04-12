/**
 * useRecentlyWatched - Custom hook for RecentlyWatchedPage business logic
 * Manages state, data loading, scroll persistence, search debounce, and episode actions.
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { petService } from '../../services/petService';
import { EpisodeDataManager } from './EpisodeDataManager';
import type { DateGroup, WatchedEpisode } from './EpisodeDataManager';

export interface TimeRange {
  days: number;
  label: string;
}

export const TIME_RANGES: TimeRange[] = [
  { days: 7, label: '7 Tage' },
  { days: 30, label: '30 Tage' },
  { days: 90, label: '3 Monate' },
  { days: 365, label: '1 Jahr' },
];

export interface UseRecentlyWatchedResult {
  // State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  daysToShow: number;
  isLoading: boolean;
  expandedSeries: Set<string>;
  completingEpisodes: Set<string>;
  loadedDateGroups: DateGroup[];
  totalEpisodes: number;
  headerHeight: number;
  headerRef: React.RefObject<HTMLDivElement | null>;

  // Actions
  handleRewatchEpisode: (episode: WatchedEpisode) => Promise<void>;
  toggleSeriesExpanded: (date: string, seriesId: number) => void;
  isSeriesExpanded: (date: string, seriesId: number) => boolean;
  handleTimeRangeChange: (days: number) => void;
  navigateToSeries: (seriesId: number) => void;
  navigateToEpisode: (seriesId: number, seasonNumber: number, episodeNumber: number) => void;
  navigateToEpisodeDiscussion: (
    seriesId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => void;
  getRelativeDateLabel: (episode: WatchedEpisode) => string;
  groupEpisodesBySeries: (episodes: WatchedEpisode[]) => { [seriesId: number]: WatchedEpisode[] };
}

export const useRecentlyWatched = (): UseRecentlyWatchedResult => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { allSeriesList: seriesList } = useSeriesList();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [daysToShow, setDaysToShow] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [loadedDateGroups, setLoadedDateGroups] = useState<DateGroup[]>([]);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(200);

  // Scroll position restoration
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('recentlyWatched-scroll');
    if (savedPosition) {
      const pos = parseInt(savedPosition, 10);
      const tryRestore = () => {
        const container = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
        if (container) {
          container.scrollTo({ top: pos });
        } else {
          requestAnimationFrame(tryRestore);
        }
      };
      requestAnimationFrame(() => requestAnimationFrame(tryRestore));
    }
  }, []);

  // Save scroll position on scroll
  useEffect(() => {
    const container = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const saveScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem('recentlyWatched-scroll', String(container.scrollTop));
      }, 100);
    };

    container.addEventListener('scroll', saveScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', saveScroll);
      clearTimeout(timeoutId);
    };
  }, [headerHeight]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Data manager
  const dataManager = useMemo(() => {
    return new EpisodeDataManager(seriesList, daysToShow, debouncedSearchQuery);
  }, [seriesList, daysToShow, debouncedSearchQuery]);

  // Reset on search/days change
  useEffect(() => {
    setLoadedDateGroups([]);
    dataManager.clearCache();
    setIsLoading(true);
  }, [debouncedSearchQuery, daysToShow, dataManager]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToShow);

      try {
        await dataManager.loadEpisodesForDateRange(startDate.toDateString(), today.toDateString());

        const allDateGroups = dataManager.getDateGroups();
        const availableDays = Math.min(daysToShow, allDateGroups.length);
        const selectedGroups = allDateGroups.slice(0, availableDays);
        setLoadedDateGroups(selectedGroups);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [dataManager, daysToShow]);

  // Header height tracking
  useEffect(() => {
    if (headerRef.current) {
      const updateHeaderHeight = () => {
        const height = headerRef.current?.offsetHeight || 200;
        setHeaderHeight(height);
      };

      updateHeaderHeight();
      window.addEventListener('resize', updateHeaderHeight);
      return () => window.removeEventListener('resize', updateHeaderHeight);
    }
  }, []);

  // Infinite scroll handler
  const handleScroll = useCallback(async () => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!scrollableDiv) return;

    const scrollTop = scrollableDiv.scrollTop;
    const scrollHeight = scrollableDiv.scrollHeight;
    const clientHeight = scrollableDiv.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < 1000) {
      const currentlyLoaded = loadedDateGroups.length;
      const totalDays = daysToShow;

      if (currentlyLoaded < totalDays) {
        const nextBatch = Math.min(7, totalDays - currentlyLoaded);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentlyLoaded - nextBatch);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - currentlyLoaded);

        try {
          await dataManager.loadEpisodesForDateRange(
            startDate.toDateString(),
            endDate.toDateString()
          );
          setLoadedDateGroups(dataManager.getDateGroups().slice(0, currentlyLoaded + nextBatch));
        } catch (error) {
          console.error('Error loading more data:', error);
        }
      }
    }
  }, [dataManager, loadedDateGroups.length, daysToShow]);

  // Attach scroll listener
  useEffect(() => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', handleScroll);
      return () => scrollableDiv.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Rewatch episode
  const handleRewatchEpisode = async (episode: WatchedEpisode) => {
    if (!user) return;

    const key = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

    try {
      const seasonPath = `users/${user.uid}/seriesWatch/${episode.seriesId}/seasons/${episode.seasonIndex}`;
      const eIdx = episode.episodeIndex;
      const db = firebase.database();
      await db.ref(`${seasonPath}/c/${eIdx}`).set(episode.watchCount + 1);
      await db.ref(`${seasonPath}/l/${eIdx}`).set(Math.floor(Date.now() / 1000));

      const series = seriesList.find((s) => s.id === episode.seriesId);
      await petService.watchedSeriesWithGenreAllPets(user.uid, series?.genre?.genres || []);

      setCompletingEpisodes((prev) => new Set([...prev, key]));
      setTimeout(() => {
        setCompletingEpisodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 1000);
    } catch (error) {
      console.error('Error rewatching episode:', error);
    }
  };

  // Toggle series expanded state
  const toggleSeriesExpanded = (date: string, seriesId: number) => {
    const key = `${date}-${seriesId}`;
    setExpandedSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isSeriesExpanded = (date: string, seriesId: number) => {
    return expandedSeries.has(`${date}-${seriesId}`);
  };

  // Time range change
  const handleTimeRangeChange = (days: number) => {
    setDaysToShow(days);
    setLoadedDateGroups([]);
    setIsLoading(true);
    dataManager.clearCache();
  };

  // Navigation helpers
  const navigateToSeries = (seriesId: number) => {
    navigate(`/series/${seriesId}`);
  };

  const navigateToEpisode = (seriesId: number, seasonNumber: number, episodeNumber: number) => {
    navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${episodeNumber}`);
  };

  const navigateToEpisodeDiscussion = (
    seriesId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => {
    navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${episodeNumber}?tab=discussions`);
  };

  // Relative date label
  const getRelativeDateLabel = (episode: WatchedEpisode) => {
    if (episode.daysAgo === 0) return 'Heute';
    if (episode.daysAgo === 1) return 'Gestern';
    if (episode.daysAgo === 2) return 'Vorgestern';
    if (episode.daysAgo <= 7) return `Vor ${episode.daysAgo} Tagen`;
    if (episode.daysAgo <= 14) return 'Letzte Woche';
    if (episode.daysAgo <= 30) return `Vor ${Math.floor(episode.daysAgo / 7)} Wochen`;
    return `Vor ${Math.floor(episode.daysAgo / 30)} Monaten`;
  };

  // Group episodes by series
  const groupEpisodesBySeries = (episodes: WatchedEpisode[]) => {
    const grouped: { [seriesId: number]: WatchedEpisode[] } = {};
    for (const episode of episodes) {
      if (!grouped[episode.seriesId]) {
        grouped[episode.seriesId] = [];
      }
      grouped[episode.seriesId].push(episode);
    }
    return grouped;
  };

  // Total episodes count
  const totalEpisodes = loadedDateGroups.reduce((sum, group) => sum + group.episodes.length, 0);

  return {
    searchQuery,
    setSearchQuery,
    daysToShow,
    isLoading,
    expandedSeries,
    completingEpisodes,
    loadedDateGroups,
    totalEpisodes,
    headerHeight,
    headerRef,
    handleRewatchEpisode,
    toggleSeriesExpanded,
    isSeriesExpanded,
    handleTimeRangeChange,
    navigateToSeries,
    navigateToEpisode,
    navigateToEpisodeDiscussion,
    getRelativeDateLabel,
    groupEpisodesBySeries,
  };
};
