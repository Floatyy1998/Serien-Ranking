/**
 * ActivityPage - Social Activity Feed
 * Composition component using extracted tab subcomponents
 */

import { ChatBubbleOutline, Group, MailOutline, PersonAdd, Timeline } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { trackActivityTabSwitched, trackAddFriendDialogOpened } from '../../firebase/analytics';
import { BackButton, GradientText, ScrollToTopButton } from '../../components/ui';
import { AddFriendDialog } from './AddFriendDialog';
import { RemoveFriendSheet } from './RemoveFriendSheet';
import { ActivityFeedTab } from './tabs/ActivityFeedTab';
import { DiscussionsTab } from './tabs/DiscussionsTab';
import { FriendsTab } from './tabs/FriendsTab';
import { RequestsTab } from './tabs/RequestsTab';
import { useActivityFriendProfiles } from './useActivityFriendProfiles';
import './ActivityPage.css';

type TabId = 'activity' | 'friends' | 'requests' | 'discussions';

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
    removeFriend,
  } = useOptimizedFriends();

  const { notifications, markAsRead } = useNotifications();

  const discussionNotifications = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.type === 'discussion_reply' || n.type === 'discussion_like' || n.type === 'spoiler_flag'
      ),
    [notifications]
  );

  const [activeTab, setActiveTab] = useState<TabId>('activity');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<{ uid: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  // Scroll position management
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    if (scrollRestoredRef.current) return;
    scrollRestoredRef.current = true;

    const savedPosition = sessionStorage.getItem('activity-scroll');
    if (savedPosition) {
      const pos = parseInt(savedPosition, 10);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = document.querySelector('.mobile-content') as HTMLElement;
          if (container) container.scrollTo({ top: pos });
        });
      });
    }
  }, []);

  const saveScrollPosition = useCallback(() => {
    const container = document.querySelector('.mobile-content') as HTMLElement;
    if (container && container.scrollTop > 0) {
      sessionStorage.setItem('activity-scroll', String(container.scrollTop));
    }
  }, []);

  const { friendProfiles, requestProfiles } = useActivityFriendProfiles(friends, friendRequests);

  // Badge counts
  const unreadDiscussionsCount = discussionNotifications.filter((n) => !n.read).length;

  // Mark as read on tab switch
  useEffect(() => {
    if (activeTab === 'activity' && unreadActivitiesCount > 0) {
      markActivitiesAsRead();
    } else if (activeTab === 'requests' && unreadRequestsCount > 0) {
      markRequestsAsRead();
    } else if (activeTab === 'discussions' && unreadDiscussionsCount > 0) {
      discussionNotifications.filter((n) => !n.read).forEach((n) => markAsRead(n.id));
    }
  }, [activeTab, unreadActivitiesCount, unreadRequestsCount, unreadDiscussionsCount]);

  const handleRemoveFriend = useCallback(
    async (uid: string) => {
      setRemoving(true);
      try {
        await removeFriend(uid);
      } catch (error) {
        console.error('Failed to remove friend:', error);
      } finally {
        setRemoving(false);
        setFriendToRemove(null);
      }
    },
    [removeFriend]
  );

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
      badgeCount: unreadRequestsCount > 0 ? unreadRequestsCount : undefined,
    },
    {
      id: 'discussions' as const,
      icon: <ChatBubbleOutline style={{ fontSize: '20px' }} />,
      label: 'Chat',
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
            radial-gradient(ellipse 60% 40% at 80% 10%, var(--theme-secondary-gradient-20, rgba(139, 92, 246, 0.12)), transparent)
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
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <BackButton />
            <GradientText
              as="h1"
              from={currentTheme.text.primary}
              to={currentTheme.primary}
              style={{
                fontSize: '26px',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                margin: 0,
              }}
            >
              Aktivität
            </GradientText>
          </div>

          <Tooltip title="Freund hinzufügen" arrow>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowAddFriend(true);
                trackAddFriendDialogOpened();
              }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: currentTheme.shadow.card,
              }}
            >
              <PersonAdd style={{ fontSize: '22px' }} />
            </motion.button>
          </Tooltip>
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
            onClick={() => {
              setActiveTab(tab.id);
              trackActivityTabSwitched(tab.id);
            }}
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
                  ? `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`
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
                    fontSize: '11px',
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
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{tab.label}</span>
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
          background: `linear-gradient(135deg, ${currentTheme.primary}20, var(--theme-secondary-gradient-20, rgba(139, 92, 246, 0.12)))`,
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
            background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
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
          <div style={{ fontSize: '13px', color: currentTheme.text.muted, marginTop: '2px' }}>
            Alle Diskussionen an einem Ort
          </div>
        </div>
        <div style={{ color: currentTheme.text.muted, fontSize: '20px' }}>›</div>
      </motion.div>

      {/* Tab Content */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'activity' && (
            <ActivityFeedTab
              friendActivities={friendActivities}
              friends={friends}
              friendProfiles={friendProfiles}
              saveScrollPosition={saveScrollPosition}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsTab
              friends={friends}
              friendProfiles={friendProfiles}
              saveScrollPosition={saveScrollPosition}
              onAddFriend={() => setShowAddFriend(true)}
              onRemoveFriend={setFriendToRemove}
            />
          )}

          {activeTab === 'requests' && (
            <RequestsTab
              friendRequests={friendRequests}
              sentRequests={sentRequests}
              requestProfiles={requestProfiles}
              acceptFriendRequest={acceptFriendRequest}
              declineFriendRequest={declineFriendRequest}
              cancelFriendRequest={cancelFriendRequest}
            />
          )}

          {activeTab === 'discussions' && (
            <DiscussionsTab notifications={discussionNotifications} markAsRead={markAsRead} />
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <AddFriendDialog isOpen={showAddFriend} onClose={() => setShowAddFriend(false)} />
      <RemoveFriendSheet
        friend={friendToRemove}
        onConfirm={handleRemoveFriend}
        onClose={() => setFriendToRemove(null)}
        isRemoving={removing}
      />
      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </div>
  );
};
