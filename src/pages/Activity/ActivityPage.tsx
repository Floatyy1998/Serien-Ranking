/**
 * ActivityPage - Social Activity Feed
 * Composition component using extracted tab subcomponents
 */

import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import Group from '@mui/icons-material/Group';
import MailOutline from '@mui/icons-material/MailOutline';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Timeline from '@mui/icons-material/Timeline';
import { Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { BackButton, GradientText, IconContainer, ScrollToTopButton } from '../../components/ui';
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

  const unreadDiscussionsCount = discussionNotifications.filter((n) => !n.read).length;

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

  const isActive = (id: TabId) => activeTab === id;

  return (
    <div className="activity-page" style={{ background: currentTheme.background.default }}>
      {/* Decorative Background */}
      <div
        className="activity-bg"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, var(--theme-secondary-gradient-20, rgba(139, 92, 246, 0.12)), transparent)
          `,
        }}
      />

      {/* Header */}
      <header
        className="activity-header"
        style={{
          background: `${currentTheme.background.default}ee`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="activity-header__row"
        >
          <div className="activity-header__left">
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
              onClick={() => setShowAddFriend(true)}
              className="activity-add-btn"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
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
        className="activity-tabs"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className="activity-tab"
            style={{
              background: isActive(tab.id)
                ? `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`
                : currentTheme.background.surface,
              border: isActive(tab.id) ? 'none' : `1px solid ${currentTheme.border.default}`,
              color: isActive(tab.id) ? 'white' : currentTheme.text.secondary,
              boxShadow: isActive(tab.id) ? `0 4px 15px ${currentTheme.primary}40` : 'none',
            }}
          >
            <div className="activity-tab__icon-wrap">
              {tab.icon}
              {tab.badge && (
                <span
                  className="activity-tab__badge-dot"
                  style={{
                    background: isActive(tab.id) ? 'white' : currentTheme.status.error,
                  }}
                />
              )}
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <span
                  className="activity-tab__badge-count"
                  style={{
                    background: isActive(tab.id) ? 'white' : currentTheme.status.error,
                    color: isActive(tab.id) ? currentTheme.primary : 'white',
                  }}
                >
                  {tab.badgeCount}
                </span>
              )}
            </div>
            <span className="activity-tab__label">{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Discussion Feed Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={() => navigate('/discussions')}
        className="activity-banner"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}20, var(--theme-secondary-gradient-20, rgba(139, 92, 246, 0.12)))`,
          border: `1px solid ${currentTheme.primary}30`,
        }}
      >
        <IconContainer
          color={currentTheme.primary}
          secondaryColor="var(--theme-secondary-gradient, #8b5cf6)"
          size={42}
        >
          <ChatBubbleOutline style={{ fontSize: '22px', color: 'white' }} />
        </IconContainer>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="activity-banner__text-title" style={{ color: currentTheme.text.primary }}>
            Diskussions-Feed
          </div>
          <div className="activity-banner__text-sub" style={{ color: currentTheme.text.muted }}>
            Alle Diskussionen an einem Ort
          </div>
        </div>

        <div className="activity-banner__arrow" style={{ color: currentTheme.text.muted }}>
          ›
        </div>
      </motion.div>

      {/* Tab Content */}
      <div className="activity-content">
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
