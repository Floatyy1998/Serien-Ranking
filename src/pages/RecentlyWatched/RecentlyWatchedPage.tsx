/**
 * RecentlyWatchedPage - Premium Watch History
 * Shows recently watched episodes with timeline view
 */

import {
  CalendarToday,
  ChatBubbleOutline,
  Check,
  ExpandLess,
  ExpandMore,
  History,
  PlayCircle,
  Search,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiscussionCount } from '../../hooks/useDiscussionCounts';
import { petService } from '../../services/petService';
import { LoadingSpinner, PageHeader, PageLayout } from '../../components/ui';
import type { Series } from '../../types/Series';

// Component to show discussion indicator for an episode
const EpisodeDiscussionIndicator: React.FC<{
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  onClick?: () => void;
}> = memo(({ seriesId, seasonNumber, episodeNumber, onClick }) => {
  const { currentTheme } = useTheme();
  const count = useDiscussionCount('episode', seriesId, seasonNumber, episodeNumber);

  if (count === 0) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={`${count} Diskussion${count !== 1 ? 'en' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: `${currentTheme.primary}15`,
        border: `1px solid ${currentTheme.primary}30`,
        borderRadius: '8px',
        color: currentTheme.primary,
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      <ChatBubbleOutline style={{ fontSize: '14px' }} />
      {count}
    </button>
  );
});

interface WatchedEpisode {
  seriesId: number;
  seriesName: string;
  seriesPoster: string;
  seriesNmr: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeName: string;
  episodeNumber: number;
  seasonNumber: number;
  firstWatchedAt: Date;
  watchCount: number;
  daysAgo: number;
  dateSource: 'firstWatched' | 'lastWatched' | 'airDate' | 'estimated';
}

interface DateGroup {
  date: string;
  displayDate: string;
  episodes: WatchedEpisode[];
  loaded: boolean;
  loading: boolean;
}

// Intelligent episode data manager
class EpisodeDataManager {
  private cache = new Map<string, WatchedEpisode[]>();
  private dateGroups = new Map<string, DateGroup>();

  constructor(private seriesList: Series[], private daysToShow: number, private searchQuery: string) {
    this.initializeDateGroups();
  }

  private initializeDateGroups() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < this.daysToShow; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dateKey = date.toDateString();
      const displayDate = this.getDisplayDate(date, i);

      this.dateGroups.set(dateKey, {
        date: dateKey,
        displayDate,
        episodes: [],
        loaded: false,
        loading: false
      });
    }
  }

  private getDisplayDate(date: Date, daysAgo: number): string {
    if (daysAgo === 0) return 'Heute';
    if (daysAgo === 1) return 'Gestern';
    if (daysAgo === 2) return 'Vorgestern';

    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }

  private getImageUrl(posterObj: string | { poster: string } | null | undefined): string {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  }

  async loadEpisodesForDateRange(startDate: string, endDate: string): Promise<void> {
    const cacheKey = `${startDate}-${endDate}`;

    if (this.cache.has(cacheKey)) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const episodes: WatchedEpisode[] = [];

    const filteredSeries = this.searchQuery
      ? this.seriesList.filter(series =>
          series.title?.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      : this.seriesList;

    for (const series of filteredSeries) {
      if (!series.seasons) continue;

      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons);

      for (let seasonIdx = 0; seasonIdx < seasonsArray.length; seasonIdx++) {
        const season = seasonsArray[seasonIdx] as Series['seasons'][number];
        if (!season?.episodes) continue;

        const episodesArray = Array.isArray(season.episodes)
          ? season.episodes
          : Object.values(season.episodes);

        for (let episodeIndex = 0; episodeIndex < episodesArray.length; episodeIndex++) {
          const episode = episodesArray[episodeIndex] as Series['seasons'][number]['episodes'][number];

          const isWatched = !!(
            episode?.watched === true ||
            (episode?.watched as unknown) === 1 ||
            (episode?.watched as unknown) === "true" ||
            (episode?.watchCount && episode.watchCount > 0) ||
            episode?.firstWatchedAt ||
            episode?.lastWatchedAt
          );

          if (!isWatched) continue;

          let watchedDate: Date;
          let dateSource: 'firstWatched' | 'lastWatched' | 'airDate' | 'estimated';

          if (episode.firstWatchedAt) {
            watchedDate = new Date(episode.firstWatchedAt);
            dateSource = 'firstWatched';
          } else if (episode.lastWatchedAt) {
            watchedDate = new Date(episode.lastWatchedAt);
            dateSource = 'lastWatched';
          } else if (episode.air_date) {
            watchedDate = new Date(episode.air_date);
            dateSource = 'airDate';
          } else {
            watchedDate = new Date();
            const estimatedDaysAgo = (seasonIdx * 20) + (episodeIndex * 2) + Math.floor(Math.random() * 7);
            watchedDate.setDate(watchedDate.getDate() - estimatedDaysAgo);
            dateSource = 'estimated';
          }

          if (isNaN(watchedDate.getTime())) continue;
          watchedDate.setHours(0, 0, 0, 0);

          const watchedTime = watchedDate.getTime();
          const startTime = start.getTime();
          const endTime = end.getTime();

          if (watchedTime >= startTime && watchedTime <= endTime) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const daysAgo = Math.floor(
              (today.getTime() - watchedDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            episodes.push({
              seriesId: series.id,
              seriesName: series.title || '',
              seriesPoster: this.getImageUrl(series.poster),
              seriesNmr: series.nmr,
              seasonIndex: seasonIdx,
              episodeIndex,
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              episodeNumber: episodeIndex + 1,
              seasonNumber: (season.seasonNumber ?? seasonIdx) + 1,
              firstWatchedAt: watchedDate,
              watchCount: episode.watchCount || 1,
              daysAgo,
              dateSource,
            });
          }
        }
      }
    }

    episodes.sort((a, b) => b.firstWatchedAt.getTime() - a.firstWatchedAt.getTime());
    this.cache.set(cacheKey, episodes);

    for (const episode of episodes) {
      const dateKey = episode.firstWatchedAt.toDateString();
      let group = this.dateGroups.get(dateKey);

      if (!group) {
        const date = new Date(episode.firstWatchedAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const displayDate = this.getDisplayDate(date, daysAgo);

        group = {
          date: dateKey,
          displayDate,
          episodes: [],
          loaded: true,
          loading: false
        };
        this.dateGroups.set(dateKey, group);
      }

      group.episodes.push(episode);
    }
  }

  getEpisodesForDate(dateKey: string): WatchedEpisode[] {
    const group = this.dateGroups.get(dateKey);
    return group?.episodes || [];
  }

  getDateGroups(): DateGroup[] {
    return Array.from(this.dateGroups.values());
  }

  markDateGroupLoaded(dateKey: string) {
    const group = this.dateGroups.get(dateKey);
    if (group) {
      group.loaded = true;
      group.loading = false;
    }
  }

  markDateGroupLoading(dateKey: string) {
    const group = this.dateGroups.get(dateKey);
    if (group) {
      group.loading = true;
    }
  }

  clearCache() {
    this.cache.clear();
    this.dateGroups.clear();
  }
}

export const RecentlyWatchedPage = memo(() => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [daysToShow, setDaysToShow] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(200);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const dataManager = useMemo(() => {
    return new EpisodeDataManager(seriesList, daysToShow, debouncedSearchQuery);
  }, [seriesList, daysToShow, debouncedSearchQuery]);

  const [loadedDateGroups, setLoadedDateGroups] = useState<DateGroup[]>([]);

  useEffect(() => {
    setLoadedDateGroups([]);
    dataManager.clearCache();
    setIsLoading(true);
  }, [debouncedSearchQuery, daysToShow]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToShow);

      try {
        await dataManager.loadEpisodesForDateRange(
          startDate.toDateString(),
          today.toDateString()
        );

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

  useEffect(() => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', handleScroll);
      return () => scrollableDiv.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleRewatchEpisode = async (episode: WatchedEpisode) => {
    if (!user) return;

    const key = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

    try {
      const watchCountRef = firebase
        .database()
        .ref(
          `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
        );
      await watchCountRef.set(episode.watchCount + 1);

      const lastWatchedRef = firebase
        .database()
        .ref(
          `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/lastWatchedAt`
        );
      await lastWatchedRef.set(new Date().toISOString());

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

  const getRelativeDateLabel = (episode: WatchedEpisode) => {
    if (episode.daysAgo === 0) return 'Heute';
    if (episode.daysAgo === 1) return 'Gestern';
    if (episode.daysAgo === 2) return 'Vorgestern';
    if (episode.daysAgo <= 7) return `Vor ${episode.daysAgo} Tagen`;
    if (episode.daysAgo <= 14) return 'Letzte Woche';
    if (episode.daysAgo <= 30) return `Vor ${Math.floor(episode.daysAgo / 7)} Wochen`;
    return `Vor ${Math.floor(episode.daysAgo / 30)} Monaten`;
  };

  const groupEpisodesByDate = (episodes: WatchedEpisode[]) => {
    const grouped: { [seriesId: number]: WatchedEpisode[] } = {};
    for (const episode of episodes) {
      if (!grouped[episode.seriesId]) {
        grouped[episode.seriesId] = [];
      }
      grouped[episode.seriesId].push(episode);
    }
    return grouped;
  };

  const totalEpisodes = loadedDateGroups.reduce((sum, group) => sum + group.episodes.length, 0);

  const timeRanges = [
    { days: 7, label: '7 Tage' },
    { days: 30, label: '30 Tage' },
    { days: 90, label: '3 Monate' },
    { days: 365, label: '1 Jahr' },
  ];

  return (
    <PageLayout gradientColors={[currentTheme.status.success, currentTheme.primary]} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Fixed Header */}
      <div
        ref={headerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: `${currentTheme.background.default}ee`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <PageHeader
          title="Verlauf"
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.status.success}
          sticky={false}
          actions={
            totalEpisodes > 0 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    background: `${currentTheme.status.success}15`,
                    border: `1px solid ${currentTheme.status.success}30`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <PlayCircle style={{ fontSize: 16, color: currentTheme.status.success }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: currentTheme.status.success }}>
                    {totalEpisodes}
                  </span>
                </div>
              </motion.div>
            ) : undefined
          }
        />

        {/* Search Bar */}
        <div
          style={{
            marginBottom: '16px',
            position: 'relative',
            padding: '0 20px',
          }}
        >
          <Search
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '20px',
              color: currentTheme.text.muted,
            }}
          />
          <input
            type="text"
            placeholder="Serie suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '14px',
              color: currentTheme.text.primary,
              fontSize: '15px',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: `${currentTheme.text.muted}20`,
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                color: currentTheme.text.muted,
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Time Range Chips */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            padding: '0 20px 4px',
          }}
        >
          {timeRanges.map((range) => (
            <motion.button
              key={range.days}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setDaysToShow(range.days);
                setLoadedDateGroups([]);
                setIsLoading(true);
                dataManager.clearCache();
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: 'none',
                background: daysToShow === range.days
                  ? `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.primary})`
                  : currentTheme.background.surface,
                boxShadow: daysToShow === range.days
                  ? `0 4px 12px ${currentTheme.status.success}40`
                  : 'none',
                color: daysToShow === range.days ? '#fff' : currentTheme.text.secondary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {range.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Scrollable Episodes Container */}
      <div
        data-scrollable="episodes"
        style={{
          position: 'fixed',
          top: headerHeight,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'auto',
        }}
      >
        <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner color={currentTheme.status.success} text="Lade Verlauf..." />
              </motion.div>
            ) : totalEpisodes === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                }}
              >
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    margin: '0 auto 24px',
                    borderRadius: '50%',
                    background: `${currentTheme.text.muted}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <History style={{ fontSize: '48px', color: currentTheme.text.muted }} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700 }}>
                  Keine Episoden gefunden
                </h3>
                <p style={{ margin: 0, color: currentTheme.text.muted, fontSize: '15px' }}>
                  {searchQuery
                    ? `Keine Ergebnisse für "${searchQuery}"`
                    : `In den letzten ${daysToShow} Tagen keine Episoden gesehen`}
                </p>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {loadedDateGroups.map((dateGroup, groupIndex) => {
                  if (dateGroup.episodes.length === 0) return null;

                  const groupedEpisodes = groupEpisodesByDate(dateGroup.episodes);
                  const isToday = dateGroup.displayDate === 'Heute';
                  const isYesterday = dateGroup.displayDate === 'Gestern';

                  return (
                    <motion.div
                      key={dateGroup.date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.05 }}
                      style={{ marginBottom: '24px' }}
                    >
                      {/* Date Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '12px',
                          padding: '10px 14px',
                          background: isToday
                            ? `linear-gradient(135deg, ${currentTheme.status.success}20, ${currentTheme.primary}15)`
                            : currentTheme.background.surface,
                          borderRadius: '14px',
                          border: `1px solid ${isToday ? currentTheme.status.success : currentTheme.border.default}40`,
                        }}
                      >
                        <CalendarToday
                          style={{
                            fontSize: '18px',
                            color: isToday ? currentTheme.status.success : currentTheme.text.muted,
                          }}
                        />
                        <h3
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            margin: 0,
                            color: isToday || isYesterday
                              ? currentTheme.status.success
                              : currentTheme.text.primary,
                          }}
                        >
                          {dateGroup.displayDate}
                        </h3>
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '12px',
                            color: currentTheme.text.muted,
                            background: `${currentTheme.text.muted}15`,
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {dateGroup.episodes.length} Ep.
                        </span>
                      </div>

                      {/* Episodes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(groupedEpisodes).map(([seriesId, episodes]) => {
                          const firstEpisode = episodes[0];
                          const isExpanded = isSeriesExpanded(dateGroup.date, Number(seriesId));

                          if (episodes.length === 1) {
                            const episode = episodes[0];
                            const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                            const isCompleting = completingEpisodes.has(episodeKey);

                            return (
                              <motion.div
                                key={episodeKey}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{
                                  opacity: isCompleting ? 0.6 : 1,
                                  x: 0,
                                  scale: isCompleting ? 0.98 : 1,
                                }}
                                style={{
                                  display: 'flex',
                                  gap: '12px',
                                  padding: '12px',
                                  background: currentTheme.background.surface,
                                  borderRadius: '16px',
                                  border: `1px solid ${currentTheme.border.default}`,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                }}
                              >
                                <img
                                  src={episode.seriesPoster}
                                  alt={episode.seriesName}
                                  onClick={() => navigate(`/series/${episode.seriesId}`)}
                                  style={{
                                    width: '52px',
                                    height: '78px',
                                    objectFit: 'cover',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  }}
                                />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h4
                                    onClick={() => navigate(`/series/${episode.seriesId}`)}
                                    style={{
                                      fontSize: '14px',
                                      fontWeight: 700,
                                      margin: '0 0 4px 0',
                                      color: currentTheme.text.primary,
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {episode.seriesName}
                                  </h4>

                                  <p
                                    onClick={() => navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}`)}
                                    style={{
                                      fontSize: '13px',
                                      margin: '0 0 6px 0',
                                      color: currentTheme.text.secondary,
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    S{episode.seasonNumber} E{episode.episodeNumber} • {episode.episodeName}
                                  </p>

                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    {episode.watchCount > 1 && (
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          background: `${currentTheme.primary}15`,
                                          color: currentTheme.primary,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {episode.watchCount}x
                                      </span>
                                    )}
                                    {episode.dateSource !== 'firstWatched' && (
                                      <span
                                        style={{
                                          fontSize: '10px',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          background: '#fbbf2415',
                                          color: '#fbbf24',
                                        }}
                                      >
                                        {episode.dateSource === 'lastWatched' ? 'zuletzt' :
                                         episode.dateSource === 'airDate' ? 'Ausstrahlung' : 'geschätzt'}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                  <EpisodeDiscussionIndicator
                                    seriesId={episode.seriesId}
                                    seasonNumber={episode.seasonNumber}
                                    episodeNumber={episode.episodeNumber}
                                    onClick={() => navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}?tab=discussions`)}
                                  />

                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRewatchEpisode(episode)}
                                    style={{
                                      background: `${currentTheme.status.success}15`,
                                      border: `1px solid ${currentTheme.status.success}30`,
                                      borderRadius: '10px',
                                      padding: '8px',
                                      color: currentTheme.status.success,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {isCompleting ? (
                                      <Check style={{ fontSize: '20px' }} />
                                    ) : (
                                      <PlayCircle style={{ fontSize: '20px' }} />
                                    )}
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          }

                          // Multiple episodes - accordion
                          return (
                            <motion.div
                              key={seriesId}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              style={{
                                background: currentTheme.background.surface,
                                borderRadius: '16px',
                                border: `1px solid ${currentTheme.border.default}`,
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                              }}
                            >
                              <div
                                onClick={() => toggleSeriesExpanded(dateGroup.date, Number(seriesId))}
                                style={{
                                  display: 'flex',
                                  gap: '12px',
                                  padding: '12px',
                                  cursor: 'pointer',
                                }}
                              >
                                <img
                                  src={firstEpisode.seriesPoster}
                                  alt={firstEpisode.seriesName}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/series/${firstEpisode.seriesId}`);
                                  }}
                                  style={{
                                    width: '56px',
                                    height: '84px',
                                    objectFit: 'cover',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  }}
                                />

                                <div style={{ flex: 1 }}>
                                  <h4
                                    style={{
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      margin: '0 0 6px 0',
                                      color: currentTheme.text.primary,
                                    }}
                                  >
                                    {firstEpisode.seriesName}
                                  </h4>

                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      marginBottom: '6px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '13px',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        background: `${currentTheme.status.success}15`,
                                        color: currentTheme.status.success,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {episodes.length} Episoden
                                    </span>
                                  </div>

                                  <p
                                    style={{
                                      fontSize: '12px',
                                      margin: 0,
                                      color: currentTheme.text.muted,
                                    }}
                                  >
                                    {getRelativeDateLabel(firstEpisode)}
                                  </p>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: currentTheme.text.muted,
                                  }}
                                >
                                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </div>
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                      borderTop: `1px solid ${currentTheme.border.default}`,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div style={{ padding: '8px' }}>
                                      {episodes.map((episode, idx) => {
                                        const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                                        const isCompleting = completingEpisodes.has(episodeKey);

                                        return (
                                          <motion.div
                                            key={episodeKey}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '12px',
                                              padding: '10px',
                                              borderRadius: '10px',
                                              background: idx % 2 === 0 ? 'transparent' : `${currentTheme.text.muted}05`,
                                            }}
                                          >
                                            <div style={{ flex: 1 }}>
                                              <p
                                                onClick={() => navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}`)}
                                                style={{
                                                  fontSize: '13px',
                                                  margin: 0,
                                                  color: currentTheme.text.primary,
                                                  cursor: 'pointer',
                                                  fontWeight: 500,
                                                }}
                                              >
                                                S{episode.seasonNumber} E{episode.episodeNumber} • {episode.episodeName}
                                              </p>
                                              {episode.watchCount > 1 && (
                                                <p
                                                  style={{
                                                    fontSize: '11px',
                                                    margin: '2px 0 0 0',
                                                    color: currentTheme.text.muted,
                                                  }}
                                                >
                                                  {episode.watchCount}x gesehen
                                                </p>
                                              )}
                                            </div>

                                            <EpisodeDiscussionIndicator
                                              seriesId={episode.seriesId}
                                              seasonNumber={episode.seasonNumber}
                                              episodeNumber={episode.episodeNumber}
                                              onClick={() => navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}?tab=discussions`)}
                                            />

                                            <motion.button
                                              whileTap={{ scale: 0.9 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRewatchEpisode(episode);
                                              }}
                                              style={{
                                                background: `${currentTheme.status.success}15`,
                                                border: `1px solid ${currentTheme.status.success}30`,
                                                borderRadius: '8px',
                                                padding: '6px',
                                                color: currentTheme.status.success,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              {isCompleting ? (
                                                <Check style={{ fontSize: '16px' }} />
                                              ) : (
                                                <PlayCircle style={{ fontSize: '16px' }} />
                                              )}
                                            </motion.button>
                                          </motion.div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Bottom Spacer */}
                <div style={{ height: '100px' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageLayout>
  );
});
