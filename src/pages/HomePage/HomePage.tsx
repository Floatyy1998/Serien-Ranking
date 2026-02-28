import {
  AutoAwesome,
  CalendarMonth,
  CalendarToday,
  Cancel,
  ChatBubbleOutline,
  Check,
  CheckCircle,
  DoneAll,
  EmojiEvents,
  Favorite,
  Flag,
  Group,
  History,
  LocalFireDepartment,
  Movie as MovieIcon,
  NewReleases,
  Notifications,
  PersonAdd,
  PlayCircle,
  Search,
  Star,
  TrendingUp,
  Repeat,
  Tv,
} from '@mui/icons-material';
import { Badge, Chip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { cloneElement, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { EpisodeDiscussionButton } from '../../components/Discussion';
import { BottomSheet, GradientText, HorizontalScrollContainer, SectionHeader } from '../../components/ui';
import { CarouselNotification } from '../../components/ui/CarouselNotification';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useEpisodeSwipeHandlers } from '../../hooks/useEpisodeSwipeHandlers';
import { useRewatchEpisodes } from '../../hooks/useRewatchEpisodes';
import { useSeriesCountdowns } from '../../hooks/useSeriesCountdowns';
import { useTMDBTrending } from '../../hooks/useTMDBTrending';
import { useTopRated } from '../../hooks/useTopRated';
import { useWebWorkerStatsOptimized } from '../../hooks/useWebWorkerStatsOptimized';
import type { Series } from '../../types/Series';
import { getGreeting } from '../../utils/greetings';
import { calculateWatchingPace, formatPaceLine } from '../../lib/paceCalculation';
import { WatchActivityService } from '../../services/watchActivityService';
import { CatchUpCard } from './CatchUpCard';
import { HiddenSeriesCard } from './HiddenSeriesCard';
import { LiveClock } from './LiveClock';
import { StatsGrid } from './StatsGrid';
import { TasteMatchCard } from './TasteMatchCard';
import { WatchJourneyCard } from './WatchJourneyCard';
import { WatchStreakCard } from './WatchStreakCard';
import { WrappedNotification } from './WrappedNotification';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useAuth();

  // Handle case where auth context might be null
  if (!authContext) {
    return <div>Loading...</div>;
  }

  const { user } = authContext;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return <div>Redirecting to login...</div>;
  }
  const {
    unreadActivitiesCount,
    friendActivities,
    friendRequests,
    unreadRequestsCount,
    markActivitiesAsRead,
    markRequestsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
  } = useOptimizedFriends();
  const {
    notifications,
    unreadCount: notificationUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const {
    seriesWithNewSeasons,
    inactiveSeries,
    inactiveRewatches,
    completedSeries,
    clearNewSeasons,
    clearInactiveSeries,
    clearInactiveRewatches,
    clearCompletedSeries,
  } = useSeriesList();
  const { currentTheme } = useTheme();
  const { countdowns } = useSeriesCountdowns();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Episode swipe/completion state & handlers
  const {
    continueWatching,
    swipingContinueEpisodes,
    setSwipingContinueEpisodes,
    dragOffsetsContinue,
    setDragOffsetsContinue,
    completingContinueEpisodes,
    hiddenContinueEpisodes,
    handleContinueEpisodeComplete,
    todayEpisodes,
    swipingEpisodes,
    setSwipingEpisodes,
    dragOffsetsEpisodes,
    setDragOffsetsEpisodes,
    completingEpisodes,
    hiddenEpisodes,
    handleEpisodeComplete,
    swipeDirections,
  } = useEpisodeSwipeHandlers();
  const rewatchEpisodes = useRewatchEpisodes();
  const [completingRewatches, setCompletingRewatches] = useState<Set<string>>(new Set());
  const [hiddenRewatches, setHiddenRewatches] = useState<Set<string>>(new Set());
  const [swipingRewatches, setSwipingRewatches] = useState<Set<string>>(new Set());
  const [dragOffsetsRewatches, setDragOffsetsRewatches] = useState<Record<string, number>>({});
  const [rewatchSwipeDirections, setRewatchSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});
  const [greetingInfo, setGreetingInfo] = useState<string | null>(null);
  const [posterNav, setPosterNav] = useState<{
    open: boolean;
    seriesId: number;
    title: string;
    episodePath: string;
  }>({ open: false, seriesId: 0, title: '', episodePath: '' });
  const [showNotifications, setShowNotifications] = useState(false);

  // Homepage section configuration
  const DEFAULT_SECTION_ORDER = ['countdown', 'continue-watching', 'rewatches', 'today-episodes', 'trending', 'top-rated', 'for-you', 'stats'];
  const DEFAULT_FOR_YOU_ORDER = ['watch-streak', 'taste-match', 'watch-journey', 'catch-up', 'hidden-series'];
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_SECTION_ORDER);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [forYouOrder, setForYouOrder] = useState<string[]>(DEFAULT_FOR_YOU_ORDER);
  const [hiddenForYou, setHiddenForYou] = useState<string[]>([]);

  // Load homeConfig from Firebase
  useEffect(() => {
    if (!user) return;
    const ref = firebase.database().ref(`users/${user.uid}/homeConfig`);
    ref.once('value').then((snap) => {
      const data = snap.val();
      if (data?.sectionOrder) {
        const validSections = new Set(DEFAULT_SECTION_ORDER);
        const filtered = (data.sectionOrder as string[]).filter(id => validSections.has(id));
        for (const id of DEFAULT_SECTION_ORDER) {
          if (!filtered.includes(id)) filtered.push(id);
        }
        setSectionOrder(filtered);
      }
      if (data?.hiddenSections) {
        const validSections = new Set(DEFAULT_SECTION_ORDER);
        setHiddenSections((data.hiddenSections as string[]).filter(id => validSections.has(id)));
      }
      if (data?.forYouOrder) setForYouOrder(data.forYouOrder);
      if (data?.hiddenForYou) setHiddenForYou(data.hiddenForYou);
    });
  }, [user]);

  // Feature announcements
  const ANNOUNCEMENTS = [
    {
      id: 'announcement_homepage-layout-2026-02',
      title: 'Neues Feature: Homepage Layout',
      message: 'Du kannst jetzt deine Homepage-Sektionen sortieren und ausblenden! Gehe zu Einstellungen → Homepage Layout um es auszuprobieren.',
      timestamp: new Date('2026-02-28T12:00:00').getTime(),
      navigateTo: '/home-layout',
    },
  ];

  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    } catch { return []; }
  });

  const dismissAnnouncement = (id: string) => {
    const updated = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  // Unified notification list from all sources
  const unifiedNotifications = useMemo(() => {
    const items: {
      id: string;
      kind: 'activity' | 'request' | 'discussion' | 'announcement';
      title: string;
      message: string;
      timestamp: number;
      read: boolean;
      navigateTo?: string;
      icon: 'tv' | 'movie' | 'star' | 'watchlist' | 'person' | 'chat' | 'heart' | 'flag' | 'announcement';
      requestId?: string;
      notificationId?: string;
      fromUsername?: string;
    }[] = [];

    // Feature announcements
    for (const ann of ANNOUNCEMENTS) {
      items.push({
        id: ann.id,
        kind: 'announcement',
        title: ann.title,
        message: ann.message,
        timestamp: ann.timestamp,
        read: dismissedAnnouncements.includes(ann.id),
        navigateTo: ann.navigateTo,
        icon: 'announcement',
      });
    }

    // Friend activities
    for (const act of friendActivities) {
      const isMovie = act.type === 'movie_added' || act.type === 'movie_rated' || act.type === 'rating_updated_movie' || act.itemType === 'movie';
      const tmdbId = act.tmdbId || act.itemId;
      const isRating = act.type === 'rating_updated' || act.type === 'rating_updated_movie' || act.type === 'movie_rated' || act.type === 'series_rated';
      const isWatchlist = act.type === 'series_added_to_watchlist' || act.type === 'movie_added_to_watchlist';

      items.push({
        id: `act_${act.id}`,
        kind: 'activity',
        title: act.userName || 'Freund',
        message: `hat "${act.itemTitle || 'Unbekannt'}" ${isRating ? 'bewertet' : isWatchlist ? 'auf die Watchlist gesetzt' : 'hinzugefügt'}${isRating && act.rating ? ` (${act.rating}/10)` : ''}`,
        timestamp: act.timestamp,
        read: unreadActivitiesCount === 0 || false,
        navigateTo: tmdbId ? (isMovie ? `/movie/${tmdbId}` : `/series/${tmdbId}`) : undefined,
        icon: isRating ? 'star' : isWatchlist ? 'watchlist' : isMovie ? 'movie' : 'tv',
      });
    }

    // Friend requests
    for (const req of friendRequests) {
      items.push({
        id: `req_${req.id}`,
        kind: 'request',
        title: 'Freundschaftsanfrage',
        message: req.fromUsername || 'Unbekannt',
        timestamp: req.timestamp || req.sentAt || Date.now(),
        read: unreadRequestsCount === 0,
        requestId: req.id,
        fromUsername: req.fromUsername,
        icon: 'person',
      });
    }

    // Discussion notifications
    for (const n of notifications) {
      let navigateTo: string | undefined;
      if (n.data?.discussionPath) {
        const path = n.data.discussionPath as string;
        if (path.includes('episode/')) {
          const match = path.match(/episode\/(\d+)_s(\d+)_e(\d+)/);
          if (match) navigateTo = `/episode/${match[1]}/s/${match[2]}/e/${match[3]}`;
        }
        if (!navigateTo) {
          const pathMatch = path.match(/discussions\/(series|movie)\/(\d+)/);
          if (pathMatch) navigateTo = `/${pathMatch[1]}/${pathMatch[2]}`;
        }
        if (!navigateTo && n.data.itemType && n.data.itemId) {
          navigateTo = `/${n.data.itemType}/${n.data.itemId}`;
        }
      }

      items.push({
        id: `notif_${n.id}`,
        kind: 'discussion',
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read,
        navigateTo,
        notificationId: n.id,
        icon: n.type === 'discussion_reply' ? 'chat' : n.type === 'spoiler_flag' ? 'flag' : n.type === 'discussion_like' ? 'heart' : 'chat',
      });
    }

    // Sort by timestamp descending, limit to 30
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, 30);
  }, [friendActivities, friendRequests, notifications, unreadActivitiesCount, unreadRequestsCount, dismissedAnnouncements]);

  const formatNotificationTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'gerade eben';
    if (minutes < 60) return `vor ${minutes} Min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std`;
    const days = Math.floor(hours / 24);
    return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
  };

  const handleMarkAllNotificationsRead = () => {
    markActivitiesAsRead();
    markRequestsAsRead();
    markAllAsRead();
  };

  const getNotificationIcon = (icon: string) => {
    switch (icon) {
      case 'tv': return <Tv style={{ fontSize: '18px', color: currentTheme.primary }} />;
      case 'movie': return <MovieIcon style={{ fontSize: '18px', color: currentTheme.status.error }} />;
      case 'star': return <Star style={{ fontSize: '18px', color: currentTheme.status.warning }} />;
      case 'watchlist': return <PlayCircle style={{ fontSize: '18px', color: currentTheme.primary }} />;
      case 'person': return <PersonAdd style={{ fontSize: '18px', color: currentTheme.status.success }} />;
      case 'chat': return <ChatBubbleOutline style={{ fontSize: '18px', color: currentTheme.primary }} />;
      case 'heart': return <Favorite style={{ fontSize: '18px', color: '#ff6b6b' }} />;
      case 'flag': return <Flag style={{ fontSize: '18px', color: currentTheme.status.warning }} />;
      case 'announcement': return <NewReleases style={{ fontSize: '18px', color: '#a855f7' }} />;
      default: return <Notifications style={{ fontSize: '18px', color: currentTheme.text.muted }} />;
    }
  };

  // Close tooltip when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.greeting-text') && !target.closest('.greeting-tooltip')) {
        setGreetingInfo(null);
      }
    };

    if (greetingInfo) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [greetingInfo]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update greeting only when hour changes (not every second)
  useEffect(() => {
    const timer = setInterval(() => {
      const hour = new Date().getHours();
      setCurrentHour((prev) => (prev !== hour ? hour : prev));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => getGreeting(currentHour), [currentHour]);

  // Use optimized hooks for heavy computations
  const stats = useWebWorkerStatsOptimized();
  const { trending } = useTMDBTrending(); // Use actual TMDB trending data
  const topRated = useTopRated();

  // Handle rewatch episode swipe complete
  const handleRewatchComplete = async (item: (typeof rewatchEpisodes)[number], swipeDirection: 'left' | 'right' = 'right') => {
    const key = `rewatch-${item.id}-${item.seasonNumber}-${item.episodeNumber}`;
    setRewatchSwipeDirections(prev => ({ ...prev, [key]: swipeDirection }));
    setCompletingRewatches(prev => new Set(prev).add(key));

    if (user) {
      try {
        const episodePath = `${user.uid}/serien/${item.nmr}/seasons/${item.seasonIndex}/episodes/${item.episodeIndex}`;
        const newWatchCount = (item.currentWatchCount || 0) + 1;

        await firebase.database().ref(`${episodePath}/watchCount`).set(newWatchCount);
        await firebase.database().ref(`${episodePath}/lastWatchedAt`).set(new Date().toISOString());

        if (!item.currentWatchCount) {
          await firebase.database().ref(`${episodePath}/watched`).set(true);
          await firebase.database().ref(`${episodePath}/firstWatchedAt`).set(new Date().toISOString());
        }

        // Log rewatch activity
        WatchActivityService.logEpisodeWatch(
          user.uid,
          item.id,
          item.title,
          item.seasonNumber,
          item.episodeNumber,
          item.episodeRuntime,
          true,
          item.genre?.genres,
          item.provider?.provider?.map((p: { name: string }) => p.name)
        );

        // Badge system
        const { updateEpisodeCounters } = await import('../../features/badges/minimalActivityLogger');
        await updateEpisodeCounters(user.uid, true);

        // Auto-complete rewatch: check if this was the last episode
        const series = seriesList.find(s => s.id === item.id);
        if (series?.rewatch?.active) {
          const targetCount = item.targetWatchCount;
          let allDone = true;
          for (const s of series.seasons || []) {
            for (const ep of s.episodes || []) {
              if (!ep.watched) continue;
              if (s.seasonNumber === (item.seasonNumber - 1) && s.episodes?.indexOf(ep) === item.episodeIndex) continue;
              if ((ep.watchCount || 1) < targetCount) {
                allDone = false;
                break;
              }
            }
            if (!allDone) break;
          }
          if (allDone && newWatchCount >= targetCount) {
            await firebase.database().ref(`${user.uid}/serien/${item.nmr}/rewatch`).remove();
          }
        }
      } catch (error) {
        console.error('Error completing rewatch episode:', error);
      }
    }

    setTimeout(() => {
      setHiddenRewatches(prev => new Set(prev).add(key));
      setCompletingRewatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 300);
  };

  // Get the total count of series with unwatched episodes in watchlist
  const { seriesList } = useSeriesList();
  const totalSeriesWithUnwatched = useMemo(() => {
    const today = new Date();
    let count = 0;

    for (const series of seriesList) {
      if (!series.watchlist) continue;
      if (!series.seasons) continue;

      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons);

      let hasUnwatchedEpisode = false;
      for (const season of seasonsArray as Series['seasons']) {
        if (!season?.episodes) continue;
        const episodesArray = Array.isArray(season.episodes)
          ? season.episodes
          : Object.values(season.episodes);

        for (const episode of episodesArray as Series['seasons'][number]['episodes']) {
          if (!episode?.watched && episode?.air_date) {
            const airDate = new Date(episode.air_date);
            if (airDate <= today) {
              hasUnwatchedEpisode = true;
              break;
            }
          }
        }
        if (hasUnwatchedEpisode) break;
      }

      if (hasUnwatchedEpisode) count++;
    }

    return count;
  }, [seriesList]);

  // Visible sections in configured order
  const visibleSections = sectionOrder.filter(id => !hiddenSections.includes(id));

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'countdown':
        return countdowns.length > 0 ? (() => {
          const next = countdowns[0];
          const countdownColor = '#a855f7';
          const daysText = next.daysUntil === 0
            ? 'Heute!'
            : next.daysUntil === 1
              ? 'Morgen'
              : `in ${next.daysUntil} Tagen`;
          return (
            <motion.div
              key="countdown"
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/countdowns')}
              style={{
                margin: '0 20px 16px',
                borderRadius: '14px',
                padding: '12px 14px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {next.posterUrl && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${next.posterUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(20px) brightness(0.3)',
                    transform: 'scale(1.2)',
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, ${countdownColor}40 0%, rgba(0,0,0,0.7) 100%)`,
                  border: `1px solid ${countdownColor}50`,
                  borderRadius: '16px',
                }}
              />
              {next.posterUrl && (
                <img
                  src={next.posterUrl}
                  alt=""
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 66,
                    borderRadius: '8px',
                    objectFit: 'cover',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                />
              )}
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <CalendarMonth style={{ fontSize: '16px', color: countdownColor }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: countdownColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Countdown
                  </span>
                  {countdowns.length > 1 && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: countdownColor,
                      background: `${countdownColor}25`,
                      padding: '1px 6px',
                      borderRadius: '6px',
                    }}>
                      +{countdowns.length - 1}
                    </span>
                  )}
                </div>
                <h2
                  style={{
                    margin: '0 0 1px 0',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {next.title}
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  Staffel {next.seasonNumber} &middot; {daysText}
                </p>
              </div>
              <div
                style={{
                  position: 'relative',
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: `${countdownColor}30`,
                  border: `2px solid ${countdownColor}80`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {next.daysUntil === 0 ? (
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Heute
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                      {next.daysUntil}
                    </span>
                    <span style={{ fontSize: '7px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                      {next.daysUntil === 1 ? 'Tag' : 'Tage'}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })() : null;

      case 'for-you': {
        const forYouComponents: Record<string, React.ReactNode> = {
          'watch-streak': <WatchStreakCard key="watch-streak" />,
          'taste-match': <TasteMatchCard key="taste-match" />,
          'watch-journey': <WatchJourneyCard key="watch-journey" />,
          'catch-up': <CatchUpCard key="catch-up" />,
          'hidden-series': <HiddenSeriesCard key="hidden-series" />,
        };
        const visibleForYou = forYouOrder.filter(id => !hiddenForYou.includes(id));
        if (visibleForYou.length === 0) return null;
        return (
          <section key="for-you" style={{ marginBottom: '32px' }}>
            <SectionHeader icon={<AutoAwesome />} iconColor={currentTheme.primary} title="Für dich" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visibleForYou.map(id => forYouComponents[id])}
            </div>
          </section>
        );
      }

      case 'stats':
        return (
          <div key="stats" style={{ padding: '0 20px', marginBottom: '20px' }}>
            <StatsGrid />
          </div>
        );

      // continue-watching, rewatches, today-episodes, trending, top-rated
      // are rendered inline in the map due to their size
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* Wrapped Notification - prominently at the top */}
      <WrappedNotification />

      {/* New Season Notification */}
      {seriesWithNewSeasons && seriesWithNewSeasons.length > 0 && (
        <CarouselNotification
          variant="new-season"
          series={seriesWithNewSeasons}
          onDismiss={clearNewSeasons}
        />
      )}

      {/* Inactive Series Notification - nur anzeigen wenn keine neue Staffel-Benachrichtigung */}
      {(!seriesWithNewSeasons || seriesWithNewSeasons.length === 0) &&
        inactiveSeries &&
        inactiveSeries.length > 0 && (
          <CarouselNotification
            variant="inactive"
            series={inactiveSeries}
            onDismiss={clearInactiveSeries}
          />
        )}

      {/* Inactive Rewatch Notification */}
      {(!seriesWithNewSeasons || seriesWithNewSeasons.length === 0) &&
        (!inactiveSeries || inactiveSeries.length === 0) &&
        inactiveRewatches &&
        inactiveRewatches.length > 0 && (
          <CarouselNotification
            variant="inactive-rewatch"
            series={inactiveRewatches}
            onDismiss={clearInactiveRewatches}
          />
        )}

      {/* Completed Series Notification - nur anzeigen wenn keine anderen Benachrichtigungen */}
      {(!seriesWithNewSeasons || seriesWithNewSeasons.length === 0) &&
        (!inactiveSeries || inactiveSeries.length === 0) &&
        (!inactiveRewatches || inactiveRewatches.length === 0) &&
        completedSeries &&
        completedSeries.length > 0 && (
          <CarouselNotification
            variant="completed"
            series={completedSeries}
            onDismiss={clearCompletedSeries}
          />
        )}

      {/* Tooltip - shows language info and is clickable */}
      {greetingInfo && (
        <div
          className="greeting-tooltip"
          onClick={async (e) => {
            e.stopPropagation();
            if (greeting.title && greeting.type) {
              try {
                const apiKey = import.meta.env.VITE_API_TMDB;
                const searchUrl = `https://api.themoviedb.org/3/search/${greeting.type}?api_key=${apiKey}&query=${encodeURIComponent(greeting.title)}&language=de-DE`;
                const response = await fetch(searchUrl);
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                  const result = data.results[0];
                  navigate(`/${greeting.type}/${result.id}`);
                  setGreetingInfo(null);
                }
              } catch (error) {
                console.error('Error searching TMDB:', error);
              }
            }
          }}
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 99999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            color: '#ffffff',
            pointerEvents: 'auto',
            cursor: greeting.title ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ color: '#ffffff' }}>
            {greetingInfo}
            {greeting.title && ' →'}
          </span>
        </div>
      )}

      {/* Premium Header */}
      <header
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          padding: '20px',
          paddingTop: 'calc(30px + env(safe-area-inset-top))',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <GradientText
              as="h1"
              from={currentTheme.primary}
              to="#f59e0b"
              style={{
                fontSize: '24px',
                fontWeight: 800,
                margin: '0 0 4px 0',
              }}
            >
              <span
                className="greeting-text"
                onClick={(e) => {
                  e.stopPropagation();
                  setGreetingInfo(greetingInfo ? null : greeting.lang);
                }}
                style={{
                  cursor: 'pointer',
                  textDecoration: greeting.title ? 'underline dotted' : 'none',
                  textDecorationColor: currentTheme.primary,
                  textUnderlineOffset: '3px',
                }}
              >
                {greeting.text}
              </span>
              , {user?.displayName?.split(' ')[0] || 'User'}!
            </GradientText>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: 0,
              }}
            >
              <LiveClock />
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {unreadActivitiesCount + notificationUnreadCount + ANNOUNCEMENTS.filter(a => !dismissedAnnouncements.includes(a.id)).length > 0 ? (
              <Badge
                badgeContent={unreadActivitiesCount + notificationUnreadCount + ANNOUNCEMENTS.filter(a => !dismissedAnnouncements.includes(a.id)).length}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)',
                  },
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifications(true)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `${currentTheme.primary}1A`,
                    border: `1px solid ${currentTheme.primary}33`,
                    color: currentTheme.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Notifications style={{ fontSize: '20px' }} />
                </motion.button>
              </Badge>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(true)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `${currentTheme.primary}1A`,
                  border: `1px solid ${currentTheme.primary}33`,
                  color: currentTheme.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Notifications style={{ fontSize: '20px' }} />
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/profile')}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `url(${user?.photoURL}) center/cover`,
                border: `2px solid ${currentTheme.primary}`,
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/search')}
          style={{
            background: `${currentTheme.background.surface}`,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Search style={{ fontSize: '20px', color: currentTheme.text.muted }} />
          <span style={{ color: currentTheme.text.muted, fontSize: '14px' }}>
            Suche nach Serien oder Filmen
          </span>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <HorizontalScrollContainer
        gap={8}
        style={{
          padding: '0 20px',
          marginBottom: '20px',
        }}
      >
        <Chip
          icon={<PlayCircle />}
          label={`${stats.watchedEpisodes} Episoden`}
          onClick={() => navigate('/stats')}
          style={{
            background: `${currentTheme.status.success}1A`,
            border: `1px solid ${currentTheme.status.success}4D`,
            color: currentTheme.status.success,
          }}
        />
        <Chip
          icon={<MovieIcon />}
          label={`${stats.totalMovies} Filme`}
          onClick={() => navigate('/ratings?tab=movies')}
          style={{
            background: `${currentTheme.status.error}1A`,
            border: `1px solid ${currentTheme.status.error}4D`,
            color: currentTheme.status.error,
          }}
        />
        <Chip
          icon={<TrendingUp />}
          label={`${stats.progress}% Fortschritt`}
          onClick={() => navigate('/stats')}
          style={{
            background: `${currentTheme.primary}1A`,
            border: `1px solid ${currentTheme.primary}4D`,
            color: currentTheme.primary,
          }}
        />
        {stats.todayEpisodes > 0 && (
          <Chip
            icon={<NewReleases />}
            label={`${stats.todayEpisodes} Heute`}
            onClick={() => navigate('/new-episodes')}
            style={{
              background: `${currentTheme.status.warning}1A`,
              border: `1px solid ${currentTheme.status.warning}4D`,
              color: currentTheme.status.warning,
            }}
          />
        )}
      </HorizontalScrollContainer>

      {/* Main Action Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          padding: '0 20px',
          marginBottom: '16px',
        }}
      >
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/watchlist')}
          style={{
            background:
              'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 180, 216, 0.2) 100%)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            borderRadius: '12px',
            padding: '10px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <PlayCircle
            style={{
              fontSize: '22px',
              color: currentTheme.status.success,
              flexShrink: 0,
            }}
          />
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>
              Weiterschauen
            </h2>
            <p style={{ fontSize: '11px', color: currentTheme.text.secondary, margin: 0 }}>
              {totalSeriesWithUnwatched} Serien
            </p>
          </div>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/discover')}
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}33 0%, ${currentTheme.accent}33 100%)`,
            border: `1px solid ${currentTheme.primary}4D`,
            borderRadius: '12px',
            padding: '10px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AutoAwesome
            style={{
              fontSize: '22px',
              color: currentTheme.primary,
              flexShrink: 0,
            }}
          />
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>
              Entdecken
            </h2>
            <p style={{ fontSize: '11px', color: currentTheme.text.secondary, margin: 0 }}>
              Neue Inhalte
            </p>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          padding: '0 20px',
          marginBottom: '16px',
        }}
      >
        {[
          { icon: <Star />, label: 'Ratings', path: '/ratings', color: currentTheme.status.warning },
          { icon: <CalendarToday />, label: 'Kalender', path: '/new-episodes', color: currentTheme.status.success },
          { icon: <History />, label: 'Verlauf', path: '/recently-watched', color: currentTheme.status.error },
          { icon: <Group />, label: 'Freunde', path: '/activity', color: currentTheme.status.info.main },
        ].map((action, index) => (
          <motion.button
            key={index}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(action.path)}
            style={{
              padding: isDesktop ? '10px 6px' : '10px 8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              color: action.color,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isDesktop ? '4px' : '6px',
            }}
          >
            {cloneElement(action.icon, { style: { fontSize: '18px' } })}
            <span style={{ fontSize: '11px', fontWeight: 600, color: currentTheme.text.primary }}>
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Secondary Actions Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          padding: '0 20px',
          marginBottom: '32px',
        }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/leaderboard')}
          style={{
            padding: isDesktop ? '12px' : '14px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '12px',
            color: '#f59e0b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <EmojiEvents style={{ fontSize: '18px' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Rangliste</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/badges')}
          style={{
            padding: isDesktop ? '12px' : '14px',
            background: `linear-gradient(135deg, ${currentTheme.primary}1A 0%, ${currentTheme.accent}1A 100%)`,
            border: `1px solid ${currentTheme.primary}33`,
            borderRadius: '12px',
            color: currentTheme.primary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <AutoAwesome style={{ fontSize: '18px' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Badges</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/pets')}
          style={{
            padding: isDesktop ? '12px' : '14px',
            background: `linear-gradient(135deg, ${currentTheme.status.success}1A 0%, ${currentTheme.status.info.main}1A 100%)`,
            border: `1px solid ${currentTheme.status.success}33`,
            borderRadius: '12px',
            color: currentTheme.status.success,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <LocalFireDepartment style={{ fontSize: '18px' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Pets</span>
        </motion.button>
      </div>

      {/* === Configurable Sections (ordered by user config) === */}
      {visibleSections.map((sectionId) => {
        // Sections handled by renderSection
        const rendered = renderSection(sectionId);
        if (rendered !== null) return rendered;

        // Large inline sections rendered here with key
        switch (sectionId) {
          case 'continue-watching':
            return continueWatching.length > 0 ? (
              <section key="continue-watching" style={{ marginBottom: '32px' }}>
                <SectionHeader
                  icon={<PlayCircle />}
                  iconColor={currentTheme.status.success}
                  title="Weiterschauen"
                  onSeeAll={() => navigate('/watchlist')}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 20px', position: 'relative' }}>
                  <AnimatePresence mode="popLayout">
                    {continueWatching.filter(item => !hiddenContinueEpisodes.has(`${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`)).slice(0, 6).map((item) => {
                      const episodeKey = `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`;
                      const isCompleting = completingContinueEpisodes.has(episodeKey);
                      const isSwiping = swipingContinueEpisodes.has(episodeKey);
                      return (
                        <motion.div key={episodeKey} data-block-swipe layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: isCompleting ? 0.5 : 1, y: 0, scale: isCompleting ? 0.95 : 1 }} exit={{ opacity: 0, x: swipeDirections[episodeKey] === 'left' ? -300 : 300, transition: { duration: 0.3 } }} style={{ position: 'relative' }}>
                          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} dragSnapToOrigin onDragStart={() => setSwipingContinueEpisodes(prev => new Set(prev).add(episodeKey))} onDrag={(_event, info: PanInfo) => setDragOffsetsContinue(prev => ({ ...prev, [episodeKey]: info.offset.x }))} onDragEnd={(event, info: PanInfo) => { event.stopPropagation(); setSwipingContinueEpisodes(prev => { const s = new Set(prev); s.delete(episodeKey); return s; }); setDragOffsetsContinue(prev => { const o = { ...prev }; delete o[episodeKey]; return o; }); if (Math.abs(info.offset.x) > 100) handleContinueEpisodeComplete(item, info.offset.x > 0 ? 'right' : 'left'); }} whileDrag={{ scale: 1.02 }} style={{ position: 'absolute', top: 0, left: '70px', right: 0, bottom: 0, zIndex: 1 }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isCompleting ? 'linear-gradient(90deg, rgba(76, 209, 55, 0.2), rgba(0, 212, 170, 0.05))' : `rgba(76, 209, 55, ${Math.min((Math.abs(dragOffsetsContinue[episodeKey] || 0) / 100) * 0.15, 0.15)})`, border: `1px solid ${isCompleting ? 'rgba(76, 209, 55, 0.5)' : `rgba(76, 209, 55, ${0.2 + Math.min((Math.abs(dragOffsetsContinue[episodeKey] || 0) / 100) * 0.3, 0.3)})`}`, transition: dragOffsetsContinue[episodeKey] ? 'none' : 'all 0.3s ease', borderRadius: '12px', padding: '12px', position: 'relative', overflow: 'hidden' }}>
                            <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(76, 209, 55, 0.3))', opacity: 0 }} animate={{ opacity: isSwiping ? 1 : 0 }} />
                            <img src={item.poster} alt={item.title} decoding="async" onClick={() => setPosterNav({ open: true, seriesId: item.id, title: item.title, episodePath: `/episode/${item.id}/s/${item.nextEpisode.seasonNumber}/e/${item.nextEpisode.episodeNumber}` })} style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', position: 'relative', zIndex: 2 }} />
                            <div style={{ flex: 1, pointerEvents: 'none', position: 'relative', zIndex: 2 }}>
                              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>{item.title}</h3>
                              <p style={{ fontSize: '12px', margin: 0, color: '#00d4aa' }}>S{item.nextEpisode.seasonNumber} E{item.nextEpisode.episodeNumber} • {item.nextEpisode.name}</p>
                              {(() => { const pace = calculateWatchingPace(item.seasons, item.episodeRuntime); const text = formatPaceLine(pace, true); if (!text) return null; return <p style={{ fontSize: '11px', margin: '2px 0 0 0', opacity: 0.5 }}>{text}</p>; })()}
                              <div style={{ marginTop: '4px', height: '3px', background: currentTheme.border.default, borderRadius: '1.5px', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${item.progress}%`, background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.status.success})`, transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                            <AnimatePresence mode="wait">
                              {isCompleting ? (
                                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }}><Check style={{ fontSize: '24px', color: currentTheme.status.success }} /></motion.div>
                              ) : (
                                <motion.div animate={{ x: isSwiping ? 10 : 0 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <EpisodeDiscussionButton seriesId={item.id} seasonNumber={item.nextEpisode.seasonNumber} episodeNumber={item.nextEpisode.episodeNumber} />
                                  <PlayCircle style={{ fontSize: '20px', color: currentTheme.status.success }} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            ) : null;

          case 'rewatches':
            return rewatchEpisodes.length > 0 ? (
              <section key="rewatches" style={{ marginBottom: '32px' }}>
                <SectionHeader icon={<Repeat />} iconColor={currentTheme.status.warning} title="Rewatches" onSeeAll={() => navigate('/watchlist?rewatches=open')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 20px', position: 'relative' }}>
                  <AnimatePresence mode="popLayout">
                    {rewatchEpisodes.filter(item => !hiddenRewatches.has(`rewatch-${item.id}-${item.seasonNumber}-${item.episodeNumber}`)).slice(0, 4).map(item => {
                      const key = `rewatch-${item.id}-${item.seasonNumber}-${item.episodeNumber}`;
                      const isCompleting = completingRewatches.has(key);
                      const isSwiping = swipingRewatches.has(key);
                      const warningColor = currentTheme.status?.warning || '#f59e0b';
                      return (
                        <motion.div key={key} data-block-swipe layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: isCompleting ? 0.5 : 1, y: 0, scale: isCompleting ? 0.95 : 1 }} exit={{ opacity: 0, x: rewatchSwipeDirections[key] === 'left' ? -300 : 300, transition: { duration: 0.3 } }} style={{ position: 'relative' }}>
                          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} dragSnapToOrigin onDragStart={() => setSwipingRewatches(prev => new Set(prev).add(key))} onDrag={(_event, info: PanInfo) => setDragOffsetsRewatches(prev => ({ ...prev, [key]: info.offset.x }))} onDragEnd={(event, info: PanInfo) => { event.stopPropagation(); setSwipingRewatches(prev => { const s = new Set(prev); s.delete(key); return s; }); setDragOffsetsRewatches(prev => { const o = { ...prev }; delete o[key]; return o; }); if (Math.abs(info.offset.x) > 100) handleRewatchComplete(item, info.offset.x > 0 ? 'right' : 'left'); }} whileDrag={{ scale: 1.02 }} style={{ position: 'absolute', top: 0, left: '70px', right: 0, bottom: 0, zIndex: 1 }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isCompleting ? `linear-gradient(90deg, ${warningColor}33, ${warningColor}0D)` : `${warningColor}${Math.min(Math.round((Math.abs(dragOffsetsRewatches[key] || 0) / 100) * 25), 25).toString(16).padStart(2, '0')}`, border: `1px solid ${isCompleting ? `${warningColor}80` : `${warningColor}${Math.round(51 + Math.min((Math.abs(dragOffsetsRewatches[key] || 0) / 100) * 77, 77)).toString(16)}`}`, transition: dragOffsetsRewatches[key] ? 'none' : 'all 0.3s ease', borderRadius: '12px', padding: '12px', position: 'relative', overflow: 'hidden' }}>
                            <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(90deg, transparent, ${warningColor}4D)`, opacity: 0 }} animate={{ opacity: isSwiping ? 1 : 0 }} />
                            <img src={item.poster} alt={item.title} decoding="async" onClick={() => setPosterNav({ open: true, seriesId: item.id, title: item.title, episodePath: `/episode/${item.id}/s/${item.seasonNumber}/e/${item.episodeNumber}` })} style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', position: 'relative', zIndex: 2 }} />
                            <div style={{ flex: 1, pointerEvents: 'none', position: 'relative', zIndex: 2 }}>
                              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>{item.title}</h3>
                              <p style={{ fontSize: '12px', margin: 0, color: warningColor }}>S{item.seasonNumber} E{item.episodeNumber} • {item.episodeName}</p>
                              <p style={{ fontSize: '11px', margin: '2px 0 0 0', opacity: 0.5 }}>{item.currentWatchCount}x → {item.targetWatchCount}x</p>
                              <div style={{ marginTop: '4px', height: '3px', background: currentTheme.border.default, borderRadius: '1.5px', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${item.progress}%`, background: `linear-gradient(90deg, ${warningColor}, #f59e0b)`, transition: 'width 0.3s ease' }} />
                              </div>
                            </div>
                            <AnimatePresence mode="wait">
                              {isCompleting ? (
                                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }}><Check style={{ fontSize: '24px', color: warningColor }} /></motion.div>
                              ) : (
                                <motion.div animate={{ x: isSwiping ? 10 : 0 }} style={{ display: 'flex', alignItems: 'center' }}><Repeat style={{ fontSize: '20px', color: warningColor }} /></motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            ) : null;

          case 'today-episodes':
            return todayEpisodes.length > 0 ? (
              <section key="today-episodes" style={{ marginBottom: '32px' }}>
                <SectionHeader icon={<NewReleases />} iconColor={currentTheme.status.warning} title="Heute Neu" onSeeAll={() => navigate('/new-episodes')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 20px', position: 'relative' }}>
                  <AnimatePresence mode="popLayout">
                    {todayEpisodes.filter(ep => !hiddenEpisodes.has(`${ep.seriesId}-${ep.seasonNumber}-${ep.episodeNumber}`)).slice(0, 5).map((episode) => {
                      const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;
                      const isCompleting = completingEpisodes.has(episodeKey);
                      const isSwiping = swipingEpisodes.has(episodeKey);
                      return (
                        <motion.div key={episodeKey} data-block-swipe layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: isCompleting ? 0.5 : 1, y: 0, scale: isCompleting ? 0.95 : 1 }} exit={{ opacity: 0, x: swipeDirections[episodeKey] === 'left' ? -300 : 300, transition: { duration: 0.3 } }} style={{ position: 'relative' }}>
                          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} dragSnapToOrigin onDragStart={() => setSwipingEpisodes(prev => new Set(prev).add(episodeKey))} onDrag={(_event, info: PanInfo) => setDragOffsetsEpisodes(prev => ({ ...prev, [episodeKey]: info.offset.x }))} onDragEnd={(event, info: PanInfo) => { event.stopPropagation(); setSwipingEpisodes(prev => { const s = new Set(prev); s.delete(episodeKey); return s; }); setDragOffsetsEpisodes(prev => { const o = { ...prev }; delete o[episodeKey]; return o; }); if (Math.abs(info.offset.x) > 100 && !episode.watched) handleEpisodeComplete(episode, info.offset.x > 0 ? 'right' : 'left'); }} whileDrag={{ scale: 1.02 }} style={{ position: 'absolute', top: 0, left: '70px', right: 0, bottom: 0, zIndex: 1 }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isCompleting ? 'linear-gradient(90deg, rgba(76, 209, 55, 0.2), rgba(255, 215, 0, 0.05))' : episode.watched ? 'rgba(76, 209, 55, 0.1)' : `rgba(76, 209, 55, ${Math.min((Math.abs(dragOffsetsEpisodes[episodeKey] || 0) / 100) * 0.15, 0.15)})`, border: `1px solid ${isCompleting ? 'rgba(76, 209, 55, 0.5)' : episode.watched ? 'rgba(76, 209, 55, 0.3)' : `rgba(76, 209, 55, ${0.2 + Math.min((Math.abs(dragOffsetsEpisodes[episodeKey] || 0) / 100) * 0.3, 0.3)})`}`, transition: dragOffsetsEpisodes[episodeKey] ? 'none' : 'all 0.3s ease', borderRadius: '12px', padding: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                            <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(76, 209, 55, 0.3))', opacity: 0 }} animate={{ opacity: isSwiping ? 1 : 0 }} />
                            <img src={episode.poster} alt={episode.seriesTitle} decoding="async" onClick={() => setPosterNav({ open: true, seriesId: Number(episode.seriesId), title: episode.seriesTitle, episodePath: `/episode/${episode.seriesId}/s/${episode.seasonNumber}/e/${episode.episodeNumber}` })} style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', position: 'relative', zIndex: 2 }} />
                            <div style={{ flex: 1, pointerEvents: 'none' }}>
                              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>{episode.seriesTitle}</h3>
                              <p style={{ fontSize: '12px', margin: 0, color: episode.watched ? '#4cd137' : '#ffd700' }}>S{episode.seasonNumber} E{episode.episodeNumber} • {episode.episodeName}</p>
                            </div>
                            <AnimatePresence mode="wait">
                              {isCompleting ? (
                                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 180 }}><Check style={{ fontSize: '24px', color: currentTheme.status.success }} /></motion.div>
                              ) : episode.watched ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><EpisodeDiscussionButton seriesId={Number(episode.seriesId)} seasonNumber={episode.seasonNumber} episodeNumber={episode.episodeNumber} /><CheckCircle style={{ fontSize: '20px', color: currentTheme.status.success }} /></div>
                              ) : (
                                <motion.div animate={{ x: isSwiping ? 10 : 0 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><EpisodeDiscussionButton seriesId={Number(episode.seriesId)} seasonNumber={episode.seasonNumber} episodeNumber={episode.episodeNumber} /><PlayCircle style={{ fontSize: '20px', color: currentTheme.status.warning }} /></motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            ) : null;

          case 'trending':
            return trending.length > 0 ? (
              <section key="trending" style={{ marginBottom: '32px' }}>
                <SectionHeader icon={<LocalFireDepartment />} iconColor={currentTheme.status.error} title="Trending diese Woche" />
                <HorizontalScrollContainer gap={12} style={{ padding: '0 20px' }}>
                  {trending.map((item, index) => (
                    <motion.div key={`trending-${item.type}-${item.id}`} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/${item.type}/${item.id}`)} style={{ minWidth: window.innerWidth >= 768 ? '240px' : '140px', cursor: 'pointer' }}>
                      <div style={{ position: 'relative', marginBottom: '6px' }}>
                        <img src={item.poster} alt={item.title} decoding="async" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '10px' }} />
                        <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'linear-gradient(135deg, #ff6b6b, #ff4757)', color: 'white', borderRadius: '6px', padding: '2px 6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', zIndex: 1 }}><TrendingUp style={{ fontSize: '12px' }} />#{index + 1}</div>
                        <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: item.type === 'movie' ? 'rgba(255, 193, 7, 0.9)' : 'rgba(102, 126, 234, 0.9)', color: 'white', borderRadius: '6px', padding: '2px 6px', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', backdropFilter: 'blur(10px)' }}>
                          {item.type === 'movie' ? <><MovieIcon style={{ fontSize: '10px' }} />Film</> : <><Tv style={{ fontSize: '10px' }} />Serie</>}
                        </div>
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: currentTheme.text.muted, marginTop: '2px' }}><Star style={{ fontSize: '14px', color: '#ffd43b' }} /><span>{item.rating ? item.rating.toFixed(1) : 'N/A'}</span></div>
                    </motion.div>
                  ))}
                </HorizontalScrollContainer>
              </section>
            ) : null;

          case 'top-rated':
            return topRated.length > 0 ? (
              <section key="top-rated" style={{ marginBottom: '32px' }}>
                <SectionHeader icon={<Star />} iconColor={currentTheme.status.warning} title="Bestbewertet" onSeeAll={() => navigate('/ratings')} />
                <HorizontalScrollContainer gap={12} style={{ padding: '0 20px' }}>
                  {topRated.map((item, index) => (
                    <motion.div key={index} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/${item.type}/${item.id}`)} style={{ minWidth: window.innerWidth >= 768 ? '240px' : '140px', cursor: 'pointer' }}>
                      <div style={{ position: 'relative', marginBottom: '6px' }}>
                        <img src={item.poster} alt={item.title} decoding="async" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '10px' }} />
                        <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0, 0, 0, 0.8)', borderRadius: '8px', padding: '4px 6px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', backdropFilter: 'blur(10px)' }}>
                          <Star style={{ fontSize: '13px', color: currentTheme.status.warning }} />{item.rating.toFixed(1)}
                        </div>
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                    </motion.div>
                  ))}
                </HorizontalScrollContainer>
              </section>
            ) : null;

          default:
            return null;
        }
      })}

      {/* Poster Navigation Sheet */}
      <BottomSheet
        isOpen={posterNav.open}
        onClose={() => setPosterNav(prev => ({ ...prev, open: false }))}
        bottomOffset="calc(90px + env(safe-area-inset-bottom))"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px 16px' }}>
          <p style={{ fontSize: '17px', fontWeight: '600', margin: 0, color: currentTheme.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{posterNav.title}</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setPosterNav(prev => ({ ...prev, open: false }));
              navigate(posterNav.episodePath);
            }}
            style={{
              padding: '14px 16px',
              background: 'rgba(0, 212, 170, 0.15)',
              border: '1px solid rgba(0, 212, 170, 0.3)',
              borderRadius: '12px',
              color: '#00d4aa',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <PlayCircle style={{ fontSize: '20px' }} />
            Zur Episode
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setPosterNav(prev => ({ ...prev, open: false }));
              navigate(`/series/${posterNav.seriesId}`);
            }}
            style={{
              padding: '14px 16px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Tv style={{ fontSize: '20px' }} />
            Zur Serie
          </motion.button>
        </div>
      </BottomSheet>

      {/* Notifications BottomSheet */}
      <BottomSheet
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        maxHeight="75vh"
        ariaLabel="Benachrichtigungen"
        bottomOffset="calc(90px + env(safe-area-inset-bottom))"
      >
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
          {/* Header with gradient accent */}
          <div style={{ padding: '0 20px 16px', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              background: `radial-gradient(ellipse 80% 100% at 50% -30%, ${currentTheme.primary}15, transparent)`,
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div>
                <h2 style={{
                  margin: '0 0 2px',
                  fontSize: '20px',
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Benachrichtigungen
                </h2>
                {unifiedNotifications.length > 0 && (
                  <span style={{ fontSize: '12px', color: currentTheme.text.muted }}>
                    {unifiedNotifications.filter(n => !n.read).length > 0
                      ? `${unifiedNotifications.filter(n => !n.read).length} ungelesen`
                      : 'Alles gelesen'}
                  </span>
                )}
              </div>
              {unifiedNotifications.some(n => !n.read) && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMarkAllNotificationsRead}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                    border: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: `0 4px 15px ${currentTheme.primary}40`,
                  }}
                >
                  <DoneAll style={{ fontSize: '20px' }} />
                </motion.button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
            {unifiedNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: `${currentTheme.text.muted}10`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Notifications style={{ fontSize: '36px', color: currentTheme.text.muted }} />
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: currentTheme.text.primary }}>
                  Alles ruhig hier
                </h3>
                <p style={{ color: currentTheme.text.muted, fontSize: '13px', margin: 0 }}>
                  Keine neuen Benachrichtigungen
                </p>
              </div>
            ) : (
              <div style={{ padding: '0 12px' }}>
                {unifiedNotifications.map((item, index) => (
                  <motion.div
                    key={item.id}
                    whileTap={item.kind !== 'request' ? { scale: 0.98 } : undefined}
                    onClick={() => {
                      if (item.kind === 'request') return;
                      if (item.kind === 'discussion' && item.notificationId) {
                        markAsRead(item.notificationId);
                      }
                      if (item.kind === 'announcement') {
                        dismissAnnouncement(item.id);
                      }
                      if (item.navigateTo) {
                        setShowNotifications(false);
                        navigate(item.navigateTo);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '14px 8px',
                      cursor: item.kind !== 'request' && item.navigateTo ? 'pointer' : 'default',
                      borderBottom: index < unifiedNotifications.length - 1 ? `1px solid ${currentTheme.border.default}40` : 'none',
                      position: 'relative',
                      background: !item.read ? `${currentTheme.primary}08` : 'transparent',
                      borderRadius: '12px',
                      marginBottom: index < unifiedNotifications.length - 1 ? '2px' : 0,
                    }}
                  >
                    {/* Unread accent bar */}
                    {!item.read && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: '14px',
                        bottom: '14px',
                        width: '3px',
                        borderRadius: '2px',
                        background: `linear-gradient(180deg, ${currentTheme.primary}, #8b5cf6)`,
                      }} />
                    )}

                    {/* Icon with gradient background */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      background: item.icon === 'person'
                        ? `linear-gradient(135deg, ${currentTheme.status.success}20, ${currentTheme.status.success}08)`
                        : item.icon === 'star'
                          ? `linear-gradient(135deg, ${currentTheme.status.warning}20, ${currentTheme.status.warning}08)`
                          : item.icon === 'heart'
                            ? 'linear-gradient(135deg, #ff6b6b20, #ff6b6b08)'
                            : item.icon === 'flag'
                              ? `linear-gradient(135deg, ${currentTheme.status.warning}20, ${currentTheme.status.warning}08)`
                              : item.icon === 'movie'
                                ? `linear-gradient(135deg, ${currentTheme.status.error}20, ${currentTheme.status.error}08)`
                                : item.icon === 'announcement'
                                  ? 'linear-gradient(135deg, #a855f720, #a855f708)'
                                  : `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.primary}08)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {getNotificationIcon(item.icon)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: !item.read ? 700 : 600,
                          color: currentTheme.text.primary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}>
                          {item.title}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: !item.read ? currentTheme.primary : currentTheme.text.muted,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}>
                          {formatNotificationTime(item.timestamp)}
                          {!item.read && (
                            <span style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                              flexShrink: 0,
                            }} />
                          )}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: !item.read ? currentTheme.text.secondary : currentTheme.text.muted,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {item.message}
                      </div>

                      {/* Request actions */}
                      {item.kind === 'request' && item.requestId && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptFriendRequest(item.requestId!);
                            }}
                            style={{
                              padding: '8px 16px',
                              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                              border: 'none',
                              borderRadius: '10px',
                              color: 'white',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: `0 4px 12px ${currentTheme.primary}30`,
                            }}
                          >
                            <Check style={{ fontSize: '16px' }} />
                            Annehmen
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              declineFriendRequest(item.requestId!);
                            }}
                            style={{
                              padding: '8px 16px',
                              background: currentTheme.background.default,
                              border: `1px solid ${currentTheme.border.default}`,
                              borderRadius: '10px',
                              color: currentTheme.text.secondary,
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Cancel style={{ fontSize: '16px' }} />
                            Ablehnen
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Footer link */}
            <div style={{ padding: '8px 16px 20px' }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/activity');
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: `linear-gradient(135deg, ${currentTheme.primary}12, #8b5cf612)`,
                  border: `1px solid ${currentTheme.primary}25`,
                  borderRadius: '14px',
                  color: currentTheme.primary,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Group style={{ fontSize: '18px' }} />
                Alle Aktivitäten anzeigen
              </motion.button>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
