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
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { BackButton, GradientText } from '../../components/ui';
import { AddFriendDialog } from './AddFriendDialog';
import { useActivityFriendProfiles } from './useActivityFriendProfiles';
import { useActivityGrouping } from './useActivityGrouping';
import type { ActivityFilterType } from './types';
import './ActivityPage.css';

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
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const { friendProfiles, requestProfiles } = useActivityFriendProfiles(friends, friendRequests);
  const {
    groupedActivities,
    getItemDetails,
    formatTimeAgo,
    filterType,
    setFilterType,
    getPosterUrl,
  } = useActivityGrouping(friendActivities);

  useEffect(() => {
    if (activeTab === 'activity' && unreadActivitiesCount > 0) {
      markActivitiesAsRead();
    } else if (activeTab === 'requests' && unreadRequestsCount > 0) {
      markRequestsAsRead();
    } else if (activeTab === 'discussions' && unreadDiscussionCount > 0) {
      markAllAsRead();
    }
  }, [activeTab, unreadActivitiesCount, unreadRequestsCount, unreadDiscussionCount]);

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
            <GradientText as="h1" from={currentTheme.text.primary} to={currentTheme.primary} style={{
                fontSize: '26px',
                fontWeight: 800,
                margin: 0,
              }}
            >
              Aktivität
            </GradientText>
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

      {/* Discussion Feed Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={() => navigate('/discussions')}
        style={{
          margin: '0 20px 16px',
          padding: '14px 18px',
          background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
          border: `1px solid ${currentTheme.primary}30`,
          borderRadius: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ChatBubbleOutline style={{ fontSize: '22px', color: 'white' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: currentTheme.text.primary }}>
            Diskussions-Feed
          </div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted, marginTop: '2px' }}>
            Alle Diskussionen an einem Ort
          </div>
        </div>
        <div style={{ color: currentTheme.text.muted, fontSize: '20px' }}>›</div>
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
                  <button
                    key={filter.key}
                    className="activity-filter-btn"
                    onClick={() => setFilterType(filter.key as ActivityFilterType)}
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
                  </button>
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
                  {groupedActivities.map(([userId, activities]) => {
                    const friendObj = friends.find((f) => f.uid === userId);
                    const userProfile = friendObj ? friendProfiles[friendObj.uid] || friendObj : null;
                    const isExpanded = expandedUsers.has(userId);
                    const latestActivity = activities[0];

                    return (
                      <div
                        key={userId}
                        className="activity-group-item"
                        style={{
                          background: currentTheme.background.surface,
                          borderRadius: '16px',
                          border: `1px solid ${currentTheme.border.default}`,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Accordion Header */}
                        <button
                          className="activity-accordion-btn"
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
                        </button>

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
                                    activity.itemType === 'movie';
                                  const rating = activity.rating;
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
                                    activity.tmdbId || activity.itemId;
                                  const posterUrl = getPosterUrl(activity);

                                  return (
                                    <div
                                      key={activity.id}
                                      className="activity-entry"
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
                                            alt={item?.title || activity.itemTitle}
                                            loading="lazy"
                                            decoding="async"
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
                                            {activity.itemTitle ||
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
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                              {formatTimeAgo(request.timestamp || request.sentAt || Date.now())}
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
