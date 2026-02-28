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
import { getOfflineBadgeSystem } from '../features/badges/offlineBadgeSystem';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
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

  // 🚀 Enhanced Cache mit Offline-Support für Freunde
  const {
    data: friendsData,
    loading: friendsLoading,
    refetch: refetchFriends,
  } = useEnhancedFirebaseCache<Record<string, Friend>>(user ? `users/${user.uid}/friends` : '', {
    ttl: 2 * 60 * 1000, // 2 Minuten Cache
    useRealtimeListener: true, // Realtime für sofortige Updates
    enableOfflineSupport: true, // Offline-First Unterstützung
    syncOnReconnect: true, // Auto-Sync bei Reconnect
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

  // Refs to avoid stale closures in intervals and listeners
  const lastReadActivitiesTimeRef = useRef(lastReadActivitiesTime);
  const lastReadRequestsTimeRef = useRef(lastReadRequestsTime);
  const loadFriendActivitiesRef = useRef<(() => Promise<void>) | null>(null);

  // Keep refs in sync with state
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
            // Initialize with current time to only show new activities as unread
            const now = Date.now();
            setLastReadRequestsTime(now);
            setLastReadActivitiesTime(now);
            // Save initial read times to Firebase
            await firebase.database().ref(`users/${user.uid}/readTimes`).set({
              requests: now,
              activities: now,
            });
            setReadTimesLoaded(true);
          }
        } catch (error) {
          console.error('Failed to load read times:', error);
          // Fallback to current time to only show new activities as unread
          const now = Date.now();
          setLastReadRequestsTime(now);
          setLastReadActivitiesTime(now);
          setReadTimesLoaded(true);
        }
      };

      loadReadTimes();
    }
  }, [user]);

  // 🚀 Optimiert: Friend Requests nur alle 2 Minuten laden + Smart Caching
  useEffect(() => {
    if (!user) {
      setFriendRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    let requestsCache: {
      timestamp: number;
      data: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
    } | null = null;
    const CACHE_DURATION = 60 * 1000; // 1 Minute Cache

    const loadRequests = async (forceRefresh = false) => {
      // Prüfe Cache zuerst (außer bei forceRefresh)
      if (!forceRefresh && requestsCache && Date.now() - requestsCache.timestamp < CACHE_DURATION) {
        setFriendRequests(requestsCache.data.incoming);
        setSentRequests(requestsCache.data.outgoing);
        return;
      }

      try {
        // Parallele Abfragen für bessere Performance
        const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
          firebase
            .database()
            .ref('friendRequests')
            .orderByChild('toUserId')
            .equalTo(user.uid)
            .once('value'),
          firebase
            .database()
            .ref('friendRequests')
            .orderByChild('fromUserId')
            .equalTo(user.uid)
            .once('value'),
        ]);

        const incomingData = incomingSnapshot.val();
        const incomingRequests = incomingData
          ? Object.keys(incomingData).map((key) => ({
              id: key,
              ...incomingData[key],
            }))
          : [];
        const pendingIncoming = incomingRequests.filter((r) => r.status === 'pending');

        const outgoingData = outgoingSnapshot.val();
        const outgoingRequests = outgoingData
          ? Object.keys(outgoingData).map((key) => ({
              id: key,
              ...outgoingData[key],
            }))
          : [];
        const pendingOutgoing = outgoingRequests.filter((r) => r.status === 'pending');

        // Cache aktualisieren
        requestsCache = {
          timestamp: Date.now(),
          data: { incoming: pendingIncoming, outgoing: pendingOutgoing },
        };

        setFriendRequests(pendingIncoming);
        setSentRequests(pendingOutgoing);

        // Unread count
        const unreadCount = pendingIncoming.filter(
          (request) => request.sentAt > lastReadRequestsTimeRef.current
        ).length;
        setUnreadRequestsCount(unreadCount);
      } catch (error) {
        // // console.warn('Failed to load friend requests:', error);
      }
    };

    // Initial load
    loadRequests();

    // Real-time listeners for friend requests
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

    // Listen for changes to incoming requests
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

      // Update unread count
      const unreadCount = pending.filter(
        (request) => request.sentAt > lastReadRequestsTimeRef.current
      ).length;
      setUnreadRequestsCount(unreadCount);
    });

    // Listen for changes to outgoing requests
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
  }, [user?.uid]); // Stabile Dependencies - read times handled via ref

  // 🚀 Optimiert: Friend Activities mit intelligenter Paginierung und Caching
  const loadFriendActivities = useCallback(async () => {
    if (!user || friends.length === 0) {
      setFriendActivities([]);
      setUnreadActivitiesCount(0);
      return;
    }

    try {
      const allActivities: FriendActivity[] = [];

      // Load from ALL friends, not just the first 8
      const activeFriends = friends;

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // Load last 7 days of activities
      // Batch alle Requests parallel statt sequenziell
      const activityPromises = activeFriends.map(async (friend) => {
        try {
          const activitiesRef = firebase
            .database()
            .ref(`activities/${friend.uid}`)
            .orderByChild('timestamp')
            .startAt(sevenDaysAgo)
            .limitToLast(20); // Get last 20 activities per friend

          const snapshot = await activitiesRef.once('value');
          const data = snapshot.val();

          if (data) {
            return Object.keys(data).map((key) => ({
              id: key,
              userId: friend.uid, // Add the friend's userId to each activity
              userName: friend.displayName || friend.email?.split('@')[0] || 'Unbekannt',
              ...data[key],
            }));
          }
          return [];
        } catch (error) {
          // // console.warn(
          //   `Failed to load activities for friend ${friend.uid}:`,
          //   error
          // );
          return [];
        }
      });

      // Warte auf alle Requests parallel
      const activityResults = await Promise.all(activityPromises);

      // Flatten und sammle alle Activities
      activityResults.forEach((activities) => {
        allActivities.push(...activities);
      });

      // Sortiere nach Zeitstempel und limitiere früher
      allActivities.sort((a, b) => b.timestamp - a.timestamp);
      const recentActivities = allActivities.slice(0, 100); // Show up to 100 activities
      setFriendActivities(recentActivities);

      // Unread count
      const unreadActivities = recentActivities.filter(
        (activity) => activity.timestamp > lastReadActivitiesTimeRef.current
      );
      setUnreadActivitiesCount(unreadActivities.length);
    } catch (error) {
      // // console.warn('Failed to load friend activities:', error);
    }
  }, [user, friends]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep loadFriendActivities ref in sync
  useEffect(() => {
    loadFriendActivitiesRef.current = loadFriendActivities;
  }, [loadFriendActivities]);

  // Load activities when conditions are met
  useEffect(() => {
    if (!user || friends.length === 0 || !readTimesLoaded) {
      return;
    }

    // Initial load
    loadFriendActivitiesRef.current?.();

    // Setup interval for periodic updates - uses ref to always call latest version
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

  // Funktionen zum Markieren als gelesen
  const markRequestsAsRead = useCallback(async () => {
    if (!user) return;
    const now = Date.now();

    // Immediately update the unread count based on the new timestamp
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
    // Immediately update the unread count based on the new timestamp
    setFriendActivities((prevActivities) => {
      const stillUnread = prevActivities.filter((activity) => activity.timestamp > now);
      setUnreadActivitiesCount(stillUnread.length);
      return prevActivities;
    });

    setLastReadActivitiesTime(now);

    try {
      await firebase.database().ref(`users/${user.uid}/readTimes/activities`).set(now);
    } catch (error) {
      console.error('❌ Failed to save read time:', error);
    }
  }, [user]);

  const sendFriendRequest = async (username: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef.orderByChild('username').equalTo(username).once('value');
      const userData = snapshot.val();

      if (!userData) return false;

      const targetUserId = Object.keys(userData)[0];
      const targetUserData = userData[targetUserId];

      // Aktueller User Daten laden für fromUsername/fromUserEmail
      const currentUserRef = firebase.database().ref(`users/${user.uid}`);
      const currentUserSnapshot = await currentUserRef.once('value');
      const currentUserData = currentUserSnapshot.val();

      const requestRef = firebase.database().ref('friendRequests').push();

      await requestRef.set({
        fromUserId: user.uid,
        toUserId: targetUserId,
        fromUsername: currentUserData?.username || user.displayName || 'Unbekannt',
        toUsername: targetUserData?.username || username,
        fromUserEmail: currentUserData?.email || user.email || '',
        toUserEmail: targetUserData?.email || '',
        status: 'pending',
        sentAt: firebase.database.ServerValue.TIMESTAMP,
      });

      return true;
    } catch (error) {
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;

    try {
      const requestRef = firebase.database().ref(`friendRequests/${requestId}`);
      const snapshot = await requestRef.once('value');
      const request = snapshot.val();

      if (!request) return;

      const fromUserRef = firebase.database().ref(`users/${request.fromUserId}`);
      const fromUserSnapshot = await fromUserRef.once('value');
      const fromUserData = fromUserSnapshot.val();

      const currentUserRef = firebase.database().ref(`users/${user.uid}`);
      const currentUserSnapshot = await currentUserRef.once('value');
      const currentUserData = currentUserSnapshot.val();

      // Freund zur eigenen Liste hinzufügen
      await firebase
        .database()
        .ref(`users/${user.uid}/friends/${request.fromUserId}`)
        .set({
          uid: request.fromUserId,
          email: fromUserData?.email,
          username: fromUserData?.username || 'unknown',
          displayName: fromUserData?.displayName || fromUserData?.username,
          photoURL: fromUserData?.photoURL || null,
          friendsSince: firebase.database.ServerValue.TIMESTAMP,
        });

      // Sich selbst zur Freundesliste hinzufügen
      await firebase
        .database()
        .ref(`users/${request.fromUserId}/friends/${user.uid}`)
        .set({
          uid: user.uid,
          email: user.email,
          username: currentUserData?.username || 'unknown',
          displayName:
            currentUserData?.displayName || currentUserData?.username || user.displayName,
          photoURL: currentUserData?.photoURL || user.photoURL || null,
          friendsSince: firebase.database.ServerValue.TIMESTAMP,
        });

      await firebase.database().ref(`friendRequests/${requestId}`).update({
        status: 'accepted',
        respondedAt: firebase.database.ServerValue.TIMESTAMP,
      });

      // Remove the request from local state immediately
      setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));

      // Refresh friends data FIRST to ensure database is updated
      await refetchFriends();

      // Badge-Check ausführen AFTER friend data is refreshed
      // Small delay to ensure database propagation
      setTimeout(async () => {
        try {
          const badgeSystem = getOfflineBadgeSystem(user.uid);
          badgeSystem.invalidateCache(); // Cache leeren für frische Friend-Zählung
          await badgeSystem.checkForNewBadges();

          // Also check for the friend who sent the request
          const friendBadgeSystem = getOfflineBadgeSystem(request.fromUserId);
          friendBadgeSystem.invalidateCache();
          await friendBadgeSystem.checkForNewBadges();
        } catch (badgeError) {
          console.error('Badge-Check Fehler nach Friend-Request:', badgeError);
        }
      }, 1000); // 1 second delay for database propagation
    } catch (error) {
      throw error;
    }
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;

    try {
      await firebase.database().ref(`friendRequests/${requestId}`).update({
        status: 'declined',
        respondedAt: firebase.database.ServerValue.TIMESTAMP,
      });

      // Remove the request from local state immediately
      setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      throw error;
    }
  };

  const cancelFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;

    try {
      // Delete the request from Firebase
      await firebase.database().ref(`friendRequests/${requestId}`).remove();

      // Remove from local state immediately
      setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      throw error;
    }
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!user) return;

    try {
      await firebase.database().ref(`users/${user.uid}/friends/${friendId}`).remove();

      await firebase.database().ref(`users/${friendId}/friends/${user.uid}`).remove();

      // Refresh friends data
      refetchFriends();
    } catch (error) {
      throw error;
    }
  };

  const updateUserActivity = async (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ): Promise<void> => {
    if (!user) return;

    try {
      const activitiesRef = firebase.database().ref(`activities/${user.uid}`);

      // Add new activity
      const newActivityRef = activitiesRef.push();
      await newActivityRef.set({
        ...activity,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Unbekannt',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });

      // Limit to max 30 activities per user
      const snapshot = await activitiesRef.orderByChild('timestamp').once('value');
      const activities = snapshot.val();

      if (activities) {
        const activityKeys = Object.keys(activities);
        if (activityKeys.length > 30) {
          // Sort by timestamp and remove oldest entries
          const sortedKeys = activityKeys.sort((a, b) => {
            const timestampA = activities[a].timestamp || 0;
            const timestampB = activities[b].timestamp || 0;
            return timestampA - timestampB;
          });

          // Remove excess activities (keep only newest 30)
          const toRemove = sortedKeys.slice(0, activityKeys.length - 30);
          const updates: { [key: string]: null } = {};
          toRemove.forEach((key) => {
            updates[key] = null;
          });

          await activitiesRef.update(updates);
        }
      }
    } catch (error) {
      // // console.warn('Failed to update user activity:', error);
    }
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
