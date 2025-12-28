import {
  AccessTime,
  CalendarToday,
  ChatBubbleOutline,
  Check,
  CheckCircle,
  ExpandLess,
  ExpandMore,
  History,
  PlayCircle,
  Search,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { BackButton } from '../components/BackButton';
import { HorizontalScrollContainer } from '../components/HorizontalScrollContainer';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { useDiscussionCount } from '../hooks/useDiscussionCounts';
import { petService } from '../services/petService';

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
        background: 'transparent',
        border: 'none',
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

  constructor(private seriesList: any[], private daysToShow: number, private searchQuery: string) {
    this.initializeDateGroups();
  }

  private initializeDateGroups() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create date groups for the requested period
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

  private getImageUrl(posterObj: any): string {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  }

  // Load episodes for a specific date range
  async loadEpisodesForDateRange(startDate: string, endDate: string): Promise<void> {
    const cacheKey = `${startDate}-${endDate}`;

    if (this.cache.has(cacheKey)) {
      return; // Already loaded
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize dates to start/end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const episodes: WatchedEpisode[] = [];

    console.log(`Loading episodes for date range: ${start.toDateString()} to ${end.toDateString()}`);
    console.log(`Searching ${this.seriesList.length} series for watched episodes`);

    // Filter series by search query first
    const filteredSeries = this.searchQuery
      ? this.seriesList.filter(series =>
          series.title?.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      : this.seriesList;

    console.log(`Search query: "${this.searchQuery}" - Found ${filteredSeries.length} matching series`);

    // Process episodes more efficiently
    for (const series of filteredSeries) {
      if (!series.seasons) continue;

      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons);

      for (let seasonIdx = 0; seasonIdx < seasonsArray.length; seasonIdx++) {
        const season = seasonsArray[seasonIdx] as any;
        if (!season?.episodes) continue;

        const episodesArray = Array.isArray(season.episodes)
          ? season.episodes
          : Object.values(season.episodes);

        for (let episodeIndex = 0; episodeIndex < episodesArray.length; episodeIndex++) {
          const episode = episodesArray[episodeIndex] as any;

          // Check if episode is watched (multiple formats)
          const isWatched = !!(
            episode?.watched === true ||
            episode?.watched === 1 ||
            episode?.watched === "true" ||
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
            // Estimate based on position
            watchedDate = new Date();
            const estimatedDaysAgo = (seasonIdx * 20) + (episodeIndex * 2) + Math.floor(Math.random() * 7);
            watchedDate.setDate(watchedDate.getDate() - estimatedDaysAgo);
            dateSource = 'estimated';
          }

          if (isNaN(watchedDate.getTime())) continue;
          watchedDate.setHours(0, 0, 0, 0);

          // Check if in date range - use proper date comparison
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
              seasonIndex: season.seasonIndex ?? seasonIdx,
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

    // Sort by date (newest first)
    episodes.sort((a, b) => b.firstWatchedAt.getTime() - a.firstWatchedAt.getTime());

    // Cache the results
    this.cache.set(cacheKey, episodes);
    console.log(`Found ${episodes.length} watched episodes in date range`);

    // Distribute episodes to date groups
    for (const episode of episodes) {
      const dateKey = episode.firstWatchedAt.toDateString();
      let group = this.dateGroups.get(dateKey);

      // Create group if it doesn't exist
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

    console.log(`Distributed episodes into ${this.dateGroups.size} date groups`);
  }

  // Get episodes for a specific date
  getEpisodesForDate(dateKey: string): WatchedEpisode[] {
    const group = this.dateGroups.get(dateKey);
    return group?.episodes || [];
  }

  // Get all date groups
  getDateGroups(): DateGroup[] {
    return Array.from(this.dateGroups.values());
  }

  // Mark date group as loaded
  markDateGroupLoaded(dateKey: string) {
    const group = this.dateGroups.get(dateKey);
    if (group) {
      group.loaded = true;
      group.loading = false;
    }
  }

  // Mark date group as loading
  markDateGroupLoading(dateKey: string) {
    const group = this.dateGroups.get(dateKey);
    if (group) {
      group.loading = true;
    }
  }

  // Clear cache
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

  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(220);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(`Debounced search query changed to: "${searchQuery}"`);
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Create data manager
  const dataManager = useMemo(() => {
    return new EpisodeDataManager(seriesList, daysToShow, debouncedSearchQuery);
  }, [seriesList, daysToShow, debouncedSearchQuery]);

  const [loadedDateGroups, setLoadedDateGroups] = useState<DateGroup[]>([]);

  // Reset data when search changes
  useEffect(() => {
    setLoadedDateGroups([]);
    dataManager.clearCache();
    setIsLoading(true);
  }, [debouncedSearchQuery, daysToShow]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      // Load data based on selected time period
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - daysToShow);

      try {
        await dataManager.loadEpisodesForDateRange(
          startDate.toDateString(),
          today.toDateString()
        );

        // Update visible date groups - load all available days up to the limit
        const allDateGroups = dataManager.getDateGroups();
        console.log(`DataManager has ${allDateGroups.length} date groups:`, allDateGroups.map(g => `${g.date} (${g.episodes.length} episodes)`));

        const availableDays = Math.min(daysToShow, allDateGroups.length);
        const selectedGroups = allDateGroups.slice(0, availableDays);
        console.log(`Setting ${selectedGroups.length} loaded date groups`);
        setLoadedDateGroups(selectedGroups);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [dataManager, daysToShow]);

  // Measure header height
  useEffect(() => {
    if (headerRef.current) {
      const updateHeaderHeight = () => {
        const height = headerRef.current?.offsetHeight || 220;
        setHeaderHeight(height);
      };

      updateHeaderHeight();
      window.addEventListener('resize', updateHeaderHeight);
      return () => window.removeEventListener('resize', updateHeaderHeight);
    }
  }, []);

  // Load more data when scrolling
  const handleScroll = useCallback(async () => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!scrollableDiv) return;

    const scrollTop = scrollableDiv.scrollTop;
    const scrollHeight = scrollableDiv.scrollHeight;
    const clientHeight = scrollableDiv.clientHeight;

    // Load more when near bottom
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
      const seriesGenre = series?.genre?.genres?.[0] || 'Drama';
      await petService.watchedSeriesWithGenre(user.uid, seriesGenre);

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

  // Get relative date label
  const getRelativeDateLabel = (episode: WatchedEpisode) => {
    if (episode.daysAgo === 0) return 'Heute';
    if (episode.daysAgo === 1) return 'Gestern';
    if (episode.daysAgo === 2) return 'Vorgestern';
    if (episode.daysAgo <= 7) return `Vor ${episode.daysAgo} Tagen`;
    if (episode.daysAgo <= 14) return 'Letzte Woche';
    if (episode.daysAgo <= 30) return `Vor ${Math.floor(episode.daysAgo / 7)} Wochen`;
    return `Vor ${Math.floor(episode.daysAgo / 30)} Monaten`;
  };

  // Group episodes by series within each date
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

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Header */}
      <header
        ref={headerRef}
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          padding: '20px',
          paddingTop: 'calc(30px + env(safe-area-inset-top))',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, ${currentTheme.primary}05 0%, ${currentTheme.primary}0D 50%, ${currentTheme.primary}05 100%)`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <BackButton />

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.primary}CC 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Zuletzt gesehen
            </h1>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: '4px 0 0 0',
              }}
            >
              {totalEpisodes} Episoden in {daysToShow} Tagen
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '20px',
              color: currentTheme.text.secondary,
            }}
          />
          <input
            type="text"
            placeholder="Nach Serie suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: `${currentTheme.background}99`,
              border: `1px solid ${currentTheme.primary}33`,
              borderRadius: '12px',
              color: currentTheme.text.primary,
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: currentTheme.text.secondary,
                cursor: 'pointer',
                padding: '4px',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Time range chips */}
        <HorizontalScrollContainer gap={12} style={{ paddingBottom: '8px' }}>
          {[7, 30, 90, 365].map((days) => (
            <motion.div
              key={days}
              onClick={() => {
                setDaysToShow(days);
                setLoadedDateGroups([]);
                setIsLoading(true);
                dataManager.clearCache();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background:
                  daysToShow === days
                    ? `linear-gradient(135deg, ${currentTheme.primary}2D 0%, ${currentTheme.primary}1A 100%)`
                    : 'rgba(255, 255, 255, 0.05)',
                border:
                  daysToShow === days
                    ? `1px solid ${currentTheme.primary}4D`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '8px 12px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                cursor: 'pointer',
                color:
                  daysToShow === days ? currentTheme.primary : currentTheme.text.secondary,
              }}
            >
              {days === 7 ? '7 Tage' : days === 30 ? '30 Tage' : days === 90 ? '3 Monate' : '1 Jahr'}
            </motion.div>
          ))}
        </HorizontalScrollContainer>
      </header>

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
          {isLoading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: currentTheme.text.secondary,
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: `3px solid ${currentTheme.primary}33`,
                  borderTop: `3px solid ${currentTheme.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px',
                }}
              />
              <p>Lade Episoden...</p>
            </div>
          ) : loadedDateGroups.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <History style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
              <h3>Keine gesehenen Episoden</h3>
              <p>Du hast in den letzten {daysToShow} Tagen keine Episoden gesehen</p>
            </div>
          ) : (
            loadedDateGroups.map((dateGroup) => {
              if (dateGroup.episodes.length === 0) return null;

              const groupedEpisodes = groupEpisodesByDate(dateGroup.episodes);
              const isToday = dateGroup.displayDate === 'Heute';

              return (
                <motion.div
                  key={dateGroup.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ marginBottom: '28px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      padding: '8px 12px',
                      background: isToday
                        ? `linear-gradient(135deg, ${currentTheme.primary}2D 0%, ${currentTheme.primary}1A 100%)`
                        : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: isToday
                        ? `2px solid ${currentTheme.primary}4D`
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      backdropFilter: isToday ? 'blur(10px)' : 'none',
                      WebkitBackdropFilter: isToday ? 'blur(10px)' : 'none',
                    }}
                  >
                    <CalendarToday
                      style={{
                        fontSize: '18px',
                        color: isToday ? currentTheme.primary : currentTheme.text.secondary,
                      }}
                    />
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        margin: 0,
                        color: isToday ? currentTheme.primary : 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      {dateGroup.displayDate}
                    </h3>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {dateGroup.episodes.length} Episode{dateGroup.episodes.length !== 1 ? 'n' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(groupedEpisodes).map(([seriesId, episodes]) => {
                      const firstEpisode = episodes[0];
                      const isExpanded = isSeriesExpanded(dateGroup.date, Number(seriesId));

                      // Single episode display
                      if (episodes.length === 1) {
                        const episode = episodes[0];
                        const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                        const isCompleting = completingEpisodes.has(episodeKey);

                        return (
                          <motion.div
                            key={episodeKey}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                              opacity: isCompleting ? 0.5 : 1,
                              y: 0,
                              scale: isCompleting ? 0.95 : 1,
                            }}
                            style={{
                              display: 'flex',
                              gap: '10px',
                              padding: '10px',
                              background: isCompleting
                                ? `linear-gradient(90deg, ${currentTheme.status.success}33 0%, ${currentTheme.status.success}0D 100%)`
                                : `${currentTheme.status.success}0A`,
                              borderRadius: '12px',
                              border: `1px solid ${
                                isCompleting
                                  ? `${currentTheme.status.success}66`
                                  : `${currentTheme.status.success}1A`
                              }`,
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <img
                              src={episode.seriesPoster}
                              alt={episode.seriesName}
                              onClick={() => {
                                navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}`);
                              }}
                              style={{
                                width: '48px',
                                height: '72px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                cursor: 'pointer',
                              }}
                            />

                            <div style={{ flex: 1 }}>
                              <h4
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  margin: '0 0 4px 0',
                                  color: currentTheme.status.success,
                                }}
                              >
                                {episode.seriesName}
                              </h4>

                              <p
                                style={{
                                  fontSize: '13px',
                                  margin: '0 0 4px 0',
                                  color: 'rgba(255, 255, 255, 0.6)',
                                }}
                              >
                                S{episode.seasonNumber} E{episode.episodeNumber} • {episode.episodeName}
                              </p>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '12px',
                                  color: 'rgba(255, 255, 255, 0.4)',
                                }}
                              >
                                <AccessTime style={{ fontSize: '12px' }} />
                                {getRelativeDateLabel(episode)}
                                {episode.dateSource !== 'firstWatched' && (
                                  <span
                                    style={{
                                      background: 'rgba(255, 193, 7, 0.1)',
                                      border: '1px solid rgba(255, 193, 7, 0.3)',
                                      borderRadius: '4px',
                                      padding: '1px 4px',
                                      fontSize: '10px',
                                      color: '#ffc107',
                                    }}
                                  >
                                    {episode.dateSource === 'lastWatched' ? 'zuletzt' :
                                     episode.dateSource === 'airDate' ? 'Sendedatum' : 'geschätzt'}
                                  </span>
                                )}
                                {episode.watchCount > 1 && (
                                  <span
                                    style={{
                                      background: currentTheme.status.info.main + '1A',
                                      border: `1px solid ${currentTheme.status.info.main}33`,
                                      borderRadius: '4px',
                                      padding: '1px 4px',
                                      fontSize: '11px',
                                      color: currentTheme.status.info.main,
                                    }}
                                  >
                                    {episode.watchCount}x
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <EpisodeDiscussionIndicator
                                seriesId={episode.seriesId}
                                seasonNumber={episode.seasonNumber}
                                episodeNumber={episode.episodeNumber}
                                onClick={() => navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}?tab=discussions`)}
                              />

                              <button
                                onClick={() => handleRewatchEpisode(episode)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: currentTheme.status.success,
                                  cursor: 'pointer',
                                  padding: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {isCompleting ? (
                                  <Check style={{ fontSize: '20px' }} />
                                ) : (
                                  <CheckCircle style={{ fontSize: '20px' }} />
                                )}
                              </button>
                            </div>
                          </motion.div>
                        );
                      }

                      // Multiple episodes - accordion
                      return (
                        <motion.div
                          key={seriesId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            background: `${currentTheme.status.success}0D`,
                            borderRadius: '12px',
                            border: `1px solid ${currentTheme.status.success}33`,
                            overflow: 'hidden',
                          }}
                        >
                          {/* Accordion Header */}
                          <div
                            onClick={() => toggleSeriesExpanded(dateGroup.date, Number(seriesId))}
                            style={{
                              display: 'flex',
                              gap: '12px',
                              padding: '12px',
                              cursor: 'pointer',
                              background: 'rgba(255, 255, 255, 0.02)',
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
                                width: '60px',
                                height: '90px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                cursor: 'pointer',
                              }}
                            />

                            <div style={{ flex: 1 }}>
                              <h4
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  margin: '0 0 4px 0',
                                  color: currentTheme.status.success,
                                }}
                              >
                                {firstEpisode.seriesName}
                              </h4>

                              <p
                                style={{
                                  fontSize: '13px',
                                  margin: '0 0 4px 0',
                                  color: 'rgba(255, 255, 255, 0.6)',
                                }}
                              >
                                {episodes.length} Episoden gesehen
                              </p>

                              <p
                                style={{
                                  fontSize: '12px',
                                  margin: 0,
                                  color: 'rgba(255, 255, 255, 0.4)',
                                }}
                              >
                                {getRelativeDateLabel(firstEpisode)}
                              </p>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                color: 'rgba(255, 255, 255, 0.6)',
                              }}
                            >
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </div>
                          </div>

                          {/* Expanded Episodes */}
                          {isExpanded && (
                            <div
                              style={{
                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '8px',
                              }}
                            >
                              {episodes.map((episode, idx) => (
                                <div
                                  key={`${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background:
                                      idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <p
                                      style={{
                                        fontSize: '13px',
                                        margin: 0,
                                        color: currentTheme.status.success,
                                      }}
                                    >
                                      S{episode.seasonNumber} E{episode.episodeNumber} • {episode.episodeName}
                                    </p>
                                    <p
                                      style={{
                                        fontSize: '11px',
                                        margin: '2px 0 0 0',
                                        color: 'rgba(255, 255, 255, 0.4)',
                                      }}
                                    >
                                      {getRelativeDateLabel(episode)}
                                      {episode.watchCount > 1 && ` • ${episode.watchCount}x gesehen`}
                                    </p>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <EpisodeDiscussionIndicator
                                      seriesId={episode.seriesId}
                                      seasonNumber={episode.seasonNumber}
                                      episodeNumber={episode.episodeNumber}
                                      onClick={() => navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}?tab=discussions`)}
                                    />

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRewatchEpisode(episode);
                                      }}
                                      style={{
                                        background: `${currentTheme.status.success}1A`,
                                        border: `1px solid ${currentTheme.status.success}33`,
                                        borderRadius: '8px',
                                        padding: '6px',
                                        color: currentTheme.status.success,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <PlayCircle style={{ fontSize: '18px' }} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Loading more indicator */}
          {loadedDateGroups.length < daysToShow && totalEpisodes > 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                color: currentTheme.text.secondary,
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  border: `2px solid ${currentTheme.primary}33`,
                  borderTop: `2px solid ${currentTheme.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 8px',
                }}
              />
              <p style={{ fontSize: '14px' }}>Lade weitere Episoden...</p>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
});