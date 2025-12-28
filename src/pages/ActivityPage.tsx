/**
 * ActivityPage - Premium Social Activity Feed
 * Beautiful activity feed with friend management
 */

import {
  Cancel,
  ChatBubbleOutline,
  CheckCircle,
  ExpandMore,
  Favorite,
  Flag,
  Group,
  MailOutline,
  Movie as MovieIcon,
  Person,
  PersonAdd,
  Star,
  Timeline,
  Tv as TvIcon,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMovieList } from '../contexts/MovieListProvider';
import { useNotifications } from '../contexts/NotificationContext';
import { useOptimizedFriends } from '../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { FriendActivity } from '../types/Friend';
import { BackButton } from '../components/BackButton';
import { AddFriendDialog } from '../components/AddFriendDialog';

export const ActivityPage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const {
    friends,
    friendRequests,
    sentRequests,
    friendActivities,
    unreadActivitiesCount,
    unreadRequestsCount,
    markActivitiesAsRead,
    markRequestsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
  } = useOptimizedFriends();

  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const {
    notifications,
    unreadCount: unreadDiscussionCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const discussionNotifications = useMemo(() => {
    return notifications.filter(
      (n) =>
        n.type === 'discussion_reply' || n.type === 'discussion_like' || n.type === 'spoiler_flag'
    );
  }, [notifications]);

  const [activeTab, setActiveTab] = useState<'activity' | 'friends' | 'requests' | 'discussions'>(
    'activity'
  );
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [tmdbPosters, setTmdbPosters] = useState<Record<string, string>>({});
  const [friendProfiles, setFriendProfiles] = useState<Record<string, any>>({});
  const [requestProfiles, setRequestProfiles] = useState<Record<string, any>>({});
  const [filterType, setFilterType] = useState<'all' | 'movies' | 'series'>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab === 'activity' && unreadActivitiesCount > 0) {
      markActivitiesAsRead();
    } else if (activeTab === 'requests' && unreadRequestsCount > 0) {
      markRequestsAsRead();
    } else if (activeTab === 'discussions' && unreadDiscussionCount > 0) {
      markAllAsRead();
    }
  }, [activeTab, unreadActivitiesCount, unreadRequestsCount, unreadDiscussionCount]);

  useEffect(() => {
    if (friends.length === 0) return;

    const loadProfiles = async () => {
      const newProfiles: Record<string, any> = {};
      await Promise.all(
        friends.map(async (friend) => {
          try {
            const userRef = firebase.database().ref(`users/${friend.uid}`);
            const snapshot = await userRef.once('value');
            if (snapshot.exists()) {
              newProfiles[friend.uid] = snapshot.val();
            }
          } catch (error) {
            // Silent fail
          }
        })
      );
      setFriendProfiles(newProfiles);
    };

    loadProfiles();
  }, [friends]);

  useEffect(() => {
    const loadRequestProfiles = async () => {
      const profiles: Record<string, any> = {};
      for (const request of friendRequests) {
        try {
          const userRef = firebase.database().ref(`users/${request.fromUserId}`);
          const snapshot = await userRef.once('value');
          if (snapshot.exists()) {
            profiles[request.fromUserId] = snapshot.val();
          }
        } catch (error) {
          // Silent fail
        }
      }
      setRequestProfiles(profiles);
    };

    if (friendRequests.length > 0) {
      loadRequestProfiles();
    }
  }, [friendRequests]);

  const getItemDetails = (activity: FriendActivity) => {
    const tmdbId = (activity as any).tmdbId || (activity as any).itemId;

    if (
      activity.type === 'series_added' ||
      activity.type === 'series_rated' ||
      activity.type === 'rating_updated' ||
      activity.type === 'series_added_to_watchlist' ||
      (activity as any).itemType === 'series'
    ) {
      const series = seriesList.find((s) => s.id === tmdbId || s.id === Number(tmdbId));
      if (!series) {
        return {
          id: tmdbId,
          title: (activity as any).itemTitle || 'Unbekannte Serie',
          poster: (activity as any).posterPath || (activity as any).poster,
        };
      }
      return series;
    } else {
      const movie = movieList.find((m) => m.id === tmdbId || m.id === Number(tmdbId));
      if (!movie) {
        return {
          id: tmdbId,
          title: (activity as any).itemTitle || 'Unbekannter Film',
          poster: (activity as any).posterPath || (activity as any).poster,
        };
      }
      return movie;
    }
  };

  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';

    let path: string;
    if (typeof posterObj === 'object' && posterObj.poster) {
      path = posterObj.poster;
    } else if (typeof posterObj === 'string') {
      path = posterObj;
    } else {
      return '/placeholder.jpg';
    }

    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
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
          (activity as any).itemType === 'movie'
      );
    } else if (filterType === 'series') {
      filtered = filtered.filter(
        (activity) =>
          activity.type === 'series_added' ||
          activity.type === 'series_rated' ||
          activity.type === 'rating_updated' ||
          activity.type === 'series_added_to_watchlist' ||
          ((activity as any).itemType === 'series' ||
            (!(activity as any).itemType &&
              activity.type !== 'movie_added' &&
              activity.type !== 'movie_rated' &&
              activity.type !== 'rating_updated_movie'))
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

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey || friendActivities.length === 0) return;

    const fetchMissingPosters = async () => {
      const postersToFetch: { id: string; type: 'series' | 'movie' }[] = [];

      for (const activity of friendActivities) {
        const tmdbId = (activity as any).tmdbId || (activity as any).itemId;
        const itemType = (activity as any).itemType;

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

        if ((activity as any).posterPath || (activity as any).poster) continue;

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

  // Calculate badge counts once to avoid recalculation in render
  const unreadDiscussionsCount = discussionNotifications.filter((n) => !n.read).length;

  const tabs = [
    {
      id: 'activity' as const,
      icon: <Timeline style={{ fontSize: '20px' }} />,
      label: 'Feed',
      badge: unreadActivitiesCount > 0 && activeTab !== 'activity',
    },
    { id: 'friends' as const, icon: <Group style={{ fontSize: '20px' }} />, label: 'Freunde' },
    {
      id: 'requests' as const,
      icon: <MailOutline style={{ fontSize: '20px' }} />,
      label: 'Anfragen',
      // Only show badge if there are unread requests
      badgeCount: unreadRequestsCount > 0 ? unreadRequestsCount : undefined,
    },
    {
      id: 'discussions' as const,
      icon: <ChatBubbleOutline style={{ fontSize: '20px' }} />,
      label: 'Chat',
      // Only show badge if there are unread discussions
      badgeCount: unreadDiscussionsCount > 0 ? unreadDiscussionsCount : undefined,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
        paddingBottom: '100px',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, #8b5cf620, transparent)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        style={{
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}ee`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <BackButton />
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                margin: 0,
                background: `linear-gradient(135deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Aktivität
            </h1>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddFriend(true)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
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
            <PersonAdd style={{ fontSize: '22px' }} />
          </motion.button>
        </motion.div>
      </header>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex',
          margin: '0 20px 20px',
          gap: '8px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px 8px',
              background:
                activeTab === tab.id
                  ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                  : currentTheme.background.surface,
              border: activeTab === tab.id ? 'none' : `1px solid ${currentTheme.border.default}`,
              borderRadius: '14px',
              color: activeTab === tab.id ? 'white' : currentTheme.text.secondary,
              cursor: 'pointer',
              position: 'relative',
              boxShadow: activeTab === tab.id ? `0 4px 15px ${currentTheme.primary}40` : 'none',
            }}
          >
            <div style={{ position: 'relative', display: 'flex' }}>
              {tab.icon}
              {tab.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    width: '8px',
                    height: '8px',
                    background: activeTab === tab.id ? 'white' : currentTheme.status.error,
                    borderRadius: '50%',
                  }}
                />
              )}
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    background: activeTab === tab.id ? 'white' : currentTheme.status.error,
                    color: activeTab === tab.id ? currentTheme.primary : 'white',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tab.badgeCount}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[
                  { key: 'all', label: 'Alle' },
                  { key: 'series', label: 'Serien' },
                  { key: 'movies', label: 'Filme' },
                ].map((filter) => (
                  <motion.button
                    key={filter.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilterType(filter.key as any)}
                    style={{
                      padding: '10px 18px',
                      background:
                        filterType === filter.key
                          ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                          : currentTheme.background.surface,
                      border:
                        filterType === filter.key
                          ? 'none'
                          : `1px solid ${currentTheme.border.default}`,
                      borderRadius: '20px',
                      color: filterType === filter.key ? 'white' : currentTheme.text.primary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow:
                        filterType === filter.key ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                    }}
                  >
                    {filter.label}
                  </motion.button>
                ))}
              </div>

              {/* Activities List */}
              {groupedActivities.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 20px',
                      borderRadius: '50%',
                      background: `${currentTheme.text.muted}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Timeline style={{ fontSize: '40px', color: currentTheme.text.muted }} />
                  </div>
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                    }}
                  >
                    Noch keine Aktivitäten
                  </h3>
                  <p style={{ margin: 0, color: currentTheme.text.muted, fontSize: '14px' }}>
                    {filterType !== 'all'
                      ? `Keine ${filterType === 'movies' ? 'Film' : 'Serien'}-Aktivitäten`
                      : 'Deine Freunde haben noch nichts geteilt'}
                  </p>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {groupedActivities.map(([userId, activities], groupIndex) => {
                    const friendObj = friends.find((f) => f.uid === userId);
                    const userProfile = friendObj ? friendProfiles[friendObj.uid] || friendObj : null;
                    const isExpanded = expandedUsers.has(userId);
                    const latestActivity = activities[0];

                    return (
                      <motion.div
                        key={userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.05 }}
                        style={{
                          background: currentTheme.background.surface,
                          borderRadius: '16px',
                          border: `1px solid ${currentTheme.border.default}`,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Accordion Header */}
                        <motion.button
                          whileTap={{ scale: 0.99 }}
                          onClick={() => toggleUserExpanded(userId)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              ...(userProfile?.photoURL
                                ? {
                                    backgroundImage: `url("${userProfile.photoURL}")`,
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover',
                                  }
                                : {
                                    background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                                  }),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {!userProfile?.photoURL && (
                              <Person style={{ fontSize: '24px', color: 'white' }} />
                            )}
                          </div>

                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div
                              style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: currentTheme.text.primary,
                                marginBottom: '4px',
                              }}
                            >
                              {userProfile?.displayName || latestActivity.userName || 'Unbekannt'}
                            </div>
                            <div
                              style={{
                                fontSize: '13px',
                                color: currentTheme.text.secondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <span>
                                {activities.length}{' '}
                                {activities.length === 1 ? 'Aktivität' : 'Aktivitäten'}
                              </span>
                              <span>·</span>
                              <span>{formatTimeAgo(latestActivity.timestamp)}</span>
                            </div>
                          </div>

                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ color: currentTheme.text.secondary }}
                          >
                            <ExpandMore />
                          </motion.div>
                        </motion.button>

                        {/* Accordion Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{
                                borderTop: `1px solid ${currentTheme.border.default}`,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  padding: '12px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                {activities.map((activity) => {
                                  const item = getItemDetails(activity);
                                  const isMovie =
                                    activity.type === 'movie_added' ||
                                    activity.type === 'movie_rated' ||
                                    activity.type === 'rating_updated_movie' ||
                                    (activity as any).itemType === 'movie';
                                  const rating = (activity as any).rating;
                                  const hasRating = rating && rating > 0;
                                  const isAdded =
                                    activity.type === 'movie_added' ||
                                    activity.type === 'series_added';
                                  const isRated =
                                    activity.type === 'movie_rated' ||
                                    activity.type === 'series_rated' ||
                                    activity.type === 'rating_updated_movie' ||
                                    activity.type === 'rating_updated';
                                  const isWatchlisted =
                                    activity.type === 'series_added_to_watchlist' ||
                                    activity.type === 'movie_added_to_watchlist';

                                  const tmdbId =
                                    (activity as any).tmdbId || (activity as any).itemId;
                                  const itemType = (activity as any).itemType;
                                  const cacheKey = `${itemType}_${tmdbId}`;
                                  const tmdbPoster = tmdbPosters[cacheKey];
                                  const posterUrl = tmdbPoster
                                    ? `https://image.tmdb.org/t/p/w342${tmdbPoster}`
                                    : getImageUrl(item?.poster);

                                  return (
                                    <motion.div
                                      key={activity.id}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        if (tmdbId) {
                                          navigate(isMovie ? `/movie/${tmdbId}` : `/series/${tmdbId}`);
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        gap: '12px',
                                        padding: '12px',
                                        background: currentTheme.background.default,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {posterUrl && posterUrl !== '/placeholder.jpg' && (
                                        <div
                                          style={{
                                            width: '55px',
                                            height: '82px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                          }}
                                        >
                                          <img
                                            src={posterUrl}
                                            alt={item?.title || (activity as any).itemTitle}
                                            style={{
                                              width: '100%',
                                              height: '100%',
                                              objectFit: 'cover',
                                            }}
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      )}

                                      <div
                                        style={{
                                          flex: 1,
                                          minWidth: 0,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '6px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                          }}
                                        >
                                          {isMovie ? (
                                            <MovieIcon
                                              style={{
                                                fontSize: '16px',
                                                color: currentTheme.status.error,
                                              }}
                                            />
                                          ) : (
                                            <TvIcon
                                              style={{
                                                fontSize: '16px',
                                                color: currentTheme.primary,
                                              }}
                                            />
                                          )}
                                          <span
                                            style={{
                                              fontSize: '14px',
                                              fontWeight: 600,
                                              color: currentTheme.text.primary,
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}
                                          >
                                            {(activity as any).itemTitle ||
                                              item?.title ||
                                              'Unbekannt'}
                                          </span>
                                        </div>

                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: '12px',
                                              color: currentTheme.text.secondary,
                                            }}
                                          >
                                            {isAdded
                                              ? 'Hinzugefügt'
                                              : isWatchlisted
                                                ? 'Auf Watchlist'
                                                : isRated || hasRating
                                                  ? 'Bewertet'
                                                  : 'Aktivität'}
                                          </span>
                                          {hasRating && (
                                            <div
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                padding: '2px 8px',
                                                background: `${currentTheme.status.warning}20`,
                                                borderRadius: '10px',
                                              }}
                                            >
                                              <Star
                                                style={{
                                                  fontSize: '12px',
                                                  color: currentTheme.status.warning,
                                                }}
                                              />
                                              <span
                                                style={{
                                                  fontSize: '11px',
                                                  fontWeight: 700,
                                                  color: currentTheme.status.warning,
                                                }}
                                              >
                                                {rating}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        <span
                                          style={{
                                            fontSize: '11px',
                                            color: currentTheme.text.muted,
                                          }}
                                        >
                                          {formatTimeAgo(activity.timestamp)}
                                        </span>
                                      </div>
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
              )}
            </motion.div>
          )}

          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {friends.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', padding: '60px 20px' }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 20px',
                      borderRadius: '50%',
                      background: `${currentTheme.text.muted}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person style={{ fontSize: '40px', color: currentTheme.text.muted }} />
                  </div>
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                    }}
                  >
                    Noch keine Freunde
                  </h3>
                  <p
                    style={{ margin: '0 0 20px', color: currentTheme.text.muted, fontSize: '14px' }}
                  >
                    Füge Freunde hinzu um ihre Aktivitäten zu sehen
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddFriend(true)}
                    style={{
                      padding: '12px 24px',
                      background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: `0 4px 15px ${currentTheme.primary}40`,
                    }}
                  >
                    Freund hinzufügen
                  </motion.button>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {friends.map((friend, index) => {
                    const currentProfile = friendProfiles[friend.uid] || friend;
                    return (
                      <motion.button
                        key={friend.uid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/friend/${friend.uid}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px',
                          background: currentTheme.background.surface,
                          border: `1px solid ${currentTheme.border.default}`,
                          borderRadius: '14px',
                          color: currentTheme.text.primary,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            ...(currentProfile.photoURL
                              ? {
                                  backgroundImage: `url("${currentProfile.photoURL}")`,
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                }
                              : {
                                  background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                                }),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {!currentProfile.photoURL && (
                            <Person style={{ fontSize: '24px', color: 'white' }} />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              fontSize: '15px',
                              fontWeight: 600,
                              margin: '0 0 4px 0',
                            }}
                          >
                            {currentProfile.displayName || currentProfile.username}
                          </h4>
                          <p
                            style={{
                              fontSize: '13px',
                              color: currentTheme.text.muted,
                              margin: 0,
                            }}
                          >
                            @{currentProfile.username}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {friendRequests.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: currentTheme.text.muted,
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Eingehende Anfragen
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {friendRequests.map((request, index) => {
                      const requestProfile = requestProfiles[request.fromUserId] || {};
                      return (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px',
                            background: `linear-gradient(135deg, ${currentTheme.primary}10, ${currentTheme.primary}05)`,
                            border: `1px solid ${currentTheme.primary}30`,
                            borderRadius: '14px',
                          }}
                        >
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              ...(requestProfile.photoURL
                                ? {
                                    backgroundImage: `url("${requestProfile.photoURL}")`,
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover',
                                  }
                                : {
                                    background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                                  }),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {!requestProfile.photoURL && (
                              <Person style={{ fontSize: '22px', color: 'white' }} />
                            )}
                          </div>

                          <div style={{ flex: 1 }}>
                            <h4
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                margin: 0,
                                color: currentTheme.text.primary,
                              }}
                            >
                              {requestProfile.displayName || request.fromUsername}
                            </h4>
                            <p
                              style={{
                                fontSize: '12px',
                                color: currentTheme.text.muted,
                                margin: 0,
                              }}
                            >
                              {formatTimeAgo((request as any).timestamp || Date.now())}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => acceptFriendRequest(request.id)}
                              style={{
                                padding: '10px',
                                background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                cursor: 'pointer',
                              }}
                            >
                              <CheckCircle style={{ fontSize: '20px' }} />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => declineFriendRequest(request.id)}
                              style={{
                                padding: '10px',
                                background: `linear-gradient(135deg, ${currentTheme.status.error}, #ef4444)`,
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                cursor: 'pointer',
                              }}
                            >
                              <Cancel style={{ fontSize: '20px' }} />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {sentRequests.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: currentTheme.text.muted,
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Gesendete Anfragen
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sentRequests.map((request) => (
                      <div
                        key={request.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px',
                          background: currentTheme.background.surface,
                          border: `1px solid ${currentTheme.border.default}`,
                          borderRadius: '14px',
                        }}
                      >
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: `${currentTheme.text.muted}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Person style={{ fontSize: '22px', color: currentTheme.text.muted }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              margin: 0,
                              color: currentTheme.text.primary,
                            }}
                          >
                            {request.toUsername}
                          </h4>
                          <p
                            style={{
                              fontSize: '12px',
                              color: currentTheme.text.muted,
                              margin: 0,
                            }}
                          >
                            Ausstehend
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => cancelFriendRequest(request.id)}
                          style={{
                            padding: '10px',
                            background: currentTheme.background.default,
                            border: `1px solid ${currentTheme.border.default}`,
                            borderRadius: '10px',
                            color: currentTheme.text.secondary,
                            cursor: 'pointer',
                          }}
                        >
                          <Cancel style={{ fontSize: '20px' }} />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {friendRequests.length === 0 && sentRequests.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', padding: '60px 20px' }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 20px',
                      borderRadius: '50%',
                      background: `${currentTheme.text.muted}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PersonAdd style={{ fontSize: '40px', color: currentTheme.text.muted }} />
                  </div>
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                    }}
                  >
                    Keine offenen Anfragen
                  </h3>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'discussions' && (
            <motion.div
              key="discussions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {discussionNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', padding: '60px 20px' }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 20px',
                      borderRadius: '50%',
                      background: `${currentTheme.text.muted}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChatBubbleOutline
                      style={{ fontSize: '40px', color: currentTheme.text.muted }}
                    />
                  </div>
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                    }}
                  >
                    Keine Benachrichtigungen
                  </h3>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {discussionNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.data?.discussionPath && notification.data?.discussionId) {
                          const path = notification.data.discussionPath as string;
                          if (path.includes('episode/')) {
                            const match = path.match(/episode\/(\d+)_s(\d+)_e(\d+)/);
                            if (match) {
                              navigate(`/episode/${match[1]}/s/${match[2]}/e/${match[3]}`);
                              return;
                            }
                          }
                          if (notification.data.itemType && notification.data.itemId) {
                            navigate(`/${notification.data.itemType}/${notification.data.itemId}`);
                          }
                        }
                      }}
                      style={{
                        padding: '16px',
                        background: notification.read
                          ? currentTheme.background.surface
                          : `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.primary}08)`,
                        border: `1px solid ${notification.read ? currentTheme.border.default : currentTheme.primary}40`,
                        borderRadius: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background:
                              notification.type === 'discussion_reply'
                                ? `${currentTheme.primary}20`
                                : notification.type === 'spoiler_flag'
                                  ? `${currentTheme.status.warning}20`
                                  : '#ff6b6b20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {notification.type === 'discussion_reply' ? (
                            <ChatBubbleOutline
                              style={{ color: currentTheme.primary, fontSize: '20px' }}
                            />
                          ) : notification.type === 'spoiler_flag' ? (
                            <Flag style={{ color: currentTheme.status.warning, fontSize: '20px' }} />
                          ) : (
                            <Favorite style={{ color: '#ff6b6b', fontSize: '20px' }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              margin: '0 0 4px 0',
                              color: currentTheme.text.primary,
                            }}
                          >
                            {notification.title}
                          </h4>
                          <p
                            style={{
                              fontSize: '13px',
                              margin: 0,
                              color: currentTheme.text.secondary,
                            }}
                          >
                            {notification.message}
                          </p>
                          <p
                            style={{
                              fontSize: '11px',
                              margin: '8px 0 0 0',
                              color: currentTheme.text.muted,
                            }}
                          >
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: currentTheme.primary,
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddFriendDialog isOpen={showAddFriend} onClose={() => setShowAddFriend(false)} />
    </div>
  );
};
