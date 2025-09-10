import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { useOptimizedFriends } from './OptimizedFriendsProvider';
import apiService from '../services/api.service';

interface NotificationContextType {
  totalUnreadActivities: number;
  friendUnreadActivities: Record<string, number>;
  markActivitiesAsRead: (friendId: string) => Promise<void>;
  markAllActivitiesAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()!;
  const { friends } = useOptimizedFriends();
  const [friendUnreadActivities, setFriendUnreadActivities] = useState<Record<string, number>>({});
  const [totalUnreadActivities, setTotalUnreadActivities] = useState(0);

  // Lade initial ungelesene Aktivitäten
  useEffect(() => {
    if (!user || friends.length === 0) return;

    const loadUnreadActivities = async () => {
      try {
        const unreadData = await apiService.getUnreadActivities();
        setFriendUnreadActivities(unreadData.friendUnreadCounts || {});
        // Cap total unread activities at 20
        setTotalUnreadActivities(Math.min(unreadData.total || 0, 20));
      } catch (error) {
        console.error('Error loading unread activities:', error);
        setFriendUnreadActivities({});
        setTotalUnreadActivities(0);
      }
    };

    loadUnreadActivities();
  }, [user, friends]);

  // Realtime Listener für neue Aktivitäten
  useEffect(() => {
    if (!user || friends.length === 0) return;

    const socket = apiService.getSocket();
    if (!socket) return;

    // Listen for new activities
    const handleNewActivity = (data: { friendId: string; activity: any }) => {
      setFriendUnreadActivities((prev) => {
        const newCount = Math.min((prev[data.friendId] || 0) + 1, 20);
        const updated = { ...prev, [data.friendId]: newCount };

        // Update total with cap at 20
        const newTotal = Math.min(
          Object.values(updated).reduce((sum, count) => sum + count, 0),
          20
        );
        setTotalUnreadActivities(newTotal);

        return updated;
      });
    };

    // Listen for read status updates
    const handleActivitiesRead = (data: { friendId?: string }) => {
      if (data.friendId) {
        // Mark specific friend's activities as read
        setFriendUnreadActivities((prev) => {
          const updated: Record<string, number> = { ...prev };
          updated[data.friendId as string] = 0;
          const newTotal = Math.min(
            Object.values(updated).reduce((sum: number, count: number) => sum + count, 0),
            20
          );
          setTotalUnreadActivities(newTotal);
          return updated;
        });
      } else {
        // Mark all activities as read
        setFriendUnreadActivities({});
        setTotalUnreadActivities(0);
      }
    };

    socket.on('friend:newActivity', handleNewActivity);
    socket.on('activities:read', handleActivitiesRead);

    return () => {
      socket.off('friend:newActivity', handleNewActivity);
      socket.off('activities:read', handleActivitiesRead);
    };
  }, [user, friends]);

  const markActivitiesAsRead = async (friendId: string) => {
    if (!user) return;

    try {
      await apiService.markActivitiesAsRead(friendId);

      setFriendUnreadActivities((prev) => {
        const updated = { ...prev, [friendId]: 0 };
        const newTotal = Math.min(
          Object.values(updated).reduce((sum, count) => sum + count, 0),
          20
        );
        setTotalUnreadActivities(newTotal);
        return updated;
      });
    } catch (error) {
      console.error('Error marking activities as read:', error);
    }
  };

  const markAllActivitiesAsRead = async () => {
    if (!user) return;

    try {
      await apiService.markAllActivitiesAsRead();
      setFriendUnreadActivities({});
      setTotalUnreadActivities(0);
    } catch (error) {
      console.error('Error marking all activities as read:', error);
    }
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