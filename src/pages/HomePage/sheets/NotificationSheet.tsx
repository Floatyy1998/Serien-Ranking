import { ChatBubbleOutlined, DoneAll, Group, Notifications } from '@mui/icons-material';
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
import {
  collapseThreads,
  groupByTime,
  type NotificationBucket,
  type NotificationEntry,
} from '../notifications/notificationGroups';
import { RecommendationCard } from '../notifications/RecommendationCard';
import type { UnifiedNotification } from '../hooks/useUnifiedNotifications';
import { t } from '../../../services/i18n';

const COLUMN_MIN_WIDTH = 1000;
const THREE_COLUMN_MIN_WIDTH = 1200;
const sheetWidth = () => effectiveWidth(window.innerWidth, getDisplayScale());
/** Alte, gelesene Ankündigungen räumen „Früher" nicht mehr zu. */
const NEWS_MAX_AGE_MS = 30 * 86_400_000;

/** Nutzbare Breite — darunter Reiter statt Spalten, sonst scrollt man durch alle Bereiche. */
function useSheetWidth(): number {
  const [width, setWidth] = useState(sheetWidth);
  useEffect(() => {
    const onResize = () => setWidth(sheetWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

type ColumnKey = 'me' | 'chats' | 'friends';

const COLUMNS: {
  key: ColumnKey;
  label: () => string;
  Icon: typeof Group;
  weight: string;
  readLimit: number;
}[] = [
  { key: 'me', label: () => t('Für dich'), Icon: Notifications, weight: '1fr', readLimit: 30 },
  {
    key: 'chats',
    label: () => t('Chats'),
    Icon: ChatBubbleOutlined,
    weight: '0.8fr',
    readLimit: 30,
  },
  { key: 'friends', label: () => t('Freunde'), Icon: Group, weight: '1.35fr', readLimit: 20 },
];

const BUCKET_LABEL: Record<NotificationBucket, () => string> = {
  new: () => t('Neu'),
  today: () => t('Heute'),
  yesterday: () => t('Gestern'),
  week: () => t('Diese Woche'),
  older: () => t('Früher'),
};

const columnOf = (n: UnifiedNotification): ColumnKey =>
  n.kind === 'activity' ? 'friends' : n.kind === 'chat' ? 'chats' : 'me';

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

  const [now, setNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<ColumnKey | null>(null);
  useEffect(() => {
    if (isOpen) setNow(Date.now());
    else setActiveTab(null);
  }, [isOpen]);

  const columns = useMemo(() => {
    const byColumn: Record<ColumnKey, UnifiedNotification[]> = { me: [], chats: [], friends: [] };
    for (const n of notifications) {
      if (n.kind === 'announcement' && n.read && now - n.timestamp > NEWS_MAX_AGE_MS) continue;
      byColumn[columnOf(n)].push(n);
    }
    return COLUMNS.filter((c) => byColumn[c.key].length > 0).map((c) => {
      const entries = collapseThreads(byColumn[c.key]);
      return {
        ...c,
        groups: groupByTime(entries, now, c.readLimit),
        unread: entries.filter((e) => e.unread).length,
      };
    });
  }, [notifications, now]);

  const width = useSheetWidth();
  const narrow = width < (columns.length > 2 ? THREE_COLUMN_MIN_WIDTH : COLUMN_MIN_WIDTH);
  const currentTab =
    columns.find((c) => c.key === activeTab) ?? columns.find((c) => c.unread > 0) ?? columns[0];
  const visibleColumns = narrow && currentTab ? [currentTab] : columns;
  const feedColumn = columns.some((c) => c.key === 'friends')
    ? 'friends'
    : columns[columns.length - 1]?.key;

  const openPath = (path: string, state?: unknown) => {
    onClose();
    navigate(path, state ? { state } : undefined);
  };

  const openEntry = (entry: NotificationEntry) => {
    const item = entry.item;
    if (item.kind === 'request') return;
    if (item.action === 'case_opening' && item.dropData && onOpenCaseOpening) {
      if (item.notificationId) onMarkAsRead(item.notificationId);
      onClose();
      onOpenCaseOpening(item.dropData);
      return;
    }
    for (const n of entry.items) {
      if (!n.read && n.notificationId) onMarkAsRead(n.notificationId);
    }
    if (item.kind === 'announcement') onDismissAnnouncement(item.id);
    if (item.navigateTo) openPath(item.navigateTo, item.navigateState);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  const renderEntry = (entry: NotificationEntry, index: number) => {
    const item = entry.item;
    const style = { '--i': Math.min(index, 8) } as React.CSSProperties;
    if (item.kind === 'activity' && item.bundle) {
      return (
        <div key={entry.key} className="nh-enter" style={style}>
          <ActivityBundleItem item={item} posterFor={posterFor} onOpen={openPath} />
        </div>
      );
    }
    if (item.kind === 'recommendation' && item.recommendationData) {
      return (
        <div key={entry.key} className="nh-enter" style={style}>
          <RecommendationCard
            item={item}
            isLast
            onAccept={(recId) => {
              onAcceptRecommendation(recId);
              if (item.navigateTo) {
                onClose();
                navigate(item.navigateTo);
              }
            }}
            onDecline={onDeclineRecommendation}
          />
        </div>
      );
    }
    return (
      <div key={entry.key} className="nh-enter" style={style}>
        <NotificationItem
          item={item}
          count={entry.items.length}
          unread={entry.unread}
          theme={currentTheme}
          onItemClick={() => openEntry(entry)}
          onAcceptRequest={onAcceptRequest}
          onDeclineRequest={onDeclineRequest}
        />
      </div>
    );
  };

  const onPrimary = getOptimalTextColor(currentTheme.primary);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="88vh"
      ariaLabel={t('Benachrichtigungen')}
    >
      <div
        className={`nh-sheet${narrow ? ' nh-sheet--narrow' : ''}${
          narrow && columns.length > 1 ? ' nh-sheet--tabs' : ''
        }`}
        style={{ '--nh-on-primary': onPrimary } as React.CSSProperties}
      >
        <header className="nh-header">
          <div className="nh-header-text">
            <h2 className="nh-heading">{t('Benachrichtigungen')}</h2>
            {notifications.length > 0 && (
              <span className={`nh-subline${hasUnread ? ' has-unread' : ''}`}>
                {hasUnread && <span className="nh-pulse" aria-hidden />}
                {hasUnread ? t('{n} ungelesen', { n: unreadCount }) : t('Alles gelesen')}
              </span>
            )}
          </div>
          {hasUnread && (
            <button
              type="button"
              className="nh-readall"
              onClick={onMarkAllRead}
              aria-label={t('Alle als gelesen markieren')}
            >
              <DoneAll />
              <span>{t('Alle gelesen')}</span>
            </button>
          )}
        </header>

        {narrow && columns.length > 1 && (
          <div className="nh-tabs" role="tablist" aria-label={t('Benachrichtigungen')}>
            {columns.map(({ key, label, Icon, unread }) => (
              <button
                key={key}
                type="button"
                role="tab"
                className="nh-tab"
                aria-selected={key === currentTab?.key}
                onClick={() => setActiveTab(key)}
              >
                <Icon className="nh-tab-icon" />
                <span className="nh-tab-label">{label()}</span>
                {unread > 0 && <span className="nh-tab-count">{unread}</span>}
              </button>
            ))}
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="nh-empty">
            <span className="nh-empty-icon">
              <Notifications />
            </span>
            <h3>{t('Alles ruhig hier')}</h3>
            <p>{t('Keine neuen Benachrichtigungen')}</p>
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
            {visibleColumns.map(({ key, label, Icon, unread, groups }) => (
              <section
                key={key}
                className={`nh-column nh-column--${key}`}
                aria-label={label()}
                role={narrow ? 'tabpanel' : undefined}
              >
                {!narrow && (
                  <h3 className="nh-column-head">
                    <span className="nh-column-icon" aria-hidden>
                      <Icon />
                    </span>
                    <span className="nh-column-label">{label()}</span>
                    {unread > 0 && (
                      <span className="nh-column-new">{t('{n} neu', { n: unread })}</span>
                    )}
                  </h3>
                )}
                <div className="nh-column-scroll hide-scrollbar">
                  {groups.map(({ bucket, entries }) => (
                    <div key={bucket} className={`nh-group nh-group--${bucket}`}>
                      {key !== 'chats' && (
                        <div className="nh-group-label">
                          {bucket === 'new' && <span className="nh-pulse" aria-hidden />}
                          {BUCKET_LABEL[bucket]()}
                        </div>
                      )}
                      <div className={key === 'friends' ? 'nh-feed' : 'nh-list'}>
                        {entries.map(renderEntry)}
                      </div>
                    </div>
                  ))}
                  {key === feedColumn && (
                    <button
                      type="button"
                      className="nh-all-activity"
                      onClick={() => {
                        onClose();
                        navigate('/activity');
                      }}
                    >
                      <Group />
                      {t('Alle Aktivitäten anzeigen')}
                    </button>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
});
