import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../App';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { Friend, FriendActivity, FriendRequest } from '../types/Friend';
import {
  sendFriendRequestOp,
  acceptFriendRequestOp,
  declineFriendRequestOp,
  cancelFriendRequestOp,
  removeFriendOp,
  updateUserActivityOp,
} from './friendOperations';

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
  sendFriendRequest: (username: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  updateUserActivity: (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ) => Promise<void>;
  refreshFriends: () => void;
}

export const OptimizedFriendsContext = createContext<OptimizedFriendsContextType>({
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
  cancelFriendRequest: async () => {},
  removeFriend: async () => {},
  updateUserActivity: async () => {},
  refreshFriends: () => {},
});

export const OptimizedFriendsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()!;

  const {
    data: friendsData,
    loading: friendsLoading,
    refetch: refetchFriends,
  } = useEnhancedFirebaseCache<Record<string, Friend>>(user ? `users/${user.uid}/friends` : '', {
    ttl: 2 * 60 * 1000,
    useRealtimeListener: true,
    enableOfflineSupport: true,
    syncOnReconnect: true,
  });

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendActivities, setFriendActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReadRequestsTime, setLastReadRequestsTime] = useState<number>(0);
  const [lastReadActivitiesTime, setLastReadActivitiesTime] = useState<number>(0);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);
  const [unreadActivitiesCount, setUnreadActivitiesCount] = useState(0);
  const [readTimesLoaded, setReadTimesLoaded] = useState(false);

  const lastReadActivitiesTimeRef = useRef(lastReadActivitiesTime);
  const lastReadRequestsTimeRef = useRef(lastReadRequestsTime);
  const loadFriendActivitiesRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    lastReadActivitiesTimeRef.current = lastReadActivitiesTime;
  }, [lastReadActivitiesTime]);
  useEffect(() => {
    lastReadRequestsTimeRef.current = lastReadRequestsTime;
  }, [lastReadRequestsTime]);

  const friends: Friend[] = useMemo(
    () => (friendsData ? Object.values(friendsData) : []),
    [friendsData]
  );

  // Lade gespeicherte Lesezeiten aus Firebase
  useEffect(() => {
    if (user) {
      const loadReadTimes = async () => {
        try {
          const readTimesRef = firebase.database().ref(`users/${user.uid}/readTimes`);
          const snapshot = await readTimesRef.once('value');
          const data = snapshot.val();

          if (data) {
            setLastReadRequestsTime(data.requests || 0);
            setLastReadActivitiesTime(data.activities || 0);
            setReadTimesLoaded(true);
          } else {
            const now = Date.now();
            setLastReadRequestsTime(now);
            setLastReadActivitiesTime(now);
            await firebase.database().ref(`users/${user.uid}/readTimes`).set({
              requests: now,
              activities: now,
            });
            setReadTimesLoaded(true);
          }
        } catch (error) {
          console.error('Failed to load read times:', error);
          const now = Date.now();
          setLastReadRequestsTime(now);
          setLastReadActivitiesTime(now);
          setReadTimesLoaded(true);
        }
      };

      loadReadTimes();
    }
  }, [user]);

  // Friend Requests mit Realtime Listener
  useEffect(() => {
    if (!user) {
      setFriendRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    const incomingRef = firebase
      .database()
      .ref('friendRequests')
      .orderByChild('toUserId')
      .equalTo(user.uid);

    const outgoingRef = firebase
      .database()
      .ref('friendRequests')
      .orderByChild('fromUserId')
      .equalTo(user.uid);

    const incomingListener = incomingRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const requests = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      const pending = requests.filter((r) => r.status === 'pending');
      setFriendRequests(pending);

      const unreadCount = pending.filter(
        (request) => request.sentAt > lastReadRequestsTimeRef.current
      ).length;
      setUnreadRequestsCount(unreadCount);
    });

    const outgoingListener = outgoingRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const requests = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      const pending = requests.filter((r) => r.status === 'pending');
      setSentRequests(pending);
    });

    return () => {
      incomingRef.off('value', incomingListener);
      outgoingRef.off('value', outgoingListener);
    };
  }, [user?.uid]);

  // Friend Activities laden
  const loadFriendActivities = useCallback(async () => {
    if (!user || friends.length === 0) {
      setFriendActivities([]);
      setUnreadActivitiesCount(0);
      return;
    }

    try {
      const allActivities: FriendActivity[] = [];
      const activeFriends = friends;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const activityPromises = activeFriends.map(async (friend) => {
        try {
          const activitiesRef = firebase
            .database()
            .ref(`activities/${friend.uid}`)
            .orderByChild('timestamp')
            .startAt(sevenDaysAgo)
            .limitToLast(20);

          const snapshot = await activitiesRef.once('value');
          const data = snapshot.val();

          if (data) {
            return Object.keys(data).map((key) => ({
              id: key,
              userId: friend.uid,
              userName: friend.displayName || friend.email?.split('@')[0] || 'Unbekannt',
              ...data[key],
            }));
          }
          return [];
        } catch (error) {
          return [];
        }
      });

      const activityResults = await Promise.all(activityPromises);

      activityResults.forEach((activities) => {
        allActivities.push(...activities);
      });

      allActivities.sort((a, b) => b.timestamp - a.timestamp);
      const recentActivities = allActivities.slice(0, 100);
      setFriendActivities(recentActivities);

      const unreadActivities = recentActivities.filter(
        (activity) => activity.timestamp > lastReadActivitiesTimeRef.current
      );
      setUnreadActivitiesCount(unreadActivities.length);
    } catch (error) {
      // // console.warn('Failed to load friend activities:', error);
    }
  }, [user, friends]);

  useEffect(() => {
    loadFriendActivitiesRef.current = loadFriendActivities;
  }, [loadFriendActivities]);

  useEffect(() => {
    if (!user || friends.length === 0 || !readTimesLoaded) {
      return;
    }

    loadFriendActivitiesRef.current?.();

    const interval = setInterval(
      () => {
        loadFriendActivitiesRef.current?.();
      },
      5 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [user?.uid, friends.length, readTimesLoaded]);

  useEffect(() => {
    setLoading(friendsLoading);
  }, [friendsLoading]);

  const markRequestsAsRead = useCallback(async () => {
    if (!user) return;
    const now = Date.now();

    setFriendRequests((prevRequests) => {
      const stillUnread = prevRequests.filter((request) => request.sentAt > now);
      setUnreadRequestsCount(stillUnread.length);
      return prevRequests;
    });

    setLastReadRequestsTime(now);

    try {
      await firebase.database().ref(`users/${user.uid}/readTimes/requests`).set(now);
    } catch (error) {
      console.error('Failed to save read time:', error);
    }
  }, [user]);

  const markActivitiesAsRead = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    setFriendActivities((prevActivities) => {
      const stillUnread = prevActivities.filter((activity) => activity.timestamp > now);
      setUnreadActivitiesCount(stillUnread.length);
      return prevActivities;
    });

    setLastReadActivitiesTime(now);

    try {
      await firebase.database().ref(`users/${user.uid}/readTimes/activities`).set(now);
    } catch (error) {
      console.error('Failed to save read time:', error);
    }
  }, [user]);

  const sendFriendRequest = async (username: string): Promise<boolean> => {
    if (!user) return false;
    return sendFriendRequestOp(user, username);
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;
    await acceptFriendRequestOp(user, requestId, setFriendRequests, refetchFriends);
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;
    await declineFriendRequestOp(requestId, setFriendRequests);
  };

  const cancelFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;
    await cancelFriendRequestOp(requestId, setSentRequests);
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!user) return;
    await removeFriendOp(user.uid, friendId, refetchFriends);
  };

  const updateUserActivity = async (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ): Promise<void> => {
    if (!user) return;
    await updateUserActivityOp(user, activity);
  };

  const refreshFriends = useCallback(() => {
    refetchFriends();
    loadFriendActivities();
  }, [refetchFriends, loadFriendActivities]);

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
        cancelFriendRequest,
        removeFriend,
        updateUserActivity,
        refreshFriends,
      }}
    >
      {children}
    </OptimizedFriendsContext.Provider>
  );
};

export const useOptimizedFriends = () => useContext(OptimizedFriendsContext);
