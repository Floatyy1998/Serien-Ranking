import { Cancel, Check } from '@mui/icons-material';
import React, { useState } from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { formatNotificationTime, type UnifiedNotification } from '../hooks/useUnifiedNotifications';
import { getNotificationIcon, getNotificationIconBg } from './icons';
import { NotifAvatar } from './NotifAvatar';
import { t } from '../../../services/i18n';

interface NotificationItemProps {
  item: UnifiedNotification;
  /** Meldungen im selben Thread — ab 2 als Zähler am Titel. */
  count?: number;
  unread?: boolean;
  theme: ThemeContextType['currentTheme'];
  onItemClick: (item: UnifiedNotification) => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
}

export const NotificationItem = React.memo(function NotificationItem({
  item,
  count = 1,
  unread = !item.read,
  theme,
  onItemClick,
  onAcceptRequest,
  onDeclineRequest,
}: NotificationItemProps) {
  const isRequest = item.kind === 'request';
  // Ohne Navigationsziel (z. B. Admin-Nachricht): Tippen klappt den vollen Text auf
  const expandable = !isRequest && !item.navigateTo;
  const [expanded, setExpanded] = useState(false);
  const isNews = item.kind === 'announcement' || item.sourceType === 'admin_message';

  const activate = () => {
    if (expandable) setExpanded((v) => !v);
    onItemClick(item);
  };

  const className = [
    'nh-item',
    unread && 'is-new',
    unread && isNews && 'is-news',
    expanded && 'is-expanded',
    isRequest && 'is-static',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      role={isRequest ? undefined : 'button'}
      tabIndex={isRequest ? undefined : 0}
      onClick={isRequest ? undefined : activate}
      onKeyDown={
        isRequest
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
              }
            }
      }
    >
      {item.kind === 'chat' ? (
        <NotifAvatar name={item.title} photoURL={item.photoURL} size={40} />
      ) : (
        <span
          className="nh-icon"
          style={{ background: getNotificationIconBg(item.icon, theme) }}
          aria-hidden
        >
          {getNotificationIcon(item.icon, theme)}
        </span>
      )}

      <div className="nh-body">
        <div className="nh-head">
          <span className="nh-title">{item.title}</span>
          {count > 1 && (
            <span className="nh-count" aria-label={t('{n} Meldungen', { n: count })}>
              {count}
            </span>
          )}
          <span className="nh-time">
            {formatNotificationTime(item.timestamp)}
            {unread && <span className="nh-dot" />}
          </span>
        </div>
        <div className="nh-text">{item.message}</div>

        {isRequest && item.requestId && (
          <div className="nh-actions">
            <button
              type="button"
              className="nh-btn nh-btn--primary"
              onClick={() => onAcceptRequest(item.requestId ?? '')}
            >
              <Check />
              {t('Annehmen')}
            </button>
            <button
              type="button"
              className="nh-btn nh-btn--ghost"
              onClick={() => onDeclineRequest(item.requestId ?? '')}
            >
              <Cancel />
              {t('Ablehnen')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
