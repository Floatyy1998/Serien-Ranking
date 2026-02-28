import {
  CalendarToday,
  ChatBubbleOutline,
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
import { Tooltip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiscussionCount } from '../../hooks/useDiscussionCounts';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { getImageUrl } from '../../utils/imageUrl';
import {
  HorizontalScrollContainer,
  LoadingSpinner,
  PageHeader,
  PageLayout,
} from '../../components/ui';

const EpisodeDiscussionButton: React.FC<{
  seriesId: number;
  seasonNumber: number;
  episodeNumber: number;
}> = ({ seriesId, seasonNumber, episodeNumber }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const count = useDiscussionCount('episode', seriesId, seasonNumber, episodeNumber);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        navigate(`/episode/${seriesId}/s/${seasonNumber}/e/${episodeNumber}`);
      }}
      style={{
        background: count > 0 ? `${currentTheme.primary}20` : 'transparent',
        border: 'none',
        padding: '6px',
        cursor: 'pointer',
        color: count > 0 ? currentTheme.primary : currentTheme.text.muted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        position: 'relative',
        zIndex: 10,
        borderRadius: '8px',
      }}
    >
      <ChatBubbleOutline style={{ fontSize: '18px' }} />
      {count > 0 && <span style={{ fontSize: '12px', fontWeight: 600 }}>{count}</span>}
    </button>
  );
};

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
  episodeRuntime: number;
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
  const [, setDragOffsets] = useState<{ [key: string]: number }>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [daysPast, setDaysPast] = useState<number>(0);
  const [daysFuture, setDaysFuture] = useState<number>(30);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [headerHeight, setHeaderHeight] = useState<number>(220);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const startY = useRef<number>(0);
  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  useEffect(() => {
    const handleBeforeUnload = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 0) {
        sessionStorage.setItem('newEpisodesScrollPosition', scrollY.toString());
      }
    };
    return () => handleBeforeUnload();
  }, []);

  useEffect(() => {
    const comingFromDetail = sessionStorage.getItem('comingFromDetail') === 'true';
    const savedPosition = sessionStorage.getItem('newEpisodesScrollPosition');

    if (comingFromDetail && savedPosition !== null) {
      const scrollY = parseInt(savedPosition, 10) || 0;
      const scrollContainer = document.querySelector('.mobile-content');

      requestAnimationFrame(() => {
        if (scrollContainer) scrollContainer.scrollTop = scrollY;
        setTimeout(() => {
          if (scrollContainer) scrollContainer.scrollTop = scrollY;
        }, 100);
        setTimeout(() => {
          if (scrollContainer) scrollContainer.scrollTop = scrollY;
        }, 300);
      });

      sessionStorage.removeItem('comingFromDetail');
      sessionStorage.removeItem('newEpisodesScrollPosition');
    }
  }, []);

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

  const allEpisodes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysPast);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysFuture);

    const episodes: UpcomingEpisode[] = [];

    seriesList.forEach((series) => {
      if (!showAllSeries && !series.watchlist) return;
      if (searchQuery && !series.title?.toLowerCase().includes(searchQuery.toLowerCase())) return;
      if (!series.seasons) return;

      series.seasons.forEach((season, seasonIndex) => {
        if (!season.episodes) return;

        season.episodes.forEach((episode, episodeIndex) => {
          const airDate = episode.air_date;
          if (!airDate) return;

          const episodeDate = new Date(airDate);
          if (isNaN(episodeDate.getTime())) return;
          episodeDate.setHours(0, 0, 0, 0);

          if (episodeDate >= startDate && episodeDate <= endDate) {
            const daysUntil = Math.floor(
              (episodeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            episodes.push({
              seriesId: series.id,
              seriesName: series.title || '',
              seriesPoster:
                typeof series.poster === 'string' ? series.poster : series.poster?.poster || '',
              seriesNmr: series.nmr,
              seasonIndex,
              episodeIndex,
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              episodeNumber: episodeIndex + 1,
              seasonNumber: (season.seasonNumber ?? seasonIndex) + 1,
              airDate: episodeDate,
              daysUntil,
              watched: !!episode.watched,
              episodeRuntime: episode.runtime || series.episodeRuntime || 45,
            });
          }
        });
      });
    });

    episodes.sort((a, b) => a.airDate.getTime() - b.airDate.getTime());
    return episodes;
  }, [seriesList, searchQuery, showAllSeries, daysPast, daysFuture]);

  const groupedEpisodes = useMemo(() => {
    const groups: { [key: string]: { [seriesId: number]: UpcomingEpisode[] } } = {};

    allEpisodes.forEach((episode) => {
      const dateKey = episode.airDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      if (!groups[dateKey]) groups[dateKey] = {};
      if (!groups[dateKey][episode.seriesId]) groups[dateKey][episode.seriesId] = [];
      groups[dateKey][episode.seriesId].push(episode);
    });

    return groups;
  }, [allEpisodes]);

  const [loadingFuture, setLoadingFuture] = useState<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!scrollableDiv) return;
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

      if (rawDistance <= 5) {
        setPullDistance(0);
        return;
      }

      let distance = rawDistance - 5;
      if (distance > PULL_THRESHOLD) {
        const overPull = distance - PULL_THRESHOLD;
        distance = PULL_THRESHOLD + Math.pow(overPull, 0.6) * 0.4;
      } else {
        distance = distance * 0.8;
      }

      distance = Math.max(0, Math.min(MAX_PULL, distance));

      if (distance > 0) {
        e.preventDefault();
        setPullDistance(distance);
      }
    },
    [isPulling, isRefreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isPulling || isRefreshing) return;
    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && daysPast < 365) {
      setIsRefreshing(true);
      setPullDistance(60);

      setTimeout(() => {
        const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
        const beforeElements = Array.from(document.querySelectorAll('[data-date]'));
        const firstVisibleElement = beforeElements.find((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top >= headerHeight;
        });
        const firstVisibleTop = firstVisibleElement?.getBoundingClientRect().top || headerHeight;

        setDaysPast((prev) => {
          const newDays = Math.min(prev + 7, 365);

          requestAnimationFrame(() => {
            if (firstVisibleElement && scrollableDiv) {
              const newTop = firstVisibleElement.getBoundingClientRect().top;
              const diff = newTop - firstVisibleTop;
              scrollableDiv.scrollTop += diff;
            }

            setTimeout(() => {
              if (scrollableDiv) scrollableDiv.scrollTo({ top: 0, behavior: 'smooth' });
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
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, pullDistance, daysPast, headerHeight]);

  const handleScroll = useCallback(() => {
    if (loadingFuture) return;

    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!scrollableDiv) return;

    const scrollTop = scrollableDiv.scrollTop;
    const scrollHeight = scrollableDiv.scrollHeight;
    const clientHeight = scrollableDiv.clientHeight;

    setShowScrollButton(scrollTop > 200);

    if (scrollTop > 10 && isPulling) {
      setIsPulling(false);
      setPullDistance(0);
    }

    if (scrollHeight - scrollTop - clientHeight < 500 && daysFuture < 365 && !loadingFuture) {
      setLoadingFuture(true);
      setTimeout(() => {
        setDaysFuture((prev) => Math.min(prev + 30, 365));
        setLoadingFuture(false);
      }, 100);
    }
  }, [loadingFuture, daysFuture, isPulling]);

  useEffect(() => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (scrollableDiv) {
      scrollableDiv.addEventListener('scroll', handleScroll);
      scrollableDiv.addEventListener('touchstart', handleTouchStart as EventListener);
      scrollableDiv.addEventListener('touchmove', handleTouchMove as EventListener, {
        passive: false,
      });
      scrollableDiv.addEventListener('touchend', handleTouchEnd as EventListener);

      return () => {
        scrollableDiv.removeEventListener('scroll', handleScroll);
        scrollableDiv.removeEventListener('touchstart', handleTouchStart as EventListener);
        scrollableDiv.removeEventListener('touchmove', handleTouchMove as EventListener);
        scrollableDiv.removeEventListener('touchend', handleTouchEnd as EventListener);
      };
    }
  }, [handleScroll, handleTouchStart, handleTouchMove, handleTouchEnd]);

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

      const watchCountRef = firebase
        .database()
        .ref(
          `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
        );
      const snapshot = await watchCountRef.once('value');
      const currentCount = snapshot.val() || 0;
      await watchCountRef.set(currentCount + 1);

      // Always update lastWatchedAt
      const episodeBasePath = `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}`;
      await firebase
        .database()
        .ref(`${episodeBasePath}/lastWatchedAt`)
        .set(new Date().toISOString());

      if (currentCount === 0) {
        await firebase
          .database()
          .ref(`${episodeBasePath}/firstWatchedAt`)
          .set(new Date().toISOString());

        const series = seriesList.find((s) => s.id === episode.seriesId);
        await petService.watchedSeriesWithGenreAllPets(user.uid, series?.genre?.genres || []);

        WatchActivityService.logEpisodeWatch(
          user.uid,
          episode.seriesId,
          episode.seriesName,
          episode.seasonNumber,
          episode.episodeNumber,
          episode.episodeRuntime,
          false,
          series?.genre?.genres,
          series?.provider?.provider?.map((p) => p.name)
        );
      }

      setMarkedWatched((prev) => new Set([...prev, key]));
    } catch (error) {
      console.error('Error marking episode watched:', error);
    }
  };

  const hasEpisodeAired = (episode: UpcomingEpisode) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return episode.airDate <= today;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  };

  const scrollToToday = () => {
    const scrollableDiv = document.querySelector('[data-scrollable="episodes"]') as HTMLElement;
    if (!scrollableDiv) return;

    if (daysPast === 0) {
      scrollableDiv.scrollTop = 0;
    } else if (todayRef.current) {
      const containerRect = scrollableDiv.getBoundingClientRect();
      const todayRect = todayRef.current.getBoundingClientRect();
      const scrollPosition = scrollableDiv.scrollTop + todayRect.top - containerRect.top;
      scrollableDiv.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
  };

  const handleEpisodeComplete = async (
    episode: UpcomingEpisode,
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    if (!hasEpisodeAired(episode)) return;

    const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    if (user) {
      try {
        const ref = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`
          );
        await ref.set(true);

        const watchCountRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
          );
        const snapshot = await watchCountRef.once('value');
        const currentCount = snapshot.val() || 0;
        await watchCountRef.set(currentCount + 1);

        if (currentCount === 0) {
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`
            );
          await firstWatchedRef.set(new Date().toISOString());

          const series = seriesList.find((s) => s.id === episode.seriesId);
          await petService.watchedSeriesWithGenreAllPets(user.uid, series?.genre?.genres || []);

          WatchActivityService.logEpisodeWatch(
            user.uid,
            episode.seriesId,
            episode.seriesName,
            episode.seasonNumber,
            episode.episodeNumber,
            episode.episodeRuntime,
            false,
            series?.genre?.genres,
            series?.provider?.provider?.map((p) => p.name)
          );
        }
      } catch (error) {
        console.error('Error completing episode:', error);
      }
    }

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
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const isSeriesExpanded = (date: string, seriesId: number) => {
    return expandedSeries.has(`${date}-${seriesId}`);
  };

  const getRelativeDateLabel = (episode: UpcomingEpisode) => {
    if (episode.daysUntil === 0) return 'Heute';
    if (episode.daysUntil === 1) return 'Morgen';
    if (episode.daysUntil === -1) return 'Gestern';
    if (episode.daysUntil < -1) return `Vor ${Math.abs(episode.daysUntil)} Tagen`;
    if (episode.daysUntil > 1) return `In ${episode.daysUntil} Tagen`;
    return '';
  };

  return (
    <PageLayout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        ref={scrollContainerRef}
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Premium Pull to refresh indicator */}
        <AnimatePresence>
          {pullDistance > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'fixed',
                top: headerHeight + 20,
                left: '50vw',
                transform: 'translateX(-50%)',
                background: `linear-gradient(135deg, ${currentTheme.background.card}f5, ${currentTheme.background.surface}f5)`,
                border: `1px solid ${currentTheme.primary}40`,
                borderRadius: '16px',
                padding: '12px 20px',
                color: currentTheme.primary,
                fontSize: '13px',
                fontWeight: 600,
                zIndex: 25,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 4px 15px ${currentTheme.primary}30`,
              }}
            >
              {isRefreshing
                ? 'Lade 7 weitere Tage...'
                : pullDistance >= PULL_THRESHOLD
                  ? 'Loslassen für alte Episoden'
                  : `${Math.round((pullDistance / PULL_THRESHOLD) * 100)}%`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Fixed Header */}
        <div
          ref={headerRef}
          style={{
            padding: '0',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            background: `${currentTheme.background.default}f0`,
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Premium gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(180deg, ${currentTheme.primary}15 0%, transparent 100%)`,
              pointerEvents: 'none',
            }}
          />

          <PageHeader
            title="Episoden Kalender"
            gradientTo="#8b5cf6"
            icon={
              <CalendarToday
                style={{
                  fontSize: '24px',
                  color: currentTheme.primary,
                  WebkitTextFillColor: currentTheme.primary,
                }}
              />
            }
            subtitle={`${allEpisodes.length} Episoden`}
            sticky={false}
            style={{ paddingTop: 'calc(30px + env(safe-area-inset-top))' }}
          />

          {/* Premium Search Bar */}
          <div style={{ marginBottom: '16px', position: 'relative', padding: '0 20px' }}>
            <Search
              style={{
                position: 'absolute',
                left: '34px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '20px',
                color: currentTheme.text.muted,
              }}
            />
            <input
              type="text"
              placeholder="Nach Serie suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 44px',
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '14px',
                color: currentTheme.text.primary,
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '34px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: currentTheme.background.surfaceHover,
                  border: 'none',
                  color: currentTheme.text.muted,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Löschen
              </button>
            )}
          </div>

          {/* Premium Filter Pills */}
          <HorizontalScrollContainer
            gap={10}
            style={{ paddingBottom: '8px', paddingLeft: '20px', paddingRight: '20px' }}
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAllSeries(!showAllSeries)}
              style={{
                background: showAllSeries
                  ? `linear-gradient(135deg, ${currentTheme.primary}25, ${currentTheme.primary}10)`
                  : `linear-gradient(135deg, ${currentTheme.status.success}25, ${currentTheme.status.success}10)`,
                border: showAllSeries
                  ? `1px solid ${currentTheme.primary}40`
                  : `1px solid ${currentTheme.status.success}40`,
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                cursor: 'pointer',
                color: showAllSeries ? currentTheme.primary : currentTheme.status.success,
              }}
            >
              {showAllSeries ? (
                <>
                  <Visibility style={{ fontSize: '18px' }} /> Alle Serien
                </>
              ) : (
                <>
                  <VisibilityOff style={{ fontSize: '18px' }} /> Nur Watchlist
                </>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={scrollToToday}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                cursor: 'pointer',
                padding: '10px 14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: `0 4px 12px ${currentTheme.primary}40`,
              }}
            >
              <Today style={{ fontSize: '18px' }} />
              Heute
            </motion.button>
          </HorizontalScrollContainer>
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
          <motion.div
            style={{ padding: '20px', position: 'relative', zIndex: 1 }}
            animate={{ y: isPulling || isRefreshing ? pullDistance * 0.9 : 0 }}
            transition={{
              y: isPulling ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40 },
            }}
          >
            {Object.keys(groupedEpisodes).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: currentTheme.background.card,
                  borderRadius: '20px',
                  border: `1px solid ${currentTheme.border.default}`,
                }}
              >
                <NewReleases
                  style={{ fontSize: '56px', marginBottom: '16px', color: currentTheme.text.muted }}
                />
                <h2
                  style={{ color: currentTheme.text.primary, margin: '0 0 8px 0', fontWeight: 700 }}
                >
                  Keine Episoden
                </h2>
                <p style={{ color: currentTheme.text.muted, margin: 0, fontSize: '14px' }}>
                  Es gibt aktuell keine Episoden {showAllSeries ? '' : 'in deiner Watchlist'}
                </p>
              </motion.div>
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
                    style={{ marginBottom: '28px' }}
                  >
                    {/* Premium Date Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '14px',
                        padding: '12px 16px',
                        background: isTodayDate
                          ? `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`
                          : isPast
                            ? currentTheme.background.surface
                            : currentTheme.background.card,
                        borderRadius: '16px',
                        border: isTodayDate
                          ? `2px solid ${currentTheme.primary}50`
                          : `1px solid ${currentTheme.border.default}`,
                        boxShadow: isTodayDate ? `0 4px 15px ${currentTheme.primary}25` : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: isTodayDate
                            ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                            : currentTheme.background.surfaceHover,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CalendarToday
                          style={{
                            fontSize: '18px',
                            color: isTodayDate ? '#fff' : currentTheme.text.muted,
                          }}
                        />
                      </div>
                      <h2
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          margin: 0,
                          color: isTodayDate ? currentTheme.primary : currentTheme.text.primary,
                        }}
                      >
                        {isTodayDate ? 'Heute' : date}
                      </h2>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '12px',
                          color: currentTheme.text.muted,
                          background: currentTheme.background.surface,
                          padding: '4px 10px',
                          borderRadius: '10px',
                          fontWeight: 600,
                        }}
                      >
                        {Object.values(seriesGroups).flat().length} Episode
                        {Object.values(seriesGroups).flat().length !== 1 ? 'n' : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <AnimatePresence mode="popLayout">
                        {Object.entries(seriesGroups).map(([seriesId, episodes]) => {
                          const firstEpisode = episodes[0];
                          const isExpanded = isSeriesExpanded(date, Number(seriesId));
                          const allWatched = episodes.every((ep) => isEpisodeWatched(ep));

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
                                style={{ position: 'relative' }}
                              >
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
                                    left: '72px',
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 1,
                                  }}
                                />

                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '14px',
                                    background: isCompleting
                                      ? `linear-gradient(90deg, ${currentTheme.status.success}30, ${currentTheme.status.success}10)`
                                      : watched
                                        ? `${currentTheme.status.success}15`
                                        : currentTheme.background.card,
                                    borderRadius: '16px',
                                    border: `1px solid ${
                                      isCompleting
                                        ? currentTheme.status.success
                                        : watched
                                          ? `${currentTheme.status.success}40`
                                          : currentTheme.border.default
                                    }`,
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    opacity: isPast && !hasAired ? 0.5 : 1,
                                  }}
                                >
                                  <motion.div
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      background: `linear-gradient(90deg, transparent, ${currentTheme.status.success}30)`,
                                      opacity: 0,
                                    }}
                                    animate={{ opacity: isSwiping ? 1 : 0 }}
                                  />

                                  <img
                                    src={getImageUrl(episode.seriesPoster)}
                                    alt={episode.seriesName}
                                    onClick={() => {
                                      const scrollContainer =
                                        document.querySelector('.mobile-content');
                                      const scrollY = scrollContainer
                                        ? scrollContainer.scrollTop
                                        : 0;
                                      sessionStorage.setItem(
                                        'newEpisodesScrollPosition',
                                        scrollY.toString()
                                      );
                                      sessionStorage.setItem('comingFromDetail', 'false');
                                      navigate(
                                        `/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}`
                                      );
                                    }}
                                    style={{
                                      width: '52px',
                                      height: '78px',
                                      objectFit: 'cover',
                                      borderRadius: '10px',
                                      cursor: 'pointer',
                                      position: 'relative',
                                      zIndex: 2,
                                      boxShadow: `0 4px 12px ${currentTheme.background.default}60`,
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
                                    <h3
                                      style={{
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        margin: '0 0 6px 0',
                                        color: watched
                                          ? currentTheme.status.success
                                          : currentTheme.text.primary,
                                      }}
                                    >
                                      {episode.seriesName}
                                    </h3>
                                    <p
                                      style={{
                                        fontSize: '13px',
                                        margin: '0 0 4px 0',
                                        color: currentTheme.text.secondary,
                                      }}
                                    >
                                      S{episode.seasonNumber} E{episode.episodeNumber} •{' '}
                                      {episode.episodeName}
                                    </p>
                                    <p
                                      style={{
                                        fontSize: '12px',
                                        margin: 0,
                                        color: currentTheme.text.muted,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {getRelativeDateLabel(episode)}
                                    </p>
                                  </div>

                                  <AnimatePresence mode="wait">
                                    {!hasAired ? (
                                      <Tooltip title="Noch nicht ausgestrahlt" arrow>
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px',
                                            background: currentTheme.background.surfaceHover,
                                            borderRadius: '10px',
                                          }}
                                        >
                                          <Timer
                                            style={{
                                              fontSize: '20px',
                                              color: currentTheme.text.muted,
                                            }}
                                          />
                                        </div>
                                      </Tooltip>
                                    ) : isCompleting ? (
                                      <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        style={{
                                          padding: '8px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          background: `${currentTheme.status.success}20`,
                                          borderRadius: '10px',
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
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                        }}
                                      >
                                        <EpisodeDiscussionButton
                                          seriesId={episode.seriesId}
                                          seasonNumber={episode.seasonNumber}
                                          episodeNumber={episode.episodeNumber}
                                        />
                                        <Tooltip title="Bereits gesehen" arrow>
                                          <div
                                            style={{
                                              padding: '8px',
                                              background: `${currentTheme.status.success}20`,
                                              borderRadius: '10px',
                                            }}
                                          >
                                            <CheckCircle
                                              style={{
                                                fontSize: '20px',
                                                color: currentTheme.status.success,
                                              }}
                                            />
                                          </div>
                                        </Tooltip>
                                      </div>
                                    ) : (
                                      <motion.div
                                        animate={{ x: isSwiping ? 10 : 0 }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                        }}
                                      >
                                        <EpisodeDiscussionButton
                                          seriesId={episode.seriesId}
                                          seasonNumber={episode.seasonNumber}
                                          episodeNumber={episode.episodeNumber}
                                        />
                                        <Tooltip title="Als gesehen markieren" arrow>
                                          <div
                                            style={{
                                              padding: '8px',
                                              background: `${currentTheme.status.success}20`,
                                              borderRadius: '10px',
                                            }}
                                          >
                                            <PlayCircle
                                              style={{
                                                fontSize: '20px',
                                                color: currentTheme.status.success,
                                              }}
                                            />
                                          </div>
                                        </Tooltip>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            );
                          }

                          return (
                            <motion.div
                              key={seriesId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              style={{
                                background: allWatched
                                  ? `${currentTheme.status.success}10`
                                  : currentTheme.background.card,
                                borderRadius: '16px',
                                border: allWatched
                                  ? `1px solid ${currentTheme.status.success}40`
                                  : `1px solid ${currentTheme.border.default}`,
                                overflow: 'hidden',
                                opacity: isPast ? 0.8 : 1,
                              }}
                            >
                              <div
                                onClick={() => toggleSeriesExpanded(date, Number(seriesId))}
                                style={{
                                  display: 'flex',
                                  gap: '12px',
                                  padding: '14px',
                                  cursor: 'pointer',
                                  background: currentTheme.background.surface,
                                }}
                              >
                                <img
                                  src={getImageUrl(firstEpisode.seriesPoster)}
                                  alt={firstEpisode.seriesName}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const scrollContainer =
                                      document.querySelector('.mobile-content');
                                    const scrollY = scrollContainer ? scrollContainer.scrollTop : 0;
                                    sessionStorage.setItem(
                                      'newEpisodesScrollPosition',
                                      scrollY.toString()
                                    );
                                    sessionStorage.setItem('comingFromDetail', 'false');
                                    navigate(`/series/${firstEpisode.seriesId}`);
                                  }}
                                  style={{
                                    width: '60px',
                                    height: '90px',
                                    objectFit: 'cover',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 12px ${currentTheme.background.default}60`,
                                  }}
                                />

                                <div style={{ flex: 1 }}>
                                  <h3
                                    style={{
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      margin: '0 0 6px 0',
                                      color: allWatched
                                        ? currentTheme.status.success
                                        : currentTheme.text.primary,
                                    }}
                                  >
                                    {firstEpisode.seriesName}
                                  </h3>
                                  <p
                                    style={{
                                      fontSize: '13px',
                                      margin: '0 0 4px 0',
                                      color: currentTheme.text.secondary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {episodes.length} Episoden
                                  </p>
                                  <p
                                    style={{
                                      fontSize: '12px',
                                      margin: 0,
                                      color: currentTheme.text.muted,
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
                                    style={{
                                      borderTop: `1px solid ${currentTheme.border.default}`,
                                      padding: '10px',
                                      overflow: 'hidden',
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
                                            padding: '10px',
                                            borderRadius: '10px',
                                            background:
                                              idx % 2 === 0
                                                ? 'transparent'
                                                : currentTheme.background.surfaceHover,
                                          }}
                                        >
                                          <div style={{ flex: 1 }}>
                                            <p
                                              style={{
                                                fontSize: '13px',
                                                margin: 0,
                                                color: watched
                                                  ? currentTheme.status.success
                                                  : currentTheme.text.primary,
                                                fontWeight: 500,
                                              }}
                                            >
                                              S{episode.seasonNumber} E{episode.episodeNumber} •{' '}
                                              {episode.episodeName}
                                            </p>
                                          </div>

                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                            }}
                                          >
                                            {hasAired && (
                                              <EpisodeDiscussionButton
                                                seriesId={episode.seriesId}
                                                seasonNumber={episode.seasonNumber}
                                                episodeNumber={episode.episodeNumber}
                                              />
                                            )}
                                            <motion.button
                                              whileTap={{ scale: 0.9 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (hasAired) handleMarkWatched(episode);
                                              }}
                                              disabled={watched || !hasAired}
                                              style={{
                                                background: !hasAired
                                                  ? currentTheme.background.surfaceHover
                                                  : watched
                                                    ? `${currentTheme.status.success}20`
                                                    : `${currentTheme.status.success}15`,
                                                border: `1px solid ${
                                                  !hasAired
                                                    ? currentTheme.border.default
                                                    : watched
                                                      ? currentTheme.status.success
                                                      : `${currentTheme.status.success}40`
                                                }`,
                                                borderRadius: '10px',
                                                padding: '8px',
                                                color: !hasAired
                                                  ? currentTheme.text.muted
                                                  : watched
                                                    ? currentTheme.status.success
                                                    : currentTheme.status.success,
                                                cursor:
                                                  !hasAired || watched ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              {!hasAired ? (
                                                <Timer style={{ fontSize: '18px' }} />
                                              ) : watched ? (
                                                <CheckCircle style={{ fontSize: '18px' }} />
                                              ) : (
                                                <PlayCircle style={{ fontSize: '18px' }} />
                                              )}
                                            </motion.button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })
            )}

            {loadingFuture && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '24px',
                  color: currentTheme.text.muted,
                }}
              >
                <LoadingSpinner size={24} borderWidth={2} text="Lade zukünftige Episoden..." />
              </motion.div>
            )}

            <div style={{ height: '100px' }} />
          </motion.div>
        </div>

        {/* Premium Scroll to Today Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToToday}
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 6px 20px ${currentTheme.primary}50`,
                zIndex: 30,
              }}
            >
              <Today style={{ fontSize: '24px', color: '#fff' }} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
};
