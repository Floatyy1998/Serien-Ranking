import firebase from 'firebase/compat/app';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { useOptimizedFriends } from './OptimizedFriendsProvider';

interface NotificationContextType {
  totalUnreadActivities: number;
  friendUnreadActivities: Record<string, number>;
  markActivitiesAsRead: (friendId: string) => Promise<void>;
  markAllActivitiesAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()!;
  const { friends } = useOptimizedFriends();
  const [friendUnreadActivities, setFriendUnreadActivities] = useState<
    Record<string, number>
  >({});
  const [totalUnreadActivities, setTotalUnreadActivities] = useState(0);

  // Lade initial ungelesene Aktivitäten
  useEffect(() => {
    if (!user || friends.length === 0) return;

    const loadUnreadActivities = async () => {
      const unreadCounts: Record<string, number> = {};
      let total = 0;

      for (const friend of friends) {
        try {
          // Lade letzte Lesezeit für diesen Freund
          const lastReadRef = firebase
            .database()
            .ref(`users/${user.uid}/lastReadActivities/${friend.uid}`);
          const lastReadSnapshot = await lastReadRef.once('value');
          const lastReadTime = lastReadSnapshot.val() || 0;

          // Lade Aktivitäten des Freundes
          const activitiesRef = firebase
            .database()
            .ref(`activities/${friend.uid}`)
            .orderByChild('timestamp')
            .startAt(lastReadTime + 1);

          const activitiesSnapshot = await activitiesRef.once('value');
          const activitiesData = activitiesSnapshot.val();

          const unreadCount = activitiesData
            ? Object.keys(activitiesData).length
            : 0;

          // Cap individual friend unread count at 20
          const cappedUnreadCount = Math.min(unreadCount, 20);
          unreadCounts[friend.uid] = cappedUnreadCount;
          total += cappedUnreadCount;
        } catch (error) {
          unreadCounts[friend.uid] = 0;
        }
      }

      setFriendUnreadActivities(unreadCounts);
      // Cap total unread activities at 20
      setTotalUnreadActivities(Math.min(total, 20));
    };

    loadUnreadActivities();
  }, [user, friends]);

  // Realtime Listener für neue Aktivitäten
  useEffect(() => {
    if (!user || friends.length === 0) return;

    const listeners: Array<() => void> = [];

    friends.forEach((friend) => {
      const activitiesRef = firebase.database().ref(`activities/${friend.uid}`);

      const listener = activitiesRef.on('child_added', async (snapshot) => {
        if (!snapshot.exists()) return;

        const activity = snapshot.val();
        const activityTime = activity.timestamp;

        // Prüfe ob diese Aktivität nach der letzten Lesezeit ist
        const lastReadRef = firebase
          .database()
          .ref(`users/${user.uid}/lastReadActivities/${friend.uid}`);
        const lastReadSnapshot = await lastReadRef.once('value');
        const lastReadTime = lastReadSnapshot.val() || 0;

        if (activityTime > lastReadTime) {
          setFriendUnreadActivities((prev) => {
            const newCount = Math.min((prev[friend.uid] || 0) + 1, 20);
            const updated = { ...prev, [friend.uid]: newCount };

            // Update total with cap at 20
            const newTotal = Math.min(Object.values(updated).reduce(
              (sum, count) => sum + count,
              0
            ), 20);
            setTotalUnreadActivities(newTotal);

            return updated;
          });
        }
      });

      listeners.push(() => activitiesRef.off('child_added', listener));
    });

    return () => {
      listeners.forEach((cleanup) => cleanup());
    };
  }, [user, friends]);

  const markActivitiesAsRead = async (friendId: string) => {
    if (!user) return;

    try {
      const now = Date.now();
      await firebase
        .database()
        .ref(`users/${user.uid}/lastReadActivities/${friendId}`)
        .set(now);

      setFriendUnreadActivities((prev) => {
        const updated = { ...prev, [friendId]: 0 };
        const newTotal = Math.min(Object.values(updated).reduce(
          (sum, count) => sum + count,
          0
        ), 20);
        setTotalUnreadActivities(newTotal);
        return updated;
      });
    } catch (error) {}
  };

  const markAllActivitiesAsRead = async () => {
    if (!user) return;

    try {
      const now = Date.now();
      const updates: Record<string, number> = {};

      friends.forEach((friend) => {
        updates[`users/${user.uid}/lastReadActivities/${friend.uid}`] = now;
      });

      await firebase.database().ref().update(updates);

      setFriendUnreadActivities({});
      setTotalUnreadActivities(0);
    } catch (error) {}
  };

  return (
    <NotificationContext.Provider
      value={{
        totalUnreadActivities,
        friendUnreadActivities,
        markActivitiesAsRead,
        markAllActivitiesAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
