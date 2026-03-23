/**
 * DiscussionsTab - Discussion notifications list
 */

import { ChatBubbleOutline, Favorite, Flag } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useActivityGrouping } from '../useActivityGrouping';

interface DiscussionNotification {
  id: string;
  type: 'discussion_reply' | 'discussion_like' | 'spoiler_flag' | string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
}

interface DiscussionsTabProps {
  notifications: DiscussionNotification[];
  markAsRead: (id: string) => void;
}

export const DiscussionsTab = ({ notifications, markAsRead }: DiscussionsTabProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { formatTimeAgo } = useActivityGrouping([]);

  const handleNotificationClick = (notification: DiscussionNotification) => {
    markAsRead(notification.id);
    if (notification.data?.discussionPath) {
      const path = notification.data.discussionPath as string;
      // Path format: "discussions/{itemType}/{itemId}" or "discussions/episode/{itemId}_s{season}_e{episode}"
      if (path.includes('episode/')) {
        const match = path.match(/episode\/(\d+)_s(\d+)_e(\d+)/);
        if (match) {
          navigate(`/episode/${match[1]}/s/${match[2]}/e/${match[3]}`);
          return;
        }
      }
      // Extract itemType and itemId from path for series/movie
      const pathMatch = path.match(/discussions\/(series|movie)\/(\d+)/);
      if (pathMatch) {
        navigate(`/${pathMatch[1]}/${pathMatch[2]}`);
        return;
      }
      // Fallback to notification data if available
      if (notification.data.itemType && notification.data.itemId) {
        navigate(`/${notification.data.itemType}/${notification.data.itemId}`);
      }
    }
  };

  return (
    <motion.div
      key="discussions"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {notifications.length === 0 ? (
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
            <ChatBubbleOutline style={{ fontSize: '40px', color: currentTheme.text.muted }} />
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '18px',
              fontWeight: 700,
              color: currentTheme.text.primary,
            }}
          >
            Keine Benachrichtigungen
          </h2>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNotificationClick(notification)}
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
                          : `${currentTheme.status?.error || '#ff6b6b'}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {notification.type === 'discussion_reply' ? (
                    <ChatBubbleOutline style={{ color: currentTheme.primary, fontSize: '20px' }} />
                  ) : notification.type === 'spoiler_flag' ? (
                    <Flag style={{ color: currentTheme.status.warning, fontSize: '20px' }} />
                  ) : (
                    <Favorite
                      style={{ color: currentTheme.status?.error || '#ff6b6b', fontSize: '20px' }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      margin: '0 0 4px 0',
                      color: currentTheme.text.primary,
                    }}
                  >
                    {notification.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      margin: 0,
                      color: currentTheme.text.secondary,
                    }}
                  >
                    {notification.message}
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
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
  );
};
