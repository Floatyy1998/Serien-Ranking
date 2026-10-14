import { DoneAll, Group, Notifications } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActivityPosters } from '../../../hooks/social/useActivityPosters';
import { effectiveWidth, getDisplayScale } from '../../../services/settings/displayScale';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { ActivityBundleItem } from '../notifications/ActivityBundleItem';
import '../notifications/NotificationHub.css';
import { NotificationItem } from '../notifications/NotificationItem';
import { RecommendationCard } from '../notifications/RecommendationCard';
import type { UnifiedNotification } from '../hooks/useUnifiedNotifications';
import { tapScaleTight } from '../../../lib/motion';
import { t } from '../../../services/i18n';

const COLUMN_MIN_WIDTH = 1000;
const isNarrow = () => effectiveWidth(window.innerWidth, getDisplayScale()) < COLUMN_MIN_WIDTH;

/** Unter 1000px nutzbarer Breite Reiter statt Spalten — sonst scrollt man durch alle Bereiche. */
function useNarrowSheet(): boolean {
  const [narrow, setNarrow] = useState(isNarrow);
  useEffect(() => {
    const onResize = () => setNarrow(isNarrow());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return narrow;
}

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
  const posterFor = useActivityPosters(isOpen);

  const columns = useMemo(() => {
    const personal: UnifiedNotification[] = [];
    const chats: UnifiedNotification[] = [];
    const news: UnifiedNotification[] = [];
    const friends: UnifiedNotification[] = [];
    for (const n of notifications) {
      if (n.kind === 'activity') friends.push(n);
      else if (n.kind === 'chat') chats.push(n);
      else if (n.kind === 'announcement' || n.sourceType === 'admin_message') news.push(n);
      else personal.push(n);
    }
    const section = (key: string, label: string, items: UnifiedNotification[], wide = false) =>
      items.length ? [{ key, label, items, wide }] : [];
    return [
      {
        key: 'me',
        label: t('Für dich'),
        weight: '1fr',
        sections: [
          ...section('me', t('Für dich'), personal),
          ...section('news', t('Neues in TV-Rank'), news),
        ],
      },
      {
        key: 'chats',
        label: t('Chats'),
        weight: '0.85fr',
        sections: section('chats', t('Chats'), chats),
      },
      {
        key: 'friends',
        label: t('Freunde'),
        weight: '1.5fr',
        sections: section('friends', t('Freunde'), friends, true),
      },
    ]
      .filter((c) => c.sections.length > 0)
      .map((c) => ({
        ...c,
        unread: c.sections.reduce((n, s) => n + s.items.filter((i) => !i.read).length, 0),
      }));
  }, [notifications]);

  const narrow = useNarrowSheet();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) setActiveTab(null);
  }, [isOpen]);
  const currentTab =
    columns.find((c) => c.key === activeTab) ?? columns.find((c) => c.unread > 0) ?? columns[0];
  const visibleColumns = narrow && currentTab ? [currentTab] : columns;

  const openPath = (path: string, state?: unknown) => {
    onClose();
    navigate(path, state ? { state } : undefined);
  };

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
    if (item.navigateTo) openPath(item.navigateTo, item.navigateState);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  const renderItem = (item: UnifiedNotification, isLast: boolean) => {
    if (item.kind === 'activity' && item.bundle) {
      return (
        <ActivityBundleItem key={item.id} item={item} posterFor={posterFor} onOpen={openPath} />
      );
    }
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
                  backgroundImage: `linear-gradient(135deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
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

        {narrow && columns.length > 1 && (
          <div className="nh-tabs" role="tablist" aria-label={t('Benachrichtigungen')}>
            {columns.map((column) => (
              <button
                key={column.key}
                type="button"
                role="tab"
                className="nh-tab"
                aria-selected={column.key === currentTab?.key}
                onClick={() => setActiveTab(column.key)}
              >
                {column.label}
                {column.unread > 0 && <span className="nh-tab-count">{column.unread}</span>}
              </button>
            ))}
          </div>
        )}

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
          ) : (
            <div
              className={`nh-columns${narrow ? '' : ' nh-columns--grid'}`}
              style={
                {
                  '--nh-cols': visibleColumns.map((c) => `minmax(0, ${c.weight})`).join(' '),
                } as React.CSSProperties
              }
            >
              {visibleColumns.map((column) => (
                <div key={column.key} className="nh-column">
                  {column.sections.map((section) => (
                    <section key={section.key}>
                      {(!narrow || column.sections.length > 1) && (
                        <h3 className="nh-section-title">
                          {section.label}
                          <span className="nh-section-count">{section.items.length}</span>
                        </h3>
                      )}
                      <div className={section.wide ? 'nh-list--wide' : undefined}>
                        {section.items.map((item, index) =>
                          renderItem(item, index === section.items.length - 1)
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '8px 16px 20px' }}>
            <motion.button
              whileTap={{ opacity: 0.7 }}
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
