import {
  BugReport,
  Cancel,
  ChatBubbleOutline,
  Check,
  DoneAll,
  Favorite,
  Flag,
  Group,
  Lightbulb,
  Movie as MovieIcon,
  NewReleases,
  Notifications,
  Person,
  Pets,
  PersonAdd,
  PlayCircle,
  Recommend,
  Send,
  Star,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getImageUrl } from '../../utils/imageUrl';
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
  onAcceptRecommendation: (recId: string) => void;
  onDeclineRecommendation: (recId: string) => void;
  onOpenCaseOpening?: (dropData: { dropId: string; accessoryId: string; rarity: string }) => void;
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
  heart: (t) => <Favorite style={{ fontSize: '18px', color: t.status?.error || '#ef4444' }} />,
  flag: (t) => <Flag style={{ fontSize: '18px', color: t.status.warning }} />,
  announcement: (t) => <NewReleases style={{ fontSize: '18px', color: t.accent }} />,
  bug: (t) => <BugReport style={{ fontSize: '18px', color: t.status.warning }} />,
  feature: (_t) => <Lightbulb style={{ fontSize: '18px', color: '#8b5cf6' }} />,
  pet: (_t) => <Pets style={{ fontSize: '18px', color: '#FF9800' }} />,
  recommendation: (t) => <Recommend style={{ fontSize: '18px', color: t.primary }} />,
};

const ICON_BG_MAP: Record<string, (t: ReturnType<typeof useTheme>['currentTheme']) => string> = {
  person: (t) => `linear-gradient(135deg, ${t.status.success}20, ${t.status.success}08)`,
  star: (t) => `linear-gradient(135deg, ${t.status.warning}20, ${t.status.warning}08)`,
  heart: (t) =>
    `linear-gradient(135deg, ${t.status?.error || '#ef4444'}20, ${t.status?.error || '#ef4444'}08)`,
  flag: (t) => `linear-gradient(135deg, ${t.status.warning}20, ${t.status.warning}08)`,
  movie: (t) => `linear-gradient(135deg, ${t.status.error}20, ${t.status.error}08)`,
  announcement: (t) => `linear-gradient(135deg, ${t.accent}20, ${t.accent}08)`,
  bug: (t) => `linear-gradient(135deg, ${t.status.warning}20, ${t.status.warning}08)`,
  feature: (_t) => `linear-gradient(135deg, #8b5cf620, #8b5cf608)`,
  pet: (_t) => `linear-gradient(135deg, #FF980020, #FF980008)`,
  recommendation: (t) => `linear-gradient(135deg, ${t.primary}25, ${t.accent}10)`,
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
  onAcceptRecommendation,
  onDeclineRecommendation,
  onOpenCaseOpening,
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
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="75vh" ariaLabel="Benachrichtigungen">
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
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  border: 'none',
                  color: currentTheme.text.secondary,
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
              {notifications.map((item, index) => {
                if (item.kind === 'recommendation' && item.recommendationData) {
                  return (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      isLast={index === notifications.length - 1}
                      onAccept={(recId) => {
                        onAcceptRecommendation(recId);
                        if (item.navigateTo) {
                          onClose();
                          navigate(item.navigateTo);
                        }
                      }}
                      onDecline={onDeclineRecommendation}
                    />
                  );
                }
                return (
                  <motion.div
                    key={item.id}
                    whileTap={item.kind !== 'request' ? { scale: 0.98 } : undefined}
                    onClick={() => {
                      if (item.kind === 'request') return;
                      if (item.action === 'case_opening' && item.dropData && onOpenCaseOpening) {
                        if (item.notificationId) onMarkAsRead(item.notificationId);
                        onClose();
                        onOpenCaseOpening(item.dropData);
                        return;
                      }
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
                      background: !item.read ? currentTheme.background.surface : 'transparent',
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
                          background: `linear-gradient(180deg, ${currentTheme.primary}, ${currentTheme.accent})`,
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
                                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
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
                              onAcceptRequest(item.requestId ?? '');
                            }}
                            style={{
                              padding: '8px 16px',
                              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                              border: 'none',
                              borderRadius: '12px',
                              color: currentTheme.text.secondary,
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
                              onDeclineRequest(item.requestId ?? '');
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
                );
              })}
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
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
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

interface RecommendationCardProps {
  item: UnifiedNotification;
  isLast: boolean;
  onAccept: (recId: string) => void;
  onDecline: (recId: string) => void;
}

const RecommendationCard = React.memo(function RecommendationCard({
  item,
  isLast,
  onAccept,
  onDecline,
}: RecommendationCardProps) {
  const { currentTheme } = useTheme();
  const data = item.recommendationData;
  if (!data) return null;

  const posterUrl = getImageUrl(data.mediaPoster, 'w185', '');
  const backdropUrl = getImageUrl(data.mediaBackdrop || data.mediaPoster, 'w780', '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      style={{
        position: 'relative',
        marginBottom: isLast ? 0 : 12,
        borderRadius: 18,
        overflow: 'hidden',
        border: `1px solid ${currentTheme.primary}33`,
        background: currentTheme.background.surface,
        boxShadow: `0 10px 26px -14px ${currentTheme.primary}55, 0 4px 10px -4px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Backdrop layer */}
      {backdropUrl && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(28px) saturate(1.5) brightness(0.45)',
            transform: 'scale(1.15)',
            opacity: 0.55,
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${currentTheme.primary}22 0%, transparent 55%, ${currentTheme.accent}1a 100%)`,
        }}
      />

      <div style={{ position: 'relative', padding: '14px' }}>
        {/* Sender Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: `2px solid ${currentTheme.primary}`,
              background: data.senderPhotoURL
                ? `url("${data.senderPhotoURL}") center/cover`
                : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 10px -4px ${currentTheme.primary}80`,
            }}
          >
            {!data.senderPhotoURL && <Person style={{ fontSize: 18, color: '#fff' }} aria-hidden />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: currentTheme.text.primary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {data.senderName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: currentTheme.text.muted,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Send style={{ fontSize: 11, color: currentTheme.primary }} />
              empfiehlt dir · {formatNotificationTime(item.timestamp)}
            </div>
          </div>
        </div>

        {/* Media Row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              style={{
                width: 70,
                height: 104,
                borderRadius: 10,
                objectFit: 'cover',
                boxShadow: '0 6px 16px -6px rgba(0,0,0,0.6)',
                border: `1px solid ${currentTheme.border.default}`,
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 70,
                height: 104,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${currentTheme.primary}66, ${currentTheme.accent}55)`,
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: currentTheme.primary,
                marginBottom: 4,
              }}
            >
              {data.mediaType === 'movie' ? 'Film' : 'Serie'}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                lineHeight: 1.2,
                color: currentTheme.text.primary,
                fontFamily: 'var(--font-display)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              {data.mediaTitle}
            </div>
            {data.message && (
              <div
                style={{
                  position: 'relative',
                  padding: '8px 12px',
                  borderRadius: 12,
                  borderTopLeftRadius: 4,
                  background: `${currentTheme.primary}15`,
                  border: `1px solid ${currentTheme.primary}25`,
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: currentTheme.text.primary,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{data.message}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onAccept(data.recId);
            }}
            style={{
              flex: 2,
              padding: '11px 14px',
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              color: currentTheme.text.secondary,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: `0 6px 18px -6px ${currentTheme.primary}99`,
            }}
          >
            <PlayCircle style={{ fontSize: 17 }} />
            Anschauen
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onDecline(data.recId);
            }}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 12,
              background: 'transparent',
              border: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.text.muted,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Cancel style={{ fontSize: 16 }} />
            Nope
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});
