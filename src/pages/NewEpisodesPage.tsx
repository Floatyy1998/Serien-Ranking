import {
  CalendarToday,
  Check,
  CheckCircle,
  ExpandLess,
  ExpandMore,
  NewReleases,
  PlayCircle,
  Search,
  Timer,
  Today,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { BackButton } from '../components/BackButton';
import { HorizontalScrollContainer } from '../components/HorizontalScrollContainer';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { petService } from '../services/petService';

interface UpcomingEpisode {
  seriesId: number;
  seriesName: string;
  seriesPoster: string;
  seriesNmr: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeName: string;
  episodeNumber: number;
  seasonNumber: number;
  airDate: Date;
  daysUntil: number;
  watched: boolean;
}

export const NewEpisodesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();
  const [showAllSeries, setShowAllSeries] = useState<boolean>(true);
  const [markedWatched, setMarkedWatched] = useState<Set<string>>(new Set());
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsets, setDragOffsets] = useState<{ [key: string]: number }>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [daysPast, setDaysPast] = useState<number>(0); // Days in the past to load
  const [daysFuture, setDaysFuture] = useState<number>(30); // Days in the future to load
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [headerHeight, setHeaderHeight] = useState<number>(220);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const startY = useRef<number>(0);
  const PULL_THRESHOLD = 80; // Pixels to pull before refresh triggers
  const MAX_PULL = 120; // Maximum pull distance

  // Save scroll position when navigating away to SeriesDetailPage
  useEffect(() => {
    const handleBeforeUnload = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 0) {
        sessionStorage.setItem('newEpisodesScrollPosition', scrollY.toString());
      }
    };

    // Save scroll position before navigation
    return () => {
      handleBeforeUnload();
    };
  }, []);

  // Restore scroll position when coming back from SeriesDetailPage with back button
  useEffect(() => {
    // Check if we're coming from a detail page via back navigation
    const comingFromDetail = sessionStorage.getItem('comingFromDetail') === 'true';
    const savedPosition = sessionStorage.getItem('newEpisodesScrollPosition');

    if (comingFromDetail && savedPosition !== null) {
      const scrollY = parseInt(savedPosition, 10) || 0;

      // The app uses a scrollable container (.mobile-content) not window scroll
      const scrollContainer = document.querySelector('.mobile-content');

      // Try multiple timeouts to ensure scroll works
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollY;
        }
        // Also try after a delay
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollY;
          }
        }, 100);
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollY;
          }
        }, 300);
      });

      // Clear the flags after restoring
      sessionStorage.removeItem('comingFromDetail');
      sessionStorage.removeItem('newEpisodesScrollPosition');
    }
  }, []);

  // Measure header height dynamically
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

  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Get all episodes within date range
  const allEpisodes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate date range - only load past days if scrolled up
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysPast);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysFuture);

    const episodes: UpcomingEpisode[] = [];

    seriesList.forEach((series) => {
      // Filter by watchlist unless showAllSeries is true
      if (!showAllSeries && !series.watchlist) return;

      // Filter by search query
      if (searchQuery && !series.title?.toLowerCase().includes(searchQuery.toLowerCase())) return;

      // Only check episodes in seasons, not API data (to avoid duplicates)
      if (!series.seasons) return;

      // Check all episodes
      series.seasons.forEach((season, seasonIndex) => {
        if (!season.episodes) return;

        season.episodes.forEach((episode, episodeIndex) => {
          const airDate = episode.air_date;
          if (!airDate) return;

          const episodeDate = new Date(airDate);
          if (isNaN(episodeDate.getTime())) return; // Invalid date

          episodeDate.setHours(0, 0, 0, 0);

          // Check if episode is within our date range
          if (episodeDate >= startDate && episodeDate <= endDate) {
            const daysUntil = Math.floor(
              (episodeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            episodes.push({
              seriesId: series.id,
              seriesName: series.title || '',
              seriesPoster:
                typeof series.poster === 'string'
                  ? series.poster
                  : (series.poster as any)?.poster || '',
              seriesNmr: series.nmr,
              seasonIndex,
              episodeIndex,
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              episodeNumber: episodeIndex + 1,
              seasonNumber: (season.seasonNumber ?? seasonIndex) + 1,
              airDate: episodeDate,
              daysUntil,
              watched: !!episode.watched,
            });
          }
        });
      });
    });

    // Sort by air date
    episodes.sort((a, b) => a.airDate.getTime() - b.airDate.getTime());

    return episodes;
  }, [seriesList, searchQuery, showAllSeries, daysPast, daysFuture]);

  // Group episodes by date and then by series
  const groupedEpisodes = useMemo(() => {
    const groups: { [key: string]: { [seriesId: number]: UpcomingEpisode[] } } = {};

    allEpisodes.forEach((episode) => {
      const dateKey = episode.airDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = {};
      }

      if (!groups[dateKey][episode.seriesId]) {
        groups[dateKey][episode.seriesId] = [];
      }

      groups[dateKey][episode.seriesId].push(episode);
    });

    return groups;
  }, [allEpisodes]);

  // Track if we're loading future
  const [loadingFuture, setLoadingFuture] = useState<boolean>(false);

  // Handle pull to refresh for past episodes
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!scrollableDiv) return;

    // Only start pull if exactly at top of scroll
    if (scrollableDiv.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
      if (!scrollableDiv || scrollableDiv.scrollTop > 0) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const rawDistance = currentY - startY.current;

      // Only allow downward pull (positive distance) and minimum pull distance
      if (rawDistance <= 5) {
        setPullDistance(0);
        return;
      }

      // Apply resistance for more natural feel
      let distance = rawDistance - 5; // Subtract minimum threshold
      if (distance > PULL_THRESHOLD) {
        // Apply smoother resistance after threshold
        const overPull = distance - PULL_THRESHOLD;
        distance = PULL_THRESHOLD + Math.pow(overPull, 0.6) * 0.4;
      } else {
        // Linear scaling before threshold for better responsiveness
        distance = distance * 0.8;
      }

      distance = Math.max(0, Math.min(MAX_PULL, distance));

      if (distance > 0) {
        e.preventDefault(); // Prevent scroll while pulling
        setPullDistance(distance);
      }
    },
    [isPulling, isRefreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isPulling || isRefreshing) return;

    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && daysPast < 365) {
      // Trigger refresh
      setIsRefreshing(true);

      // Animate to loading position
      setPullDistance(60);

      // Load more past episodes
      setTimeout(() => {
        const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;

        // Store first visible element
        const beforeElements = Array.from(document.querySelectorAll('[data-date]'));
        const firstVisibleElement = beforeElements.find((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top >= headerHeight;
        });
        const firstVisibleTop = firstVisibleElement?.getBoundingClientRect().top || headerHeight;

        setDaysPast((prev) => {
          const newDays = Math.min(prev + 7, 365); // Load 1 week at a time

          // After state update, restore scroll position
          requestAnimationFrame(() => {
            if (firstVisibleElement && scrollableDiv) {
              const newTop = firstVisibleElement.getBoundingClientRect().top;
              const diff = newTop - firstVisibleTop;
              scrollableDiv.scrollTop += diff;
            }

            // Auto-scroll to the top to show the newly loaded past episodes
            setTimeout(() => {
              if (scrollableDiv) {
                scrollableDiv.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              }
            }, 100);

            setTimeout(() => {
              setIsRefreshing(false);
              setPullDistance(0);
            }, 400);
          });

          return newDays;
        });
      }, 600);
    } else {
      // Not enough pull, animate back
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, pullDistance, daysPast]);

  // Handle scroll for future episodes only
  const handleScroll = useCallback(() => {
    if (loadingFuture) return;

    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!scrollableDiv) return;

    const scrollTop = scrollableDiv.scrollTop;
    const scrollHeight = scrollableDiv.scrollHeight;
    const clientHeight = scrollableDiv.clientHeight;

    // Show/hide scroll to today button
    setShowScrollButton(scrollTop > 200);

    // Reset pull state if scrolled away from top
    if (scrollTop > 10 && isPulling) {
      setIsPulling(false);
      setPullDistance(0);
    }

    // Load more future episodes when near bottom
    if (scrollHeight - scrollTop - clientHeight < 500 && daysFuture < 365 && !loadingFuture) {
      setLoadingFuture(true);
      setTimeout(() => {
        setDaysFuture((prev) => Math.min(prev + 30, 365));
        setLoadingFuture(false);
      }, 100);
    }
  }, [loadingFuture, daysFuture, isPulling]);

  // Attach scroll and touch listeners
  useEffect(() => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', handleScroll);
      scrollableDiv.addEventListener('touchstart', handleTouchStart as any);
      scrollableDiv.addEventListener('touchmove', handleTouchMove as any, { passive: false });
      scrollableDiv.addEventListener('touchend', handleTouchEnd as any);

      return () => {
        scrollableDiv.removeEventListener('scroll', handleScroll);
        scrollableDiv.removeEventListener('touchstart', handleTouchStart as any);
        scrollableDiv.removeEventListener('touchmove', handleTouchMove as any);
        scrollableDiv.removeEventListener('touchend', handleTouchEnd as any);
      };
    }
  }, [handleScroll, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Mark episode as watched
  const handleMarkWatched = async (episode: UpcomingEpisode) => {
    if (!user) return;

    const key = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

    try {
      const ref = firebase
        .database()
        .ref(
          `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`
        );
      await ref.set(true);

      // Update watchCount
      const watchCountRef = firebase
        .database()
        .ref(
          `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
        );
      const snapshot = await watchCountRef.once('value');
      const currentCount = snapshot.val() || 0;
      await watchCountRef.set(currentCount + 1);

      // Update firstWatchedAt if this is the first time
      if (currentCount === 0) {
        const firstWatchedRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`
          );
        await firstWatchedRef.set(new Date().toISOString());

        // Pet XP geben mit Genre-Bonus (nur beim ersten Schauen)
        const series = seriesList.find((s) => s.id === episode.seriesId);
        const seriesGenre = series?.genre?.genres?.[0] || 'Drama'; // Fallback Genre
        await petService.watchedSeriesWithGenre(user.uid, seriesGenre);
      }

      setMarkedWatched((prev) => new Set([...prev, key]));
    } catch (error) {}
  };

  // Check if episode has aired
  const hasEpisodeAired = (episode: UpcomingEpisode) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return episode.airDate <= today;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  // Scroll to today
  const scrollToToday = () => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!scrollableDiv) return;

    // If we haven't loaded past episodes yet, we're already at today (top)
    if (daysPast === 0) {
      scrollableDiv.scrollTop = 0;
    } else if (todayRef.current) {
      // Calculate the position relative to the scrollable container
      const containerRect = scrollableDiv.getBoundingClientRect();
      const todayRect = todayRef.current.getBoundingClientRect();
      const scrollPosition = scrollableDiv.scrollTop + todayRect.top - containerRect.top;

      scrollableDiv.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  };

  // Handle episode swipe to complete
  const handleEpisodeComplete = async (
    episode: UpcomingEpisode,
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    // Don't allow marking future episodes as watched
    if (!hasEpisodeAired(episode)) return;

    const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched in Firebase
    if (user) {
      try {
        const ref = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`
          );
        await ref.set(true);

        // Also update watchCount if needed
        const watchCountRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
          );
        const snapshot = await watchCountRef.once('value');
        const currentCount = snapshot.val() || 0;
        await watchCountRef.set(currentCount + 1);

        // Update firstWatchedAt if this is the first time
        if (currentCount === 0) {
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`
            );
          await firstWatchedRef.set(new Date().toISOString());

          // Pet XP geben mit Genre-Bonus (nur beim ersten Schauen)
          const series = seriesList.find((s) => s.id === episode.seriesId);
          const seriesGenre = series?.genre?.genres?.[0] || 'Drama'; // Fallback Genre
          await petService.watchedSeriesWithGenre(user.uid, seriesGenre);
        }
      } catch (error) {}
    }

    // After animation, hide the episode
    setTimeout(() => {
      setHiddenEpisodes((prev) => new Set(prev).add(episodeKey));
      setCompletingEpisodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);
  };

  const isEpisodeWatched = (episode: UpcomingEpisode) => {
    const key = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
    return episode.watched || markedWatched.has(key);
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
  const getRelativeDateLabel = (episode: UpcomingEpisode) => {
    if (episode.daysUntil === 0) return 'Heute';
    if (episode.daysUntil === 1) return 'Morgen';
    if (episode.daysUntil === -1) return 'Gestern';
    if (episode.daysUntil < -1) return `Vor ${Math.abs(episode.daysUntil)} Tagen`;
    if (episode.daysUntil > 1) return `In ${episode.daysUntil} Tagen`;
    return '';
  };

  return (
    <div
      ref={scrollContainerRef}
      style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Smooth Pull to refresh indicator */}
      {pullDistance > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: pullDistance > 10 ? 1 : 0,
            scale: pullDistance > 10 ? 1 : 0.8,
          }}
          transition={{ duration: 0 }}
          style={{
            position: 'fixed',
            top: headerHeight + 20,
            left: '50vw',
            transform: 'translateX(-50%)',
            background: `${currentTheme.background}F0`,
            border: `1px solid ${currentTheme.primary}4D`,
            borderRadius: '12px',
            padding: '8px 16px',
            color: currentTheme.primary,
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 25,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {isRefreshing
            ? '⟳ Lade 7 weitere Tage...'
            : pullDistance >= PULL_THRESHOLD
              ? '↓ Loslassen für alte Episoden'
              : `↓ ${Math.round((pullDistance / PULL_THRESHOLD) * 100)}%`}
        </motion.div>
      )}

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
        {/* Subtle gradient overlay */}
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
              Episoden Kalender
            </h1>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: '4px 0 0 0',
              }}
            >
              {allEpisodes.length} Episoden
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            marginBottom: '16px',
            position: 'relative',
          }}
        >
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

        {/* Filter Toggle */}
        <HorizontalScrollContainer
          gap={12}
          style={{
            paddingBottom: '8px',
            position: 'relative',
          }}
        >
          <motion.div
            onClick={() => setShowAllSeries(!showAllSeries)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: showAllSeries
                ? `linear-gradient(135deg, ${currentTheme.primary}2D 0%, ${currentTheme.primary}1A 100%)`
                : `linear-gradient(135deg, ${currentTheme.status.success}2D 0%, ${currentTheme.status.success}1A 100%)`,
              border: showAllSeries
                ? `1px solid ${currentTheme.primary}4D`
                : `1px solid ${currentTheme.status.success}4D`,
              borderRadius: '12px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {showAllSeries ? (
              <>
                <Visibility style={{ fontSize: '16px' }} /> Alle Serien
              </>
            ) : (
              <>
                <VisibilityOff style={{ fontSize: '16px' }} /> Nur Watchlist
              </>
            )}
          </motion.div>

          {/* Scroll to Today Button */}
          <motion.div
            onClick={scrollToToday}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}2D 0%, ${currentTheme.primary}1A 100%)`,
              border: `1px solid ${currentTheme.primary}4D`,
              borderRadius: '12px',
              color: currentTheme.primary,
              cursor: 'pointer',
              padding: '8px 12px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              whiteSpace: 'nowrap',
            }}
          >
            <Today style={{ fontSize: '16px' }} />
            Heute
          </motion.div>
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
        {/* Episodes List with pull effect */}
        <motion.div
          style={{
            padding: '20px',
            position: 'relative',
            zIndex: 1,
          }}
          animate={{
            y: isPulling || isRefreshing ? pullDistance * 0.9 : 0,
          }}
          transition={{
            y: isPulling ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40 },
          }}
        >
          {Object.keys(groupedEpisodes).length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <NewReleases style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
              <h3>Keine Episoden</h3>
              <p>Es gibt aktuell keine Episoden {showAllSeries ? '' : 'in deiner Watchlist'}</p>
            </div>
          ) : (
            Object.entries(groupedEpisodes).map(([date, seriesGroups]) => {
              const dateObj = new Date(
                allEpisodes.find(
                  (ep) =>
                    ep.airDate.toLocaleDateString('de-DE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }) === date
                )?.airDate || new Date()
              );

              const isPast = dateObj < new Date() && !isToday(dateObj);
              const isTodayDate = isToday(dateObj);

              return (
                <motion.div
                  key={date}
                  ref={isTodayDate ? todayRef : undefined}
                  data-date={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isPast ? 0.7 : 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    marginBottom: '28px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      padding: '8px 12px',
                      background: isTodayDate
                        ? `linear-gradient(135deg, ${currentTheme.primary}2D 0%, ${currentTheme.primary}1A 100%)`
                        : isPast
                          ? 'rgba(255, 255, 255, 0.01)'
                          : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '12px',
                      border: isTodayDate
                        ? `2px solid ${currentTheme.primary}4D`
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      backdropFilter: isTodayDate ? 'blur(10px)' : 'none',
                      WebkitBackdropFilter: isTodayDate ? 'blur(10px)' : 'none',
                    }}
                  >
                    <CalendarToday
                      style={{
                        fontSize: '18px',
                        color: isTodayDate
                          ? currentTheme.primary
                          : isPast
                            ? 'rgba(255, 255, 255, 0.4)'
                            : currentTheme.primary,
                      }}
                    />
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        margin: 0,
                        color: isTodayDate
                          ? currentTheme.primary
                          : isPast
                            ? 'rgba(255, 255, 255, 0.6)'
                            : 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      {isTodayDate ? 'Heute' : date}
                    </h3>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '13px',
                        color: isPast ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {Object.values(seriesGroups).flat().length} Episode
                      {Object.values(seriesGroups).flat().length !== 1 ? 'n' : ''}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {Object.entries(seriesGroups).map(([seriesId, episodes]) => {
                        const firstEpisode = episodes[0];
                        const isExpanded = isSeriesExpanded(date, Number(seriesId));
                        const allWatched = episodes.every((ep) => isEpisodeWatched(ep));

                        // If only one episode, show it directly without accordion
                        if (episodes.length === 1) {
                          const episode = episodes[0];
                          const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                          const watched = isEpisodeWatched(episode);
                          const isCompleting = completingEpisodes.has(episodeKey);
                          const isSwiping = swipingEpisodes.has(episodeKey);
                          const isHidden = hiddenEpisodes.has(episodeKey);
                          const hasAired = hasEpisodeAired(episode);

                          if (isHidden) return null;

                          return (
                            <motion.div
                              key={episodeKey}
                              data-block-swipe
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{
                                opacity: isCompleting ? 0.5 : 1,
                                y: 0,
                                scale: isCompleting ? 0.95 : 1,
                              }}
                              exit={{
                                opacity: 0,
                                x: swipeDirections[episodeKey] === 'left' ? -300 : 300,
                                transition: { duration: 0.3 },
                              }}
                              style={{
                                position: 'relative',
                              }}
                            >
                              {/* Swipe overlay for episode - only enabled for aired episodes */}
                              <motion.div
                                drag={hasAired && !watched ? 'x' : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                dragSnapToOrigin={true}
                                onDragStart={() => {
                                  if (hasAired && !watched) {
                                    setSwipingEpisodes((prev) => new Set(prev).add(episodeKey));
                                  }
                                }}
                                onDrag={(_event, info: PanInfo) => {
                                  if (hasAired && !watched) {
                                    setDragOffsets((prev) => ({
                                      ...prev,
                                      [episodeKey]: info.offset.x,
                                    }));
                                  }
                                }}
                                onDragEnd={(event, info: PanInfo) => {
                                  event.stopPropagation();
                                  setSwipingEpisodes((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(episodeKey);
                                    return newSet;
                                  });
                                  setDragOffsets((prev) => {
                                    const newOffsets = { ...prev };
                                    delete newOffsets[episodeKey];
                                    return newOffsets;
                                  });

                                  if (
                                    hasAired &&
                                    Math.abs(info.offset.x) > 100 &&
                                    Math.abs(info.velocity.x) > 50 &&
                                    !watched
                                  ) {
                                    const direction = info.offset.x > 0 ? 'right' : 'left';
                                    handleEpisodeComplete(episode, direction);
                                  }
                                }}
                                whileDrag={{ scale: 1.02 }}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: '72px', // Start after the poster
                                  right: 0,
                                  bottom: 0,
                                  zIndex: 1,
                                }}
                              />

                              <div
                                style={{
                                  display: 'flex',
                                  gap: '10px',
                                  padding: '10px',
                                  background: !hasAired
                                    ? isPast
                                      ? 'rgba(255, 255, 255, 0.01)'
                                      : 'rgba(255, 255, 255, 0.02)'
                                    : isCompleting
                                      ? `linear-gradient(90deg, ${currentTheme.status.success}33 0%, ${currentTheme.status.success}0D 100%)`
                                      : watched
                                        ? `${currentTheme.status.success}1A`
                                        : `rgba(76, 209, 55, ${Math.min(
                                            (Math.abs(dragOffsets[episodeKey] || 0) / 100) * 0.15,
                                            0.15
                                          )})`,
                                  borderRadius: '12px',
                                  border: `1px solid ${
                                    !hasAired
                                      ? 'rgba(255, 255, 255, 0.05)'
                                      : isCompleting
                                        ? `${currentTheme.status.success}66`
                                        : watched
                                          ? `${currentTheme.status.success}33`
                                          : `rgba(76, 209, 55, ${
                                              0.05 +
                                              Math.min(
                                                (Math.abs(dragOffsets[episodeKey] || 0) / 100) *
                                                  0.25,
                                                0.25
                                              )
                                            })`
                                  }`,
                                  transition: 'all 0.3s ease',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  opacity: isPast && !hasAired ? 0.5 : 1,
                                }}
                              >
                                {/* Swipe Indicator Background */}
                                <motion.div
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: `linear-gradient(90deg, transparent, ${currentTheme.status.success}33)`,
                                    opacity: 0,
                                  }}
                                  animate={{
                                    opacity: isSwiping ? 1 : 0,
                                  }}
                                />
                                <img
                                  src={getImageUrl(episode.seriesPoster)}
                                  alt={episode.seriesName}
                                  onClick={() => {
                                    // Save current scroll position before navigating
                                    // The app uses a scrollable container (.mobile-content) not window scroll
                                    const scrollContainer =
                                      document.querySelector('.mobile-content');
                                    const scrollY = scrollContainer ? scrollContainer.scrollTop : 0;
                                    // Always save position, even if it's 0
                                    sessionStorage.setItem(
                                      'newEpisodesScrollPosition',
                                      scrollY.toString()
                                    );
                                    sessionStorage.setItem('comingFromDetail', 'false'); // Will be set to true by BackButton
                                    navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}`);
                                  }}
                                  style={{
                                    width: '48px',
                                    height: '72px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    zIndex: 2,
                                    opacity: isPast ? 0.8 : 1,
                                  }}
                                />

                                <div
                                  style={{
                                    flex: 1,
                                    pointerEvents: 'none',
                                    position: 'relative',
                                    zIndex: 2,
                                  }}
                                >
                                  <h4
                                    style={{
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      margin: '0 0 4px 0',
                                      color: !hasAired
                                        ? isPast
                                          ? 'rgba(255, 255, 255, 0.4)'
                                          : 'rgba(255, 255, 255, 0.5)'
                                        : watched
                                          ? currentTheme.status.success
                                          : isPast
                                            ? 'rgba(255, 255, 255, 0.8)'
                                            : 'white',
                                    }}
                                  >
                                    {episode.seriesName}
                                  </h4>

                                  <p
                                    style={{
                                      fontSize: '13px',
                                      margin: '0 0 4px 0',
                                      color:
                                        !hasAired || isPast
                                          ? 'rgba(255, 255, 255, 0.4)'
                                          : 'rgba(255, 255, 255, 0.6)',
                                    }}
                                  >
                                    S{episode.seasonNumber} E{episode.episodeNumber} •{' '}
                                    {episode.episodeName}
                                  </p>

                                  <p
                                    style={{
                                      fontSize: '12px',
                                      margin: 0,
                                      color: isPast
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : 'rgba(255, 255, 255, 0.4)',
                                    }}
                                  >
                                    {getRelativeDateLabel(episode)}
                                  </p>
                                </div>

                                <AnimatePresence mode="wait">
                                  {!hasAired ? (
                                    <Timer
                                      style={{
                                        fontSize: '20px',
                                        color: isPast
                                          ? 'rgba(255, 255, 255, 0.2)'
                                          : 'rgba(255, 255, 255, 0.3)',
                                      }}
                                    />
                                  ) : isCompleting ? (
                                    <motion.div
                                      initial={{ scale: 0, rotate: -180 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      exit={{ scale: 0, rotate: 180 }}
                                      style={{
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Check
                                        style={{
                                          fontSize: '24px',
                                          color: currentTheme.status.success,
                                        }}
                                      />
                                    </motion.div>
                                  ) : watched ? (
                                    <CheckCircle
                                      style={{
                                        fontSize: '20px',
                                        color: currentTheme.status.success,
                                        opacity: isPast ? 0.7 : 1,
                                      }}
                                    />
                                  ) : (
                                    <motion.div
                                      animate={{ x: isSwiping ? 10 : 0 }}
                                      style={{
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <PlayCircle
                                        style={{
                                          fontSize: '20px',
                                          color: isPast
                                            ? 'rgba(255, 255, 255, 0.4)'
                                            : currentTheme.status.success,
                                        }}
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        }

                        // Multiple episodes - show accordion
                        return (
                          <motion.div
                            key={seriesId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              background: allWatched
                                ? `${currentTheme.status.success}0D`
                                : isPast
                                  ? 'rgba(255, 255, 255, 0.01)'
                                  : 'rgba(255, 255, 255, 0.02)',
                              borderRadius: '12px',
                              border: allWatched
                                ? `1px solid ${currentTheme.status.success}33`
                                : '1px solid rgba(255, 255, 255, 0.05)',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              opacity: isPast ? 0.8 : 1,
                            }}
                          >
                            {/* Accordion Header */}
                            <div
                              onClick={() => toggleSeriesExpanded(date, Number(seriesId))}
                              style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '12px',
                                cursor: 'pointer',
                                background: isPast
                                  ? 'rgba(255, 255, 255, 0.01)'
                                  : 'rgba(255, 255, 255, 0.02)',
                              }}
                            >
                              <img
                                src={getImageUrl(firstEpisode.seriesPoster)}
                                alt={firstEpisode.seriesName}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Save current scroll position before navigating
                                  // The app uses a scrollable container (.mobile-content) not window scroll
                                  const scrollContainer = document.querySelector('.mobile-content');
                                  const scrollY = scrollContainer ? scrollContainer.scrollTop : 0;
                                  // Always save position, even if it's 0
                                  sessionStorage.setItem(
                                    'newEpisodesScrollPosition',
                                    scrollY.toString()
                                  );
                                  sessionStorage.setItem('comingFromDetail', 'false'); // Will be set to true by BackButton
                                  navigate(`/series/${firstEpisode.seriesId}`);
                                }}
                                style={{
                                  width: '60px',
                                  height: '90px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  opacity: isPast ? 0.8 : 1,
                                }}
                              />

                              <div style={{ flex: 1 }}>
                                <h4
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    margin: '0 0 4px 0',
                                    color: allWatched
                                      ? currentTheme.status.success
                                      : isPast
                                        ? 'rgba(255, 255, 255, 0.7)'
                                        : 'white',
                                  }}
                                >
                                  {firstEpisode.seriesName}
                                </h4>

                                <p
                                  style={{
                                    fontSize: '13px',
                                    margin: '0 0 4px 0',
                                    color: isPast
                                      ? 'rgba(255, 255, 255, 0.5)'
                                      : 'rgba(255, 255, 255, 0.6)',
                                  }}
                                >
                                  {episodes.length} Episoden
                                </p>

                                <p
                                  style={{
                                    fontSize: '12px',
                                    margin: 0,
                                    color: isPast
                                      ? 'rgba(255, 255, 255, 0.3)'
                                      : 'rgba(255, 255, 255, 0.4)',
                                  }}
                                >
                                  {episodes.filter((ep) => isEpisodeWatched(ep)).length} von{' '}
                                  {episodes.length} gesehen
                                </p>
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: isPast
                                    ? 'rgba(255, 255, 255, 0.4)'
                                    : 'rgba(255, 255, 255, 0.6)',
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
                                {episodes.map((episode, idx) => {
                                  const watched = isEpisodeWatched(episode);
                                  const hasAired = hasEpisodeAired(episode);

                                  return (
                                    <div
                                      key={`${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        background:
                                          idx % 2 === 0
                                            ? 'transparent'
                                            : 'rgba(255, 255, 255, 0.01)',
                                      }}
                                    >
                                      <div style={{ flex: 1 }}>
                                        <p
                                          style={{
                                            fontSize: '13px',
                                            margin: 0,
                                            color: !hasAired
                                              ? isPast
                                                ? 'rgba(255, 255, 255, 0.3)'
                                                : 'rgba(255, 255, 255, 0.5)'
                                              : watched
                                                ? currentTheme.status.success
                                                : isPast
                                                  ? 'rgba(255, 255, 255, 0.6)'
                                                  : 'rgba(255, 255, 255, 0.8)',
                                          }}
                                        >
                                          S{episode.seasonNumber} E{episode.episodeNumber} •{' '}
                                          {episode.episodeName}
                                        </p>
                                      </div>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (hasAired) {
                                            handleMarkWatched(episode);
                                          }
                                        }}
                                        disabled={watched || !hasAired}
                                        style={{
                                          background: !hasAired
                                            ? 'transparent'
                                            : watched
                                              ? 'transparent'
                                              : `${currentTheme.status.success}1A`,
                                          border: !hasAired
                                            ? '1px solid rgba(255, 255, 255, 0.1)'
                                            : watched
                                              ? 'none'
                                              : `1px solid ${currentTheme.status.success}33`,
                                          borderRadius: '8px',
                                          padding: '6px',
                                          color: !hasAired
                                            ? isPast
                                              ? 'rgba(255, 255, 255, 0.2)'
                                              : 'rgba(255, 255, 255, 0.3)'
                                            : watched
                                              ? currentTheme.status.success
                                              : isPast
                                                ? `${currentTheme.status.success}99`
                                                : currentTheme.status.success,
                                          cursor: !hasAired || watched ? 'default' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          opacity: isPast && !hasAired ? 0.5 : 1,
                                        }}
                                      >
                                        {!hasAired ? (
                                          <Timer style={{ fontSize: '18px' }} />
                                        ) : watched ? (
                                          <CheckCircle style={{ fontSize: '18px' }} />
                                        ) : (
                                          <PlayCircle style={{ fontSize: '18px' }} />
                                        )}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}

          {/* Loading indicator at bottom */}
          {loadingFuture && (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                color: currentTheme.text.secondary,
              }}
            >
              ⏳ Lade zukünftige Episoden...
            </div>
          )}
        </motion.div>
      </div>

      {/* Scroll to Today Button - only visible when scrolled */}
      {showScrollButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToToday}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `${currentTheme.background}E6`,
            border: `1px solid ${currentTheme.primary}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            zIndex: 30,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <Today
            style={{
              fontSize: '20px',
              color: currentTheme.primary,
            }}
          />
        </motion.div>
      )}
    </div>
  );
};
