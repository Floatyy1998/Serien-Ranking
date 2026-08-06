import { createContext, useContext } from 'react';
import type { LocalizedMap } from '../services/i18n';

export interface AppNotification {
  id: string;
  type:
    | 'new_season'
    | 'new_episode'
    | 'friend_activity'
    | 'achievement'
    | 'recommendation'
    | 'discussion_reply'
    | 'discussion_like'
    | 'spoiler_flag'
    | 'trophy_won'
    | 'bug_ticket_reply'
    | 'bug_ticket_status'
    | 'accessory_drop'
    | 'pending_accessory_drop'
    | 'welcome'
    | 'admin_message'
    | 'moderation_flag'
    | 'moderation_ban'
    | 'data_heal'
    | 'movie_available';
  title: string;
  message: string;
  // Englische Variante (Cross-User-Notifications) — Anzeige wählt nach appLocale
  /** Übersetzungen je Sprache — neben dem deutschen Quelltext in title/message. */
  titleL?: LocalizedMap;
  messageL?: LocalizedMap;
  /** @deprecated Altbestand vor Aug 2026 — nur noch lesend, wird als `en` gedeutet. */
  titleEn?: string;
  /** @deprecated Altbestand vor Aug 2026 — nur noch lesend, wird als `en` gedeutet. */
  messageEn?: string;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
