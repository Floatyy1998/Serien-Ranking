import type { ReactNode } from 'react';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { NotificationContext } from './NotificationContextDef';
import type { AppNotification, NotificationContextType } from './NotificationContextDef';

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth() || {};
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Cleanup old notifications (older than 30 days, keep max 50)
  const cleanupOldNotifications = useCallback(
    async (notificationsList: AppNotification[]) => {
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
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;

    // Load notifications from Firebase
    const notificationsRef = firebase
      .database()
      .ref(`users/${user.uid}/notifications`)
      .orderByChild('timestamp')
      .limitToLast(50);

    const handleData = (snapshot: firebase.database.DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList: AppNotification[] = Object.entries(
          data as Record<string, Omit<AppNotification, 'id'>>
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
      setNotifications([]);
    };
  }, [user, cleanupOldNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const addNotification = useCallback(
    async (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      if (!user) return;

      const newNotification = {
        ...notification,
        timestamp: Date.now(),
        read: false,
      };

      const notificationsRef = firebase.database().ref(`users/${user.uid}/notifications`);
      await notificationsRef.push(newNotification);
      // Firebase realtime listener handles the state update automatically
    },
    [user]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      await firebase
        .database()
        .ref(`users/${user.uid}/notifications/${notificationId}/read`)
        .set(true);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    },
    [user]
  );

  const markAllAsRead = useCallback(async () => {
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
  }, [user, notifications]);

  const clearNotifications = useCallback(async () => {
    if (!user) return;

    await firebase.database().ref(`users/${user.uid}/notifications`).remove();

    setNotifications([]);
  }, [user]);

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
    }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
