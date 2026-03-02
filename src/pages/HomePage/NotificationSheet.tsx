import {
  Cancel,
  ChatBubbleOutline,
  Check,
  DoneAll,
  Favorite,
  Flag,
  Group,
  Movie as MovieIcon,
  NewReleases,
  Notifications,
  PersonAdd,
  PlayCircle,
  Star,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import type { UnifiedNotification } from './useUnifiedNotifications';
import { formatNotificationTime } from './useUnifiedNotifications';

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UnifiedNotification[];
  onMarkAllRead: () => void;
  onMarkAsRead: (id: string) => void;
  onDismissAnnouncement: (id: string) => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
}

const ICON_MAP: Record<
  string,
  (theme: ReturnType<typeof useTheme>['currentTheme']) => React.ReactNode
> = {
  tv: (t) => <Tv style={{ fontSize: '18px', color: t.primary }} />,
  movie: (t) => <MovieIcon style={{ fontSize: '18px', color: t.status.error }} />,
  star: (t) => <Star style={{ fontSize: '18px', color: t.status.warning }} />,
  watchlist: (t) => <PlayCircle style={{ fontSize: '18px', color: t.primary }} />,
  person: (t) => <PersonAdd style={{ fontSize: '18px', color: t.status.success }} />,
  chat: (t) => <ChatBubbleOutline style={{ fontSize: '18px', color: t.primary }} />,
  heart: () => <Favorite style={{ fontSize: '18px', color: '#ff6b6b' }} />,
  flag: (t) => <Flag style={{ fontSize: '18px', color: t.status.warning }} />,
  announcement: () => <NewReleases style={{ fontSize: '18px', color: '#a855f7' }} />,
};

const ICON_BG_MAP: Record<string, (t: ReturnType<typeof useTheme>['currentTheme']) => string> = {
  person: (t) => `linear-gradient(135deg, ${t.status.success}20, ${t.status.success}08)`,
  star: (t) => `linear-gradient(135deg, ${t.status.warning}20, ${t.status.warning}08)`,
  heart: () => 'linear-gradient(135deg, #ff6b6b20, #ff6b6b08)',
  flag: (t) => `linear-gradient(135deg, ${t.status.warning}20, ${t.status.warning}08)`,
  movie: (t) => `linear-gradient(135deg, ${t.status.error}20, ${t.status.error}08)`,
  announcement: () => 'linear-gradient(135deg, #a855f720, #a855f708)',
};

export const NotificationSheet = React.memo(function NotificationSheet({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkAsRead,
  onDismissAnnouncement,
  onAcceptRequest,
  onDeclineRequest,
}: NotificationSheetProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const getIcon = (icon: string) => {
    const factory = ICON_MAP[icon];
    return factory ? (
      factory(currentTheme)
    ) : (
      <Notifications style={{ fontSize: '18px', color: currentTheme.text.muted }} />
    );
  };

  const getIconBg = (icon: string) => {
    const factory = ICON_BG_MAP[icon];
    return factory
      ? factory(currentTheme)
      : `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.primary}08)`;
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="75vh"
      ariaLabel="Benachrichtigungen"
      bottomOffset="calc(90px + env(safe-area-inset-bottom))"
    >
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '0 20px 16px', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              background: `radial-gradient(ellipse 80% 100% at 50% -30%, ${currentTheme.primary}15, transparent)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <div>
              <h2
                style={{
                  margin: '0 0 2px',
                  fontSize: '20px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  background: `linear-gradient(135deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Benachrichtigungen
              </h2>
              {notifications.length > 0 && (
                <span style={{ fontSize: '13px', color: currentTheme.text.muted }}>
                  {notifications.filter((n) => !n.read).length > 0
                    ? `${notifications.filter((n) => !n.read).length} ungelesen`
                    : 'Alles gelesen'}
                </span>
              )}
            </div>
            {notifications.some((n) => !n.read) && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onMarkAllRead}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow:
                    '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
                }}
              >
                <DoneAll style={{ fontSize: '20px' }} />
              </motion.button>
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: `${currentTheme.text.muted}10`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Notifications style={{ fontSize: '36px', color: currentTheme.text.muted }} />
              </div>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: '16px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: currentTheme.text.primary,
                }}
              >
                Alles ruhig hier
              </h3>
              <p style={{ color: currentTheme.text.muted, fontSize: '14px', margin: 0 }}>
                Keine neuen Benachrichtigungen
              </p>
            </div>
          ) : (
            <div style={{ padding: '0 12px' }}>
              {notifications.map((item, index) => (
                <motion.div
                  key={item.id}
                  whileTap={item.kind !== 'request' ? { scale: 0.98 } : undefined}
                  onClick={() => {
                    if (item.kind === 'request') return;
                    if (item.kind === 'discussion' && item.notificationId) {
                      onMarkAsRead(item.notificationId);
                    }
                    if (item.kind === 'announcement') {
                      onDismissAnnouncement(item.id);
                    }
                    if (item.navigateTo) {
                      onClose();
                      navigate(item.navigateTo);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 8px',
                    cursor: item.kind !== 'request' && item.navigateTo ? 'pointer' : 'default',
                    borderBottom:
                      index < notifications.length - 1
                        ? `1px solid ${currentTheme.border.default}40`
                        : 'none',
                    position: 'relative',
                    background: !item.read ? `${currentTheme.primary}08` : 'transparent',
                    borderRadius: '12px',
                    marginBottom: index < notifications.length - 1 ? '2px' : 0,
                  }}
                >
                  {/* Unread bar */}
                  {!item.read && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '14px',
                        bottom: '14px',
                        width: '3px',
                        borderRadius: '2px',
                        background: `linear-gradient(180deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      background: getIconBg(item.icon),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getIcon(item.icon)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                        marginBottom: '3px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: !item.read ? 700 : 600,
                          color: currentTheme.text.primary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: !item.read ? currentTheme.primary : currentTheme.text.muted,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {formatNotificationTime(item.timestamp)}
                        {!item.read && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: !item.read ? currentTheme.text.secondary : currentTheme.text.muted,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.message}
                    </div>

                    {/* Request actions */}
                    {item.kind === 'request' && item.requestId && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAcceptRequest(item.requestId!);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow:
                              '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          <Check style={{ fontSize: '16px' }} />
                          Annehmen
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeclineRequest(item.requestId!);
                          }}
                          style={{
                            padding: '8px 16px',
                            background: currentTheme.background.default,
                            border: `1px solid ${currentTheme.border.default}`,
                            borderRadius: '12px',
                            color: currentTheme.text.secondary,
                            fontSize: '14px',
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

          {/* Footer */}
          <div style={{ padding: '8px 16px 20px' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                onClose();
                navigate('/activity');
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: `linear-gradient(135deg, ${currentTheme.primary}12, rgba(139, 92, 246, 0.07))`,
                border: `1px solid ${currentTheme.primary}25`,
                borderRadius: '14px',
                color: currentTheme.primary,
                fontSize: '15px',
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
  );
});
