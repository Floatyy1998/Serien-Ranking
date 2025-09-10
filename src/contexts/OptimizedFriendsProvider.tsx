import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import apiService from '../services/api.service';
import { Friend, FriendActivity, FriendRequest } from '../types/Friend';

interface OptimizedFriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friendActivities: FriendActivity[];
  loading: boolean;
  unreadRequestsCount: number;
  unreadActivitiesCount: number;
  markRequestsAsRead: () => void;
  markActivitiesAsRead: () => void;
  sendFriendRequest: (username: string, message?: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  updateUserActivity: (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ) => Promise<void>;
  refreshFriends: () => void;
}

export const OptimizedFriendsContext =
  createContext<OptimizedFriendsContextType>({
    friends: [],
    friendRequests: [],
    sentRequests: [],
    friendActivities: [],
    loading: true,
    unreadRequestsCount: 0,
    unreadActivitiesCount: 0,
    markRequestsAsRead: () => {},
    markActivitiesAsRead: () => {},
    sendFriendRequest: async () => false,
    acceptFriendRequest: async () => {},
    declineFriendRequest: async () => {},
    removeFriend: async () => {},
    updateUserActivity: async () => {},
    refreshFriends: () => {},
  });

export const OptimizedFriendsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isOffline } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendActivities, setFriendActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReadRequestsTime, setLastReadRequestsTime] = useState<number>(0);
  const [lastReadActivitiesTime, setLastReadActivitiesTime] = useState<number>(0);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);
  const [unreadActivitiesCount, setUnreadActivitiesCount] = useState(0);

  // LocalStorage-Keys for read times
  const getLastReadKey = (type: 'requests' | 'activities') =>
    `friends_last_read_${type}_${user?.uid}`;

  // Load saved read times
  useEffect(() => {
    if (user) {
      const savedRequestsTime = localStorage.getItem(getLastReadKey('requests'));
      const savedActivitiesTime = localStorage.getItem(getLastReadKey('activities'));

      setLastReadRequestsTime(savedRequestsTime ? parseInt(savedRequestsTime) : 0);
      setLastReadActivitiesTime(savedActivitiesTime ? parseInt(savedActivitiesTime) : 0);
    }
  }, [user]);

  // Fetch friends from API
  const fetchFriends = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const friendsData = await apiService.getFriends();
      setFriends(friendsData);
      
      // Cache for offline
      if (typeof window !== 'undefined') {
        localStorage.setItem(`friends_${user.uid}`, JSON.stringify(friendsData));
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      
      // Load from cache if offline
      if (isOffline && typeof window !== 'undefined') {
        const cached = localStorage.getItem(`friends_${user.uid}`);
        if (cached) {
          try {
            setFriends(JSON.parse(cached));
          } catch (e) {
            console.error('Failed to parse cached friends:', e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, isOffline]);

  // Fetch friend requests
  const fetchRequests = useCallback(async () => {
    if (!user) {
      setFriendRequests([]);
      setSentRequests([]);
      return;
    }

    try {
      const { incoming, outgoing } = await apiService.getFriendRequests();
      
      setFriendRequests(incoming);
      setSentRequests(outgoing);
      
      // Calculate unread count
      const unreadCount = incoming.filter(
        (req: any) => new Date(req.sentAt).getTime() > lastReadRequestsTime
      ).length;
      setUnreadRequestsCount(unreadCount);
      
      // Cache for offline
      if (typeof window !== 'undefined') {
        localStorage.setItem(`friend_requests_${user.uid}`, JSON.stringify({ incoming, outgoing }));
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      
      // Load from cache if offline
      if (isOffline && typeof window !== 'undefined') {
        const cached = localStorage.getItem(`friend_requests_${user.uid}`);
        if (cached) {
          try {
            const { incoming, outgoing } = JSON.parse(cached);
            setFriendRequests(incoming);
            setSentRequests(outgoing);
          } catch (e) {
            console.error('Failed to parse cached requests:', e);
          }
        }
      }
    }
  }, [user, isOffline, lastReadRequestsTime]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!user) {
      setFriendActivities([]);
      return;
    }

    try {
      const activities = await apiService.getActivities(50, 0);
      setFriendActivities(activities);
      
      // Calculate unread count
      const unreadCount = activities.filter(
        (activity: any) => new Date(activity.timestamp).getTime() > lastReadActivitiesTime
      ).length;
      setUnreadActivitiesCount(unreadCount);
      
      // Cache for offline
      if (typeof window !== 'undefined') {
        localStorage.setItem(`friend_activities_${user.uid}`, JSON.stringify(activities));
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      
      // Load from cache if offline
      if (isOffline && typeof window !== 'undefined') {
        const cached = localStorage.getItem(`friend_activities_${user.uid}`);
        if (cached) {
          try {
            setFriendActivities(JSON.parse(cached));
          } catch (e) {
            console.error('Failed to parse cached activities:', e);
          }
        }
      }
    }
  }, [user, isOffline, lastReadActivitiesTime]);

  // Initial fetch
  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchActivities();
  }, [fetchFriends, fetchRequests, fetchActivities]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!user) return;

    const socket = apiService.getSocket();
    if (!socket) return;

    const handleFriendRequest = () => {
      fetchRequests();
      setUnreadRequestsCount(prev => prev + 1);
    };

    const handleFriendRequestAccepted = () => {
      fetchFriends();
      fetchRequests();
    };

    const handleNewActivity = (data: any) => {
      setFriendActivities(prev => [data, ...prev].slice(0, 50));
      setUnreadActivitiesCount(prev => prev + 1);
    };

    const handleFriendOnline = (data: any) => {
      setFriends(prev => prev.map(f => 
        f.uid === data.userId ? { ...f, isOnline: true } : f
      ));
    };

    const handleFriendOffline = (data: any) => {
      setFriends(prev => prev.map(f => 
        f.uid === data.userId ? { ...f, isOnline: false } : f
      ));
    };

    socket.on('friendRequest', handleFriendRequest);
    socket.on('friendRequestAccepted', handleFriendRequestAccepted);
    socket.on('newActivity', handleNewActivity);
    socket.on('friendOnline', handleFriendOnline);
    socket.on('friendOffline', handleFriendOffline);

    return () => {
      socket.off('friendRequest', handleFriendRequest);
      socket.off('friendRequestAccepted', handleFriendRequestAccepted);
      socket.off('newActivity', handleNewActivity);
      socket.off('friendOnline', handleFriendOnline);
      socket.off('friendOffline', handleFriendOffline);
    };
  }, [user, fetchFriends, fetchRequests]);

  const markRequestsAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadRequestsTime(now);
    setUnreadRequestsCount(0);
    if (user) {
      localStorage.setItem(getLastReadKey('requests'), now.toString());
    }
  }, [user]);

  const markActivitiesAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadActivitiesTime(now);
    setUnreadActivitiesCount(0);
    if (user) {
      localStorage.setItem(getLastReadKey('activities'), now.toString());
    }
  }, [user]);

  const sendFriendRequest = useCallback(async (username: string, message?: string) => {
    try {
      await apiService.sendFriendRequest(username, message);
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return false;
    }
  }, [fetchRequests]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      await apiService.acceptFriendRequest(requestId);
      await fetchFriends();
      await fetchRequests();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  }, [fetchFriends, fetchRequests]);

  const declineFriendRequest = useCallback(async (requestId: string) => {
    try {
      await apiService.declineFriendRequest(requestId);
      await fetchRequests();
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      throw error;
    }
  }, [fetchRequests]);

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      await apiService.removeFriend(friendId);
      await fetchFriends();
    } catch (error) {
      console.error('Failed to remove friend:', error);
      throw error;
    }
  }, [fetchFriends]);

  const updateUserActivity = useCallback(async (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ) => {
    if (!user) return;

    try {
      await apiService.createActivity(
        activity.type,
        activity.data,
        'friends'
      );
      
      // Emit via WebSocket for real-time updates
      const socket = apiService.getSocket();
      socket?.emit('activity', {
        type: activity.type,
        data: activity.data,
        visibility: 'friends'
      });
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }, [user]);

  return (
    <OptimizedFriendsContext.Provider
      value={{
        friends,
        friendRequests,
        sentRequests,
        friendActivities,
        loading,
        unreadRequestsCount,
        unreadActivitiesCount,
        markRequestsAsRead,
        markActivitiesAsRead,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        updateUserActivity,
        refreshFriends: fetchFriends,
      }}
    >
      {children}
    </OptimizedFriendsContext.Provider>
  );
};

export const useOptimizedFriends = () => {
  const context = useContext(OptimizedFriendsContext);
  if (!context) {
    throw new Error('useOptimizedFriends must be used within OptimizedFriendsProvider');
  }
  return context;
};