import { ChatBubbleOutlined, Favorite, Flag } from '@mui/icons-material';
import ForumRounded from '@mui/icons-material/ForumRounded';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { EmptyState } from '../../../components/ui';
import { useActivityGrouping } from '../useActivityGrouping';
import { tapScaleSmall } from '../../../lib/motion';
import { discussionTarget } from '../../../lib/url/discussionTarget';

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
    const target = discussionTarget(notification.data);
    if (target) navigate(target);
  };

  return (
    <motion.div
      key="discussions"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={<ForumRounded style={{ fontSize: 'inherit' }} />}
          title={t('Keine Benachrichtigungen')}
          description={t(
            'Antworten, Likes und Spoiler-Meldungen aus deinen Diskussionen erscheinen hier.'
          )}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileTap={tapScaleSmall}
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
                    <ChatBubbleOutlined style={{ color: currentTheme.primary, fontSize: '20px' }} />
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
