import { Cancel, Check } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { formatNotificationTime, type UnifiedNotification } from '../useUnifiedNotifications';
import { getNotificationIcon, getNotificationIconBg } from './icons';
import { tapScaleTight } from '../../../lib/motion';

interface NotificationItemProps {
  item: UnifiedNotification;
  isLast: boolean;
  theme: ThemeContextType['currentTheme'];
  onItemClick: (item: UnifiedNotification) => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
}

export const NotificationItem = React.memo(function NotificationItem({
  item,
  isLast,
  theme,
  onItemClick,
  onAcceptRequest,
  onDeclineRequest,
}: NotificationItemProps) {
  return (
    <motion.div
      whileTap={item.kind !== 'request' ? { scale: 0.98 } : undefined}
      onClick={() => onItemClick(item)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '14px 8px',
        cursor: item.kind !== 'request' && item.navigateTo ? 'pointer' : 'default',
        borderBottom: !isLast ? `1px solid ${theme.border.default}40` : 'none',
        position: 'relative',
        background: !item.read ? theme.background.surface : 'transparent',
        borderRadius: '12px',
        marginBottom: !isLast ? '2px' : 0,
      }}
    >
      {!item.read && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '14px',
            bottom: '14px',
            width: '3px',
            borderRadius: '2px',
            background: `linear-gradient(180deg, ${theme.primary}, ${theme.accent})`,
          }}
        />
      )}

      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '14px',
          background: getNotificationIconBg(item.icon, theme),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {getNotificationIcon(item.icon, theme)}
      </div>

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
              color: theme.text.primary,
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
              color: !item.read ? theme.primary : theme.text.muted,
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
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  flexShrink: 0,
                }}
              />
            )}
          </span>
        </div>
        <div
          style={{
            fontSize: '14px',
            color: !item.read ? theme.text.secondary : theme.text.muted,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.message}
        </div>

        {item.kind === 'request' && item.requestId && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <motion.button
              whileTap={tapScaleTight}
              onClick={(e) => {
                e.stopPropagation();
                onAcceptRequest(item.requestId ?? '');
              }}
              style={{
                padding: '8px 16px',
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                border: 'none',
                borderRadius: '12px',
                color: theme.text.secondary,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Check style={{ fontSize: '16px' }} />
              Annehmen
            </motion.button>
            <motion.button
              whileTap={tapScaleTight}
              onClick={(e) => {
                e.stopPropagation();
                onDeclineRequest(item.requestId ?? '');
              }}
              style={{
                padding: '8px 16px',
                background: theme.background.default,
                border: `1px solid ${theme.border.default}`,
                borderRadius: '12px',
                color: theme.text.secondary,
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
});
