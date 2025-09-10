import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../App';
import apiService from '../services/api.service';

interface Notification {
  id: string;
  type: 'new_season' | 'new_episode' | 'friend_activity' | 'achievement' | 'recommendation';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth()!;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Load notifications from backend
    const loadNotifications = async () => {
      try {
        const notificationsList = await apiService.getNotifications();
        // Sort by timestamp, newest first
        notificationsList.sort((a: any, b: any) => b.timestamp - a.timestamp);
        setNotifications(notificationsList);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      }
    };

    loadNotifications();

    // Setup WebSocket listener for real-time notifications
    const socket = apiService.getSocket();
    if (socket) {
      socket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      socket.on('notification:read', (notificationId: string) => {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      });

      socket.on('notifications:cleared', () => {
        setNotifications([]);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
        socket.off('notification:read');
        socket.off('notifications:cleared');
      }
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!user) return;

    try {
      const newNotification = await apiService.createNotification(notification);
      // Also add to local state immediately
      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotifications = async () => {
    if (!user) return;

    try {
      await apiService.clearNotifications();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};