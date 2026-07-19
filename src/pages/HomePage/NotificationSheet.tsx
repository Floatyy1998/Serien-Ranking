import { DoneAll, Group, Notifications } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { NotificationItem } from './notifications/NotificationItem';
import { RecommendationCard } from './notifications/RecommendationCard';
import type { UnifiedNotification } from './useUnifiedNotifications';
import { tapScaleTight } from '../../lib/motion';
import { t } from '../../services/i18n';

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
  const { isDesktop } = useDeviceType();

  // Desktop: nach Themen zoniert statt chronologischem Spalten-Chaos.
  const groups = useMemo(() => {
    const friends: UnifiedNotification[] = [];
    const news: UnifiedNotification[] = [];
    const personal: UnifiedNotification[] = [];
    for (const n of notifications) {
      if (n.kind === 'activity' || n.kind === 'request' || n.kind === 'recommendation') {
        friends.push(n);
      } else if (n.kind === 'announcement') {
        news.push(n);
      } else {
        personal.push(n);
      }
    }
    return [
      { label: t('Freunde'), items: friends },
      { label: t('Neues in TV-Rank'), items: news },
      { label: t('Für dich'), items: personal },
    ].filter((g) => g.items.length > 0);
  }, [notifications]);

  const handleItemClick = (item: UnifiedNotification) => {
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
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  const renderItem = (item: UnifiedNotification, isLast: boolean) => {
    if (item.kind === 'recommendation' && item.recommendationData) {
      return (
        <RecommendationCard
          key={item.id}
          item={item}
          isLast={isLast}
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
      <NotificationItem
        key={item.id}
        item={item}
        isLast={isLast}
        theme={currentTheme}
        onItemClick={handleItemClick}
        onAcceptRequest={onAcceptRequest}
        onDeclineRequest={onDeclineRequest}
      />
    );
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="75vh"
      ariaLabel={t('Benachrichtigungen')}
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
                {t('Benachrichtigungen')}
              </h2>
              {notifications.length > 0 && (
                <span style={{ fontSize: '13px', color: currentTheme.text.muted }}>
                  {hasUnread ? t('{n} ungelesen', { n: unreadCount }) : t('Alles gelesen')}
                </span>
              )}
            </div>
            {hasUnread && (
              <motion.button
                whileTap={tapScaleTight}
                onClick={onMarkAllRead}
                aria-label={t('Alle als gelesen markieren')}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  border: 'none',
                  color: getOptimalTextColor(currentTheme.primary),
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

        {/* List — hide-scrollbar: Scrollbars sind hier tabu */}
        <div
          className="hide-scrollbar"
          style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}
        >
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: 'var(--glass-subtle)',
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
                {t('Alles ruhig hier')}
              </h3>
              <p style={{ color: currentTheme.text.muted, fontSize: '14px', margin: 0 }}>
                {t('Keine neuen Benachrichtigungen')}
              </p>
            </div>
          ) : isDesktop ? (
            /* Desktop: thematische Zonen mit Überschrift, je eine Spalte */
            <div className="sheet-grid">
              {groups.map((group) => (
                <div key={group.label} className="sheet-group">
                  <h3 className="sheet-group__title" style={{ color: currentTheme.text.muted }}>
                    {group.label}
                    <span
                      className="sheet-group__count"
                      style={{
                        background: `${currentTheme.primary}1a`,
                        color: currentTheme.primary,
                      }}
                    >
                      {group.items.length}
                    </span>
                  </h3>
                  {group.items.map((item, index) =>
                    renderItem(item, index === group.items.length - 1)
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Mobile: chronologische Liste */
            <div style={{ padding: '0 12px' }}>
              {notifications.map((item, index) =>
                renderItem(item, index === notifications.length - 1)
              )}
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
                maxWidth: 480,
                margin: '0 auto',
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
              {t('Alle Aktivitäten anzeigen')}
            </motion.button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
});
