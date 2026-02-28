import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

interface Notification {
  id: string;
  type:
    | 'new_season'
    | 'new_episode'
    | 'friend_activity'
    | 'achievement'
    | 'recommendation'
    | 'discussion_reply'
    | 'discussion_like'
    | 'spoiler_flag';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: Record<string, unknown>;
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

  // Cleanup old notifications (older than 30 days, keep max 50)
  const cleanupOldNotifications = async (notificationsList: Notification[]) => {
    if (!user || notificationsList.length === 0) return;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const toDelete: string[] = [];

    // Find notifications older than 30 days
    notificationsList.forEach((n) => {
      if (n.timestamp < thirtyDaysAgo) {
        toDelete.push(n.id);
      }
    });

    // Also delete if more than 50 notifications (keep newest 50)
    if (notificationsList.length > 50) {
      const sorted = [...notificationsList].sort((a, b) => b.timestamp - a.timestamp);
      sorted.slice(50).forEach((n) => {
        if (!toDelete.includes(n.id)) {
          toDelete.push(n.id);
        }
      });
    }

    // Delete old notifications from Firebase
    if (toDelete.length > 0) {
      const updates: Record<string, null> = {};
      toDelete.forEach((id) => {
        updates[id] = null;
      });
      await firebase.database().ref(`users/${user.uid}/notifications`).update(updates);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Load notifications from Firebase
    const notificationsRef = firebase.database().ref(`users/${user.uid}/notifications`);

    const handleData = (snapshot: firebase.database.DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.entries(
          data as Record<string, Omit<Notification, 'id'>>
        ).map(([id, notification]) => ({
          id,
          ...notification,
        }));
        // Sort by timestamp, newest first
        notificationsList.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notificationsList);

        // Cleanup old notifications in background
        cleanupOldNotifications(notificationsList);
      } else {
        setNotifications([]);
      }
    };

    notificationsRef.on('value', handleData);

    return () => {
      notificationsRef.off('value', handleData);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!user) return;

    const newNotification = {
      ...notification,
      timestamp: Date.now(),
      read: false,
    };

    const notificationsRef = firebase.database().ref(`users/${user.uid}/notifications`);
    await notificationsRef.push(newNotification);
    // Firebase realtime listener handles the state update automatically
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    await firebase
      .database()
      .ref(`users/${user.uid}/notifications/${notificationId}/read`)
      .set(true);

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const updates: Record<string, boolean> = {};
    notifications.forEach((n) => {
      if (!n.read) {
        updates[`${n.id}/read`] = true;
      }
    });

    if (Object.keys(updates).length > 0) {
      await firebase.database().ref(`users/${user.uid}/notifications`).update(updates);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const clearNotifications = async () => {
    if (!user) return;

    await firebase.database().ref(`users/${user.uid}/notifications`).remove();

    setNotifications([]);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
