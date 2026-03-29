import { createContext, useContext } from 'react';

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
    | 'bug_ticket_status';
  title: string;
  message: string;
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
