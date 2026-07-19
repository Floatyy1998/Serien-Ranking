import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import MarkEmailUnreadRounded from '@mui/icons-material/MarkEmailUnreadRounded';
import PersonAddRounded from '@mui/icons-material/PersonAddRounded';
import { Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollRestore } from '../../hooks/useScrollRestore';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { IconContainer, PageHeader, ScrollToTopButton } from '../../components/ui';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { AddFriendDialog } from './AddFriendDialog';
import { RemoveFriendSheet } from './RemoveFriendSheet';
import { ActivityFeedTab } from './tabs/ActivityFeedTab';
import { DiscussionsTab } from './tabs/DiscussionsTab';
import { FriendsTab } from './tabs/FriendsTab';
import { RequestsTab } from './tabs/RequestsTab';
import { useActivityFriendProfiles } from './useActivityFriendProfiles';
import './ActivityPage.css';
import { tapScaleTight } from '../../lib/motion';

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

  // Readable text/icon color for anything sitting on the bright primary gradient.
  const onPrimary = getOptimalTextColor(currentTheme.primary);

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

  const { saveNow: saveScrollPosition } = useScrollRestore('activity-scroll', '.mobile-content');

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
  }, [
    activeTab,
    unreadActivitiesCount,
    unreadRequestsCount,
    unreadDiscussionsCount,
    discussionNotifications,
    markActivitiesAsRead,
    markAsRead,
    markRequestsAsRead,
  ]);

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
      icon: <AutoAwesomeRounded style={{ fontSize: '21px' }} />,
      label: 'Feed',
      badge: unreadActivitiesCount > 0 && activeTab !== 'activity',
    },
    {
      id: 'friends' as const,
      icon: <GroupRounded style={{ fontSize: '21px' }} />,
      label: t('Freunde'),
    },
    {
      id: 'requests' as const,
      icon: <MarkEmailUnreadRounded style={{ fontSize: '21px' }} />,
      label: t('Anfragen'),
      badgeCount: unreadRequestsCount > 0 ? unreadRequestsCount : undefined,
    },
    {
      id: 'discussions' as const,
      icon: <ChatRoundedIcon style={{ fontSize: '21px' }} />,
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
            radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.accent}20, transparent)
          `,
        }}
      />

      {/* Header */}
      <PageHeader
        title={t('Aktivität')}
        subtitle={t('Was deine Freunde gerade schauen')}
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
        actions={
          <Tooltip title={t('Freund hinzufügen')} arrow>
            <motion.button
              whileTap={tapScaleTight}
              onClick={() => setShowAddFriend(true)}
              className="activity-add-btn"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                boxShadow: currentTheme.shadow.card,
                color: onPrimary,
              }}
            >
              <PersonAddRounded style={{ fontSize: '22px' }} />
            </motion.button>
          </Tooltip>
        }
      />

      {/* Nav — expanding pill tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="activity-nav"
        role="tablist"
      >
        {tabs.map((tab) => {
          const active = isActive(tab.id);
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
              onClick={() => setActiveTab(tab.id)}
              className={`activity-nav__tab${active ? ' is-active' : ''}`}
              style={{
                background: active
                  ? `color-mix(in srgb, ${currentTheme.primary} 18%, rgba(255, 255, 255, 0.04))`
                  : currentTheme.background.surface,
                border: `1px solid ${active ? `${currentTheme.primary}55` : currentTheme.border.default}`,
                color: active ? currentTheme.primary : currentTheme.text.muted,
                boxShadow: active ? `0 4px 18px ${currentTheme.primary}22` : 'none',
              }}
            >
              <span className="activity-nav__icon">
                {tab.icon}
                {tab.badge && (
                  <span
                    className="activity-nav__dot"
                    style={{
                      background: currentTheme.status.error,
                      boxShadow: `0 0 0 2px ${currentTheme.background.default}`,
                    }}
                  />
                )}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span
                    className="activity-nav__count"
                    style={{
                      background: currentTheme.status.error,
                      color: '#fff',
                      boxShadow: `0 0 0 2px ${currentTheme.background.default}`,
                    }}
                  >
                    {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
                  </span>
                )}
              </span>
              <span className="activity-nav__label">{tab.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Discussion Feed Banner (only on feed/chat tabs) */}
      <AnimatePresence initial={false}>
        {(activeTab === 'activity' || activeTab === 'discussions') && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              onClick={() => navigate('/discussions')}
              className="activity-banner"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}1f, ${currentTheme.accent}1f)`,
                border: `1px solid ${currentTheme.primary}33`,
              }}
            >
              <IconContainer
                color={currentTheme.primary}
                secondaryColor={currentTheme.accent}
                size={42}
              >
                <ChatBubbleOutline style={{ fontSize: '22px', color: '#fff' }} />
              </IconContainer>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="activity-banner__text-title"
                  style={{ color: currentTheme.text.secondary }}
                >
                  {t('Diskussions-Feed')}
                </div>
                <div
                  className="activity-banner__text-sub"
                  style={{ color: currentTheme.text.muted }}
                >
                  {t('Alle Diskussionen an einem Ort')}
                </div>
              </div>

              <div className="activity-banner__arrow" style={{ color: currentTheme.text.muted }}>
                ›
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
